package kr.ai.palette.presentation.admin

import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.persistence.safety.ReportJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

/**
 * 운영자 신고 검토 (ADR 0023 + 0046). admin API 는 hasRole(ADMIN) 강제.
 *
 * 외부 송금 유도 신고 (EXTERNAL_PAYMENT_INDUCEMENT) 확정(CONFIRMED) 시
 * 신고자에게 50 물감 보상 자동 지급 (ADR 0046 §E).
 */
@RestController
@RequestMapping("/api/v1/admin/reports")
class AdminReportsController(
    private val reportJpaRepository: ReportJpaRepository,
    private val billingService: BillingService,
) {

    private val log = LoggerFactory.getLogger(AdminReportsController::class.java)

    /**
     * 신고 목록.
     * @param status PENDING / REVIEWED — null 이면 전체
     * @param reason 카테고리 필터 — null 이면 전체 (FAKE_PROFILE / HARASSMENT / ... / EXTERNAL_PAYMENT_INDUCEMENT)
     */
    @GetMapping
    fun list(
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) reason: String?,
    ): ResponseEntity<List<Map<String, Any?>>> {
        val all = if (status != null) {
            reportJpaRepository.findByStatusOrderByCreatedAtDesc(status.uppercase())
        } else {
            reportJpaRepository.findAllByOrderByCreatedAtDesc()
        }
        val filtered = if (!reason.isNullOrBlank()) {
            all.filter { it.reason == reason.trim().uppercase() }
        } else {
            all
        }
        return ResponseEntity.ok(filtered.map {
            mapOf(
                "id" to it.id.toString(),
                "reporterUserId" to it.reporterUserId.toString(),
                "reportedUserId" to it.reportedUserId.toString(),
                "reason" to it.reason,
                "detail" to it.detail,
                "status" to it.status,
                "createdAt" to it.createdAt.toString(),
            )
        })
    }

    /**
     * 신고 처리 완료 (REVIEWED).
     *
     * @param confirmReward true 면 위반 확정 — EXTERNAL_PAYMENT_INDUCEMENT 카테고리일 경우
     *                       신고자에게 [SIX_REWARD_POINTS] 물감 보상 자동 지급 (ADR 0046 §E).
     *                       false 면 단순 종결 (기각·미확정).
     */
    @PatchMapping("/{id}/review")
    @Transactional
    fun markReviewed(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "false") confirmReward: Boolean,
    ): ResponseEntity<Map<String, Any?>> {
        val report = reportJpaRepository.findById(id).orElse(null)
            ?: return ResponseEntity.notFound().build()
        report.status = "REVIEWED"
        reportJpaRepository.save(report)

        var rewardedPoints = 0
        if (confirmReward && report.reason == "EXTERNAL_PAYMENT_INDUCEMENT") {
            try {
                billingService.grantBonus(
                    userId = report.reporterUserId.toString(),
                    points = SIX_REWARD_POINTS,
                    validDays = null, // 무기한
                    reason = "report_reward:external_payment_inducement:${id}",
                )
                rewardedPoints = SIX_REWARD_POINTS
                log.info(
                    "§6 신고 확정 보상 reporter={} +{}P reportId={}",
                    report.reporterUserId, SIX_REWARD_POINTS, id,
                )
            } catch (e: Exception) {
                log.warn("§6 신고 보상 지급 실패 reportId={} cause={}", id, e.message)
            }
        }

        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "status" to "REVIEWED",
                "reviewedAt" to Instant.now().toString(),
                "rewardedPoints" to rewardedPoints,
            )
        )
    }

    companion object {
        /** ADR 0046 §E — 외부 송금 유도 신고 확정 시 신고자 보상. */
        const val SIX_REWARD_POINTS: Int = 50
    }
}
