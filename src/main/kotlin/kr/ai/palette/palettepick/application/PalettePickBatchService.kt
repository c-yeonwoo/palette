package kr.ai.palette.palettepick.application

import kr.ai.palette.domain.user.User
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.palettepick.persistence.PalettePickBatchRunEntity
import kr.ai.palette.palettepick.persistence.PalettePickBatchRunJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit

/**
 * 팔레트픽 LLM 매칭 분석 사전 생성 배치 (ADR 0047 §B.3 Stage 3).
 *
 * 자정 KST 마다 실행 → 활성 사용자 순회 → 후보 풀 산출 → Top N 에 대해 LLM 분석 미리 캐싱.
 * 다음 날 사용자가 추천을 열람할 때는 이미 캐시 hit → 응답 빠름 + 비용 0.
 *
 * 활성 기준:
 *  · 최근 7일 내 로그인
 *  · 프로필 완성
 *  · accountType = REGULAR
 *  · 탈퇴/정지 아님
 *
 * 비용 보호:
 *  · per-viewer 후보는 Top 8 만 (그 이상은 noise)
 *  · per-night 호출 상한 (palette-pick.batch.max-calls, default 500)
 *  · LlmCompatibilityScorer 의 inputsHash 캐시로 동일 입력은 LLM 호출 없음
 *
 * 비활성화: `palette-pick.batch.enabled=false` (테스트/로컬에서 자동 트리거 방지)
 */
@Service
class PalettePickBatchService(
    private val userRepository: UserRepository,
    private val recommendationService: PalettePickRecommendationService,
    private val mutualFitScoringService: MutualFitScoringService,
    private val candidatePoolService: CandidatePoolService,
    private val embeddingRefreshService: EmbeddingRefreshService,
    private val colorCompatibilityService: ColorCompatibilityService,
    private val activityMomentumService: ActivityMomentumService,
    private val llmCompatibilityScorer: LlmCompatibilityScorer,
    private val profileRepositoryAdapter: kr.ai.palette.domain.profile.ProfileRepository,
    private val batchRunRepo: PalettePickBatchRunJpaRepository,
    @Value("\${palette-pick.batch.enabled:true}")
    private val enabled: Boolean,
    @Value("\${palette-pick.batch.top-n:8}")
    private val topN: Int,
    @Value("\${palette-pick.batch.max-calls:500}")
    private val maxCallsPerNight: Int,
    @Value("\${palette-pick.batch.active-days:7}")
    private val activeWindowDays: Long,
) {
    private val log = LoggerFactory.getLogger(PalettePickBatchService::class.java)

    /** 자정 KST — 매일 00:30 (트래픽 최저, embedding/매칭 API 부하 분산). */
    @Scheduled(cron = "0 30 0 * * *", zone = "Asia/Seoul")
    fun runNightly() {
        execute("SCHEDULED")
    }

    /**
     * 실행 본체 — 결과를 PalettePickBatchRun 으로 영속화 (어드민 관측 SoT).
     * @return 저장된 실행 기록 (수동 실행 시 프론트가 즉시 결과 표시).
     */
    fun execute(trigger: String): PalettePickBatchRunEntity {
        val today = LocalDate.now(KST)

        if (!enabled) {
            log.info("팔레트픽 배치 비활성화 — skip")
            return batchRunRepo.save(
                PalettePickBatchRunEntity(
                    runDate = today.toString(),
                    trigger = trigger,
                    status = "SKIPPED",
                    finishedAt = Instant.now(),
                )
            )
        }

        val run = batchRunRepo.save(
            PalettePickBatchRunEntity(runDate = today.toString(), trigger = trigger, status = "RUNNING")
        )

        val activeSince = Instant.now().minus(activeWindowDays, ChronoUnit.DAYS)
        val activeUsers = userRepository.findAll().filter { isActiveForBatch(it, activeSince) }

        log.info("팔레트픽 배치 시작 — date={} 활성 사용자={} top-N={} max-calls={} trigger={}",
            today, activeUsers.size, topN, maxCallsPerNight, trigger)

        var calls = 0
        var viewers = 0
        var failures = 0
        var hitCallCap = false
        val errors = mutableListOf<String>()
        try {
            for (viewer in activeUsers) {
                if (calls >= maxCallsPerNight) {
                    hitCallCap = true
                    log.warn("팔레트픽 배치 호출 상한 도달 — viewers={} calls={}", viewers, calls)
                    break
                }
                try {
                    calls += processViewer(viewer, today, maxCallsPerNight - calls)
                    viewers++
                } catch (e: Exception) {
                    failures++
                    if (errors.size < 5) errors.add("viewer=${viewer.id.value}: ${e.message}")
                    log.warn("팔레트픽 배치 viewer={} 실패 cause={}", viewer.id.value, e.message)
                }
            }
            run.status = if (failures > 0) "PARTIAL" else "SUCCESS"
        } catch (e: Exception) {
            run.status = "FAILED"
            errors.add(0, "batch: ${e.message}")
            log.error("팔레트픽 배치 중단 — cause={}", e.message, e)
        } finally {
            run.finishedAt = Instant.now()
            run.activeUsers = activeUsers.size
            run.viewersProcessed = viewers
            run.llmCalls = calls
            run.failures = failures
            run.hitCallCap = hitCallCap
            run.errorSample = errors.joinToString("\n").take(500).ifBlank { null }
            batchRunRepo.save(run)
        }
        log.info("팔레트픽 배치 완료 — status={} viewers={} calls={} failures={}",
            run.status, viewers, calls, failures)
        return run
    }

    /** @return 이 viewer 에 대해 발생한 LLM 호출 시도 수 (cache hit 포함). */
    private fun processViewer(viewer: User, today: LocalDate, budget: Int): Int {
        if (budget <= 0) return 0

        val pool = candidatePoolService.build(viewer, today, maxSize = topN.coerceAtMost(budget))
        if (pool.isEmpty()) return 0

        embeddingRefreshService.refreshIfStale(viewer.id.value)
        embeddingRefreshService.bulkRefreshIfStale(pool)

        val viewerColor = profileRepositoryAdapter.findByUserId(viewer.id)?.colorType?.type
        val candidateColors = pool.associateWith { uid ->
            profileRepositoryAdapter.findByUserId(kr.ai.palette.domain.common.UserId(uid))?.colorType?.type
        }
        val momentumBatch = activityMomentumService.batchMomentum(pool)

        val scores = mutualFitScoringService.batchScore(
            viewerId = viewer.id.value,
            candidateIds = pool,
        ) { candidateId ->
            val color = colorCompatibilityService.score(viewerColor, candidateColors[candidateId])
            val momentum = momentumBatch[candidateId] ?: 0.0
            color to momentum
        }

        // Top-N 결정 후 LLM 분석 생성/갱신
        val topCandidates = scores.entries
            .sortedByDescending { it.value.total }
            .take(topN.coerceAtMost(budget))

        var used = 0
        for ((candidateId, score) in topCandidates) {
            if (used >= budget) break
            llmCompatibilityScorer.scoreOrCache(viewer.id.value, candidateId, score)
            used++
        }
        return used
    }

    private fun isActiveForBatch(user: User, activeSince: Instant): Boolean =
        user.isActive()
            && user.canUseMatchingService()
            && user.metadata.lastLoginAt.isAfter(activeSince)

    /** 동일 로직을 운영자 / 테스트에서 트리거할 수 있는 공개 진입점. */
    fun runOnceNow(): PalettePickBatchRunEntity = execute("MANUAL")

    companion object {
        private val KST = ZoneId.of("Asia/Seoul")
    }
}
