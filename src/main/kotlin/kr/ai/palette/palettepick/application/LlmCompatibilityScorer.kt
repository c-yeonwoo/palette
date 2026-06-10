package kr.ai.palette.palettepick.application

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.Profile
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.palettepick.domain.PalettePickScore
import kr.ai.palette.palettepick.persistence.CompatibilityAnalysisEntity
import kr.ai.palette.palettepick.persistence.CompatibilityAnalysisJpaRepository
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
 * LLM 매칭 궁합 분석 (ADR 0047 §B.3 Stage 3).
 *
 * 결정적 4축 점수 + 두 프로필 자연어 텍스트 → gpt-4o-mini 가 JSON 으로:
 *  - summary: 매칭 한 줄 요약 (60자 내외)
 *  - strengths[]: 두 사람의 잘 맞는 점 2~4개
 *  - watchOuts[]: 미리 알면 좋은 점 1~2개 (조심스럽게)
 *  - firstQuestion: 처음 만나서 던지면 좋을 질문 1개
 *
 * 안전바:
 *  1) stub 모드 (키 없으면 즉시 stub)
 *  2) hash 캐시 (inputsHash 동일 → 비용 0)
 *  3) timeout (connect 5s / read 15s)
 *  4) retry 1회 + fallback stub
 *  5) audit (LlmUsageLog purpose=palette_pick_score)
 *
 * 호출 측에서 rate limit 적용 — 본 서비스는 호출당 비용 모델만 책임.
 */
@Service
class LlmCompatibilityScorer(
    @Value("\${openai.api-key}")
    private val apiKey: String,
    @Value("\${openai.model:gpt-4o-mini}")
    private val model: String,
    restClientBuilder: RestClient.Builder,
    private val objectMapper: ObjectMapper,
    private val analysisRepository: CompatibilityAnalysisJpaRepository,
    private val usageLogRepository: LlmUsageLogJpaRepository,
    private val embeddingRefreshService: EmbeddingRefreshService,
    private val profileRepository: ProfileRepository,
) {

    private val log = LoggerFactory.getLogger(LlmCompatibilityScorer::class.java)

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
     * (viewer, candidate) 매칭 궁합 분석 — 캐시 우선, miss 시 LLM 호출.
     *
     * @param viewerId 추천 받는 사용자
     * @param candidateId 추천 후보
     * @param deterministicScore 결정적 4축 PalettePickScore (LLM 프롬프트 정보 + 캐시 기록용)
     * @return CompatibilityAnalysisEntity — 영속화된 분석 결과. null = 프로필 부재 / stub off 도 아님(불가능 케이스)
     */
    fun scoreOrCache(
        viewerId: UUID,
        candidateId: UUID,
        deterministicScore: PalettePickScore,
    ): CompatibilityAnalysisEntity? {
        val viewerProfile = profileRepository.findByUserId(UserId(viewerId)) ?: return null
        val candidateProfile = profileRepository.findByUserId(UserId(candidateId)) ?: return null

        val viewerIntro = embeddingRefreshService.buildIntroText(viewerProfile)
        val viewerIdeal = embeddingRefreshService.buildIdealText(viewerProfile)
        val candidateIntro = embeddingRefreshService.buildIntroText(candidateProfile)
        val candidateIdeal = embeddingRefreshService.buildIdealText(candidateProfile)

        // 캐시 키 — 양측 텍스트 + 모델 버전을 모두 포함. 텍스트 한 줄 바뀌면 해시도 다름.
        val inputsHash = sha256(
            buildString {
                append("v=1\n")
                append("model=").append(model).append('\n')
                append("vi=").append(viewerIntro).append('\n')
                append("vd=").append(viewerIdeal).append('\n')
                append("ci=").append(candidateIntro).append('\n')
                append("cd=").append(candidateIdeal).append('\n')
            }
        )

        val existing = analysisRepository.findByViewerUserIdAndCandidateUserId(viewerId, candidateId)
        if (existing != null && existing.inputsHash == inputsHash) {
            // 캐시 hit — 점수만 최신화 (deterministicScore 는 momentum 같은 변동 축 포함)
            existing.scoreDeterministic = deterministicScore.total
            existing.updatedAt = Instant.now()
            logUsage(viewerId.toString(), inputsHash, "CACHED", 0, 0, 0)
            return analysisRepository.save(existing)
        }

        val json = if (isStubMode) {
            stubJson(viewerProfile, candidateProfile, deterministicScore)
        } else {
            callLlm(viewerId, viewerIntro, viewerIdeal, candidateIntro, candidateIdeal, deterministicScore, inputsHash)
                ?: stubJson(viewerProfile, candidateProfile, deterministicScore)
        }

        return if (existing != null) {
            existing.inputsHash = inputsHash
            existing.summaryJson = json
            existing.scoreDeterministic = deterministicScore.total
            existing.modelVersion = model
            existing.updatedAt = Instant.now()
            analysisRepository.save(existing)
        } else {
            analysisRepository.save(
                CompatibilityAnalysisEntity(
                    viewerUserId = viewerId,
                    candidateUserId = candidateId,
                    inputsHash = inputsHash,
                    scoreDeterministic = deterministicScore.total,
                    summaryJson = json,
                    modelVersion = model,
                )
            )
        }
    }

    /** OpenAI 호출 (안전바 적용). 실패 시 null → 호출 측에서 stub fallback. */
    private fun callLlm(
        viewerId: UUID,
        viewerIntro: String,
        viewerIdeal: String,
        candidateIntro: String,
        candidateIdeal: String,
        score: PalettePickScore,
        inputsHash: String,
    ): String? {
        val userPrompt = buildUserPrompt(viewerIntro, viewerIdeal, candidateIntro, candidateIdeal, score)
        val body = mapOf(
            "model" to model,
            "messages" to listOf(
                mapOf("role" to "system", "content" to SYSTEM_PROMPT),
                mapOf("role" to "user", "content" to userPrompt),
            ),
            "response_format" to mapOf("type" to "json_object"),
            "max_tokens" to 600,  // summary + strengths + watchOuts + firstQuestion → 600 충분
            "temperature" to 0.6,
        )

        val startMs = System.currentTimeMillis()
        var attempt = 0
        val maxAttempts = 2
        var lastError: Exception? = null

        while (attempt < maxAttempts) {
            attempt++
            try {
                val response = restClient.post()
                    .uri("/v1/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map::class.java)
                    ?: throw IllegalStateException("No response from OpenAI")

                @Suppress("UNCHECKED_CAST")
                val content = (response["choices"] as List<Map<String, Any>>)
                    .first()
                    .let { it["message"] as Map<String, Any> }
                    .let { it["content"] as String }

                val usage = response["usage"] as? Map<String, Any>
                val inputTokens = (usage?.get("prompt_tokens") as? Number)?.toInt() ?: 0
                val outputTokens = (usage?.get("completion_tokens") as? Number)?.toInt() ?: 0
                val latency = System.currentTimeMillis() - startMs

                // 형식 검증 — JSON 파싱 실패면 retry
                runCatching { objectMapper.readValue<Map<String, Any?>>(content) }
                    .onFailure { throw IllegalStateException("LLM JSON 파싱 실패: ${it.message}") }

                logUsage(viewerId.toString(), inputsHash, "OK", latency, inputTokens, outputTokens)
                log.info(
                    "LLM 매칭 분석 성공 viewer={} hash={} latency={}ms in={} out={}",
                    viewerId, inputsHash.take(12), latency, inputTokens, outputTokens,
                )
                return content
            } catch (e: Exception) {
                lastError = e
                log.warn(
                    "LLM 매칭 분석 실패 attempt={}/{} viewer={} cause={} retry={}",
                    attempt, maxAttempts, viewerId, e.javaClass.simpleName,
                    if (attempt < maxAttempts) "yes" else "no (fallback)",
                )
            }
        }

        val latency = System.currentTimeMillis() - startMs
        logUsage(
            viewerId.toString(), inputsHash, "FAILED", latency, 0, 0,
            error = lastError?.let { "${it.javaClass.simpleName}: ${it.message?.take(150)}" },
        )
        log.error("LLM 매칭 분석 최종 실패 — stub fallback. viewer={} cause={}", viewerId, lastError?.message)
        return null
    }

    private fun buildUserPrompt(
        viewerIntro: String,
        viewerIdeal: String,
        candidateIntro: String,
        candidateIdeal: String,
        score: PalettePickScore,
    ): String = buildString {
        appendLine("【추천 받는 사람 A】")
        appendLine("[자기소개]")
        appendLine(viewerIntro.ifBlank { "(작성 안 됨)" })
        appendLine()
        appendLine("[원하는 이상형]")
        appendLine(viewerIdeal.ifBlank { "(작성 안 됨)" })
        appendLine()
        appendLine("【추천 후보 B】")
        appendLine("[자기소개]")
        appendLine(candidateIntro.ifBlank { "(작성 안 됨)" })
        appendLine()
        appendLine("[원하는 이상형]")
        appendLine(candidateIdeal.ifBlank { "(작성 안 됨)" })
        appendLine()
        appendLine("【결정적 점수 (0~1)】")
        appendLine("- 상호 이상형 적합도(mutual): ${"%.2f".format(score.mutualIdealFit)}")
        appendLine("- 자기소개 유사도(intro): ${"%.2f".format(score.introSimilarity)}")
        appendLine("- 색 궁합(color): ${"%.2f".format(score.colorCompatibility)}")
        appendLine("- 활동 모멘텀(momentum): ${"%.2f".format(score.momentum)}")
        appendLine("- 총점: ${score.total}/100")
    }

    /** stub mode — 결정적 점수 기반의 그럴듯한 한국어 mock JSON. */
    internal fun stubJson(viewer: Profile, candidate: Profile, score: PalettePickScore): String {
        val viewerColor = viewer.colorType?.name?.ifBlank { null } ?: "팔레트 색"
        val candidateColor = candidate.colorType?.name?.ifBlank { null } ?: "팔레트 색"
        val mutual = score.mutualIdealFit
        val sentence = when {
            mutual >= 0.5 -> "두 분 모두 서로의 이상형 결을 잘 맞춰가실 수 있을 것 같아요."
            mutual >= 0.25 -> "공통점이 보이고, 천천히 알아갈수록 가까워질 만한 조합이에요."
            else -> "결이 조금 달라 보이지만 서로의 결을 보완해줄 수 있는 사이가 될 수 있어요."
        }
        val map = mapOf(
            "summary" to "${viewerColor}와 ${candidateColor}의 만남 — $sentence",
            "strengths" to listOf("취향이 비슷한 결", "대화가 잘 통할 가능성", "관계 가치관의 결").take(
                if (mutual >= 0.4) 3 else 2
            ),
            "watchOuts" to listOf("처음에는 천천히 알아가시는 게 좋아요"),
            "firstQuestion" to "요즘 마음에 드는 순간은 언제였어요?",
        )
        return objectMapper.writeValueAsString(map)
    }

    // ─── 헬퍼 ────────────────────────────────────────────────

    private fun sha256(text: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(text.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    /** gpt-4o-mini 단가 — OpenAIService.estimateCostWon 과 동일. */
    private fun estimateCostWon(inputTokens: Int, outputTokens: Int): Int {
        val usd = (inputTokens * 0.15 + outputTokens * 0.60) / 1_000_000.0
        return (usd * 1_400).toInt().coerceAtLeast(0)
    }

    private fun logUsage(
        userId: String, inputHash: String?, outcome: String,
        latencyMs: Long, input: Int, output: Int, error: String? = null,
    ) {
        try {
            usageLogRepository.save(
                LlmUsageLogEntity(
                    userId = userId,
                    purpose = "palette_pick_score",
                    model = model,
                    inputTokens = input,
                    outputTokens = output,
                    costWon = estimateCostWon(input, output),
                    outcome = outcome,
                    latencyMs = latencyMs,
                    error = error,
                    inputHash = inputHash,
                )
            )
        } catch (e: Exception) {
            log.warn("LlmCompatibilityScorer usage log 저장 실패 cause={}", e.message)
        }
    }

    companion object {
        private const val SYSTEM_PROMPT = """
당신은 데이팅 앱 "팔레트"의 매칭 어시스턴트입니다.
두 사람(A, B)의 자기소개·이상형 정보와 4축 결정적 점수를 받아, 매칭 인사이트를 JSON 으로 반환합니다.

[반환 형식] 반드시 아래 JSON 만 출력 (다른 텍스트 X):
{
  "summary": "<60자 내외 한 줄 요약. 단정 금지, '~할 수 있을 것 같아요' 같은 추론형>",
  "strengths": ["<두 사람의 잘 맞는 점 2~4개. 각 12~20자 한국어 명사구>"],
  "watchOuts": ["<미리 알면 좋은 점 1~2개. 차분하고 조심스럽게>"],
  "firstQuestion": "<처음 만나서 던지면 좋을 질문 1개. 25자 내외>"
}

[원칙]
- 외모/스펙(키·직업·학력)으로 결론 짓지 말 것. 성향·가치관·관계 방식 중심.
- 점수 수치를 그대로 노출하지 말 것 (예: "50/100 점입니다" 금지).
- 1인칭 단정("너는 ~다", "둘은 잘 맞는다") 금지. "~할 가능성", "~한 결" 추론형.
- 부정적 표현 최소. 단점 지적이 필요해도 차분하고 건강한 톤.
- 두 사람의 자기소개·이상형에 실제로 적힌 내용을 근거로. 지어내지 말 것.
"""
    }
}
