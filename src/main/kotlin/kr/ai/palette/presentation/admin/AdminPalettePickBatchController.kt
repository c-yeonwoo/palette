package kr.ai.palette.presentation.admin

import kr.ai.palette.palettepick.application.PalettePickBatchService
import kr.ai.palette.palettepick.persistence.PalettePickBatchRunEntity
import kr.ai.palette.palettepick.persistence.PalettePickBatchRunJpaRepository
import org.springframework.data.domain.PageRequest
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * 어드민 — 팔레트픽 야간 배치 관측 (ADR 0047 §B.3).
 *
 * 배치는 매일 00:30 KST 스케줄로 돌지만 결과가 로그로만 남아 어드민에서 볼 수 없었다.
 * 실행 기록(PalettePickBatchRun)을 조회 + 수동 실행 트리거 제공.
 *
 * /api/v1/admin/&#42;&#42; SecurityConfig hasRole("ADMIN") 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/palette-pick/batch")
class AdminPalettePickBatchController(
    private val batchRunRepo: PalettePickBatchRunJpaRepository,
    private val batchService: PalettePickBatchService,
) {

    /** 최근 실행 목록 (최신순) + 최신 실행 요약. */
    @GetMapping("/runs")
    fun runs(
        @RequestParam(defaultValue = "30") limit: Int,
    ): ResponseEntity<Map<String, Any?>> {
        val runs = batchRunRepo.findAllByOrderByStartedAtDesc(
            PageRequest.of(0, limit.coerceIn(1, 100))
        )
        return ResponseEntity.ok(
            mapOf(
                "latest" to runs.firstOrNull()?.let(::toView),
                "runs" to runs.map(::toView),
            )
        )
    }

    /**
     * 배치 수동 실행 — 결과를 즉시 반환.
     * 콜드스타트 관측(활성 사용자 0 → no-op 확인)이나 배포 후 동작 검증에 사용.
     */
    @PostMapping("/run")
    fun runNow(): ResponseEntity<Map<String, Any?>> {
        val run = batchService.runOnceNow()
        return ResponseEntity.ok(toView(run))
    }

    private fun toView(r: PalettePickBatchRunEntity): Map<String, Any?> = mapOf(
        "id" to r.id.toString(),
        "runDate" to r.runDate,
        "trigger" to r.trigger,
        "status" to r.status,
        "startedAt" to r.startedAt.toString(),
        "finishedAt" to r.finishedAt?.toString(),
        "durationMs" to r.durationMs,
        "activeUsers" to r.activeUsers,
        "viewersProcessed" to r.viewersProcessed,
        "llmCalls" to r.llmCalls,
        "failures" to r.failures,
        "hitCallCap" to r.hitCallCap,
        "errorSample" to r.errorSample,
    )
}
