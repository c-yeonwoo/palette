package kr.ai.palette.presentation.admin

import kr.ai.palette.persistence.ai.LlmUsageLogJpaRepository
import kr.ai.palette.persistence.ai.ProfileGenerationCacheJpaRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.Instant

/**
 * 어드민 — LLM 호출 가시화 (ADR 0047 안전바 + 운영 감사 E3).
 *
 * 호출 outcome 별 집계 + 비용 추적 + 최근 호출 이력.
 * /api/v1/admin/&#42;&#42; SecurityConfig hasRole("ADMIN") 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/llm")
class AdminLlmUsageController(
    private val usageLogRepository: LlmUsageLogJpaRepository,
    private val cacheRepository: ProfileGenerationCacheJpaRepository,
) {

    /**
     * LLM 사용 요약 — 오늘 / 7일 / 누적 호출 outcome + 비용 + 캐시 hit률.
     */
    @GetMapping("/summary")
    fun summary(): ResponseEntity<Map<String, Any?>> {
        val now = Instant.now()
        val todayStart = now.minusSeconds(86_400)
        val weekStart = now.minusSeconds(7L * 86_400)
        val all = usageLogRepository.findAll()

        fun bucket(after: Instant) = all.filter { it.createdAt.isAfter(after) }

        fun aggregate(items: List<kr.ai.palette.persistence.ai.LlmUsageLogEntity>): Map<String, Any?> {
            val byOutcome = items.groupBy { it.outcome }
            val ok = byOutcome["OK"] ?: emptyList()
            val cached = byOutcome["CACHED"] ?: emptyList()
            val failed = byOutcome["FAILED"] ?: emptyList()
            val rateLimited = byOutcome["RATE_LIMITED"] ?: emptyList()
            val totalCalls = ok.size + cached.size + failed.size + rateLimited.size
            val cacheHitRate = if (totalCalls > 0) cached.size * 100.0 / totalCalls else 0.0
            return mapOf(
                "total" to totalCalls,
                "ok" to ok.size,
                "cached" to cached.size,
                "failed" to failed.size,
                "rateLimited" to rateLimited.size,
                "cacheHitRatePercent" to "%.1f".format(cacheHitRate),
                "totalCostWon" to ok.sumOf { it.costWon },
                "avgLatencyMs" to if (ok.isNotEmpty()) ok.sumOf { it.latencyMs } / ok.size else 0,
                "totalInputTokens" to ok.sumOf { it.inputTokens },
                "totalOutputTokens" to ok.sumOf { it.outputTokens },
            )
        }

        val cacheStats = cacheRepository.findAll()
        val cacheEntries = cacheStats.size
        val cacheHitsTotal = cacheStats.sumOf { it.hitCount }
        val estimatedSavedWon = cacheHitsTotal * 14 // 1건 평균 14원 절감 추정

        return ResponseEntity.ok(
            mapOf(
                "today" to aggregate(bucket(todayStart)),
                "last7d" to aggregate(bucket(weekStart)),
                "total" to aggregate(all),
                "cache" to mapOf(
                    "entries" to cacheEntries,
                    "totalHits" to cacheHitsTotal,
                    "estimatedSavedWon" to estimatedSavedWon,
                ),
                "generatedAt" to now.toString(),
            )
        )
    }

    /**
     * 최근 LLM 호출 이력 (페이지네이션 + outcome 필터).
     */
    @GetMapping("/calls")
    fun calls(
        @RequestParam(required = false) outcome: String?,
        @RequestParam(required = false) userId: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "50") size: Int,
    ): ResponseEntity<Map<String, Any?>> {
        val pageable = PageRequest.of(page.coerceAtLeast(0), size.coerceIn(1, 200),
            Sort.by(Sort.Direction.DESC, "createdAt"))
        val pageResult = usageLogRepository.findAll(pageable)
        val filtered = pageResult.content.filter { log ->
            (outcome.isNullOrBlank() || log.outcome == outcome.trim().uppercase()) &&
            (userId.isNullOrBlank() || log.userId == userId.trim())
        }

        return ResponseEntity.ok(
            mapOf(
                "totalElements" to pageResult.totalElements,
                "totalPages" to pageResult.totalPages,
                "page" to pageResult.number,
                "size" to pageResult.size,
                "calls" to filtered.map { log ->
                    mapOf(
                        "id" to log.id.toString(),
                        "userId" to log.userId,
                        "purpose" to log.purpose,
                        "model" to log.model,
                        "inputTokens" to log.inputTokens,
                        "outputTokens" to log.outputTokens,
                        "costWon" to log.costWon,
                        "outcome" to log.outcome,
                        "latencyMs" to log.latencyMs,
                        "error" to log.error,
                        "inputHash" to log.inputHash?.take(12),
                        "createdAt" to log.createdAt.toString(),
                    )
                },
            )
        )
    }
}
