package kr.ai.palette.palettepick.application

import kr.ai.palette.palettepick.persistence.ProfileEmbeddingEntity
import kr.ai.palette.palettepick.persistence.ProfileEmbeddingJpaRepository
import kr.ai.palette.persistence.ai.LlmUsageLogEntity
import kr.ai.palette.persistence.ai.LlmUsageLogJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import java.security.MessageDigest
import java.time.Duration
import java.time.Instant
import java.util.UUID

/**
 * OpenAI text-embedding-3-small 호출 + 캐싱 (ADR 0047 §B.3a).
 *
 * 호출 단가: $0.020 / 1M tokens — 한 프로필 임베딩 ~200 토큰 = $0.000004 = **0.006원**.
 * 사실상 무료. 단 audit log 와 안전바는 동일 적용 (LlmUsageLog 재사용, purpose="profile_embedding").
 *
 * 스킵 조건: 입력 텍스트 SHA-256 hash 가 기존 저장된 hash 와 같으면 호출 X.
 */
@Service
class EmbeddingService(
    @Value("\${openai.api-key}")
    private val apiKey: String,
    @Value("\${openai.embedding.model:text-embedding-3-small}")
    private val model: String,
    restClientBuilder: RestClient.Builder,
    private val embeddingRepository: ProfileEmbeddingJpaRepository,
    private val usageLogRepository: LlmUsageLogJpaRepository,
) {

    private val log = LoggerFactory.getLogger(EmbeddingService::class.java)

    private val restClient: RestClient = restClientBuilder
        .baseUrl("https://api.openai.com")
        .defaultHeader("Authorization", "Bearer $apiKey")
        .requestFactory(SimpleClientHttpRequestFactory().apply {
            setConnectTimeout(Duration.ofSeconds(5))
            setReadTimeout(Duration.ofSeconds(15))
        })
        .build()

    private val isStubMode: Boolean
        get() = apiKey.isBlank() || apiKey.startsWith("dummy") || apiKey.contains("placeholder")

    /**
     * 사용자 프로필 임베딩 갱신 (intro + ideal 분리).
     *
     * 같은 텍스트면 스킵 (hash 비교) — 신규 호출 없음.
     * 둘 중 한 쪽만 변경됐어도 변경된 쪽만 재임베딩.
     *
     * @return 갱신/스킵된 entity (null = 두 텍스트 다 빈 입력으로 임베딩 무의미)
     */
    fun refreshEmbedding(
        userId: UUID,
        introText: String,
        idealText: String,
    ): ProfileEmbeddingEntity? {
        if (introText.isBlank() && idealText.isBlank()) return null

        val introHash = sha256(introText)
        val idealHash = sha256(idealText)

        val existing = embeddingRepository.findById(userId).orElse(null)
        if (existing != null
            && existing.introHash == introHash
            && existing.idealHash == idealHash
            && existing.model == model
        ) {
            log.debug("임베딩 스킵 user={} hash 동일", userId)
            return existing
        }

        val introVec = embed(userId.toString(), introText.ifBlank { "(빈 프로필)" }, purpose = "profile_embedding_intro")
        val idealVec = embed(userId.toString(), idealText.ifBlank { "(빈 이상형)" }, purpose = "profile_embedding_ideal")

        return if (existing != null) {
            existing.introEmbedding = ProfileEmbeddingEntity.pack(introVec)
            existing.idealEmbedding = ProfileEmbeddingEntity.pack(idealVec)
            existing.introHash = introHash
            existing.idealHash = idealHash
            existing.model = model
            existing.updatedAt = Instant.now()
            embeddingRepository.save(existing)
        } else {
            embeddingRepository.save(
                ProfileEmbeddingEntity(
                    userId = userId,
                    introEmbedding = ProfileEmbeddingEntity.pack(introVec),
                    idealEmbedding = ProfileEmbeddingEntity.pack(idealVec),
                    model = model,
                    introHash = introHash,
                    idealHash = idealHash,
                )
            )
        }
    }

    /** 단일 텍스트 임베딩 호출 — 안전바: timeout/retry/fallback (zero vector)/audit. */
    private fun embed(userId: String, text: String, purpose: String): FloatArray {
        if (isStubMode) return FloatArray(ProfileEmbeddingEntity.DIMENSION) { 0f }

        val startMs = System.currentTimeMillis()
        var attempt = 0
        val maxAttempts = 2
        var lastError: Exception? = null

        while (attempt < maxAttempts) {
            attempt++
            try {
                val body = mapOf("model" to model, "input" to text)
                val response = restClient.post()
                    .uri("/v1/embeddings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map::class.java)
                    ?: throw IllegalStateException("No response from OpenAI embeddings")

                @Suppress("UNCHECKED_CAST")
                val data = response["data"] as List<Map<String, Any>>
                @Suppress("UNCHECKED_CAST")
                val vec = (data.first()["embedding"] as List<Number>).map { it.toFloat() }.toFloatArray()

                val usage = response["usage"] as? Map<String, Any>
                val tokens = (usage?.get("total_tokens") as? Number)?.toInt() ?: 0
                logUsage(userId, purpose, "OK", System.currentTimeMillis() - startMs, tokens, 0)
                return vec
            } catch (e: Exception) {
                lastError = e
                log.warn("임베딩 호출 실패 attempt={}/{} cause={}", attempt, maxAttempts, e.javaClass.simpleName)
            }
        }

        // 최종 실패 — fallback zero vector + audit
        logUsage(
            userId, purpose, "FAILED", System.currentTimeMillis() - startMs, 0, 0,
            error = lastError?.let { "${it.javaClass.simpleName}: ${it.message?.take(150)}" },
        )
        log.error("임베딩 호출 최종 실패 — zero vector 적용. user={} cause={}", userId, lastError?.message)
        return FloatArray(ProfileEmbeddingEntity.DIMENSION) { 0f }
    }

    private fun sha256(text: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(text.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    /** text-embedding-3-small 단가 $0.020/1M. KRW 1,400. */
    private fun estimateCostWon(tokens: Int): Int {
        val usd = tokens * 0.020 / 1_000_000.0
        return (usd * 1_400).toInt().coerceAtLeast(0)
    }

    private fun logUsage(
        userId: String, purpose: String, outcome: String,
        latencyMs: Long, input: Int, output: Int, error: String? = null,
    ) {
        try {
            usageLogRepository.save(
                LlmUsageLogEntity(
                    userId = userId,
                    purpose = purpose,
                    model = model,
                    inputTokens = input,
                    outputTokens = output,
                    costWon = estimateCostWon(input + output),
                    outcome = outcome,
                    latencyMs = latencyMs,
                    error = error,
                )
            )
        } catch (e: Exception) {
            log.warn("EmbeddingService usage log 저장 실패 cause={}", e.message)
        }
    }
}
