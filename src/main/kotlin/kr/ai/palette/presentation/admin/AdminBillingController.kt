package kr.ai.palette.presentation.admin

import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.persistence.billing.AdminBillingGrantEntity
import kr.ai.palette.persistence.billing.AdminBillingGrantJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * 어드민 수동 물감 충전 + 이력 조회. ADR 0044 (가격 v2) 운영 감사 트랙.
 *
 * 운영자가 사용자에게 물감을 직접 지급:
 *  · CS 응대 (예: 결제 누락 보정)
 *  · 보상 / 사과 (예: 매칭 실패 보상)
 *  · 이벤트 / 캠페인 (예: 1주년 기념)
 *
 * 모든 지급은 audit log (AdminBillingGrantEntity) 에 영속화.
 * admin API 는 SecurityConfig 에서 hasRole(ADMIN) 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/billing")
class AdminBillingController(
    private val billingService: BillingService,
    private val adminBillingGrantRepository: AdminBillingGrantJpaRepository,
) {

    private val log = LoggerFactory.getLogger(AdminBillingController::class.java)

    /**
     * 수동 충전.
     *
     * @param recipientUserId 받는 사용자 ID
     * @param amountPoints 적립 물감 수 (1 이상)
     * @param grantType "BONUS" or "PAID"
     * @param validDays 보너스 만료(일). PAID 면 무시. null = 무기한(BONUS) / 무관(PAID)
     * @param reason 운영자 입력 사유 (필수)
     */
    @PostMapping("/grant")
    @Transactional
    fun grant(
        @AuthenticationPrincipal admin: AuthUser,
        @RequestBody req: GrantRequest,
    ): ResponseEntity<Map<String, Any?>> {
        if (req.amountPoints <= 0) {
            return ResponseEntity.badRequest().body(mapOf("error" to "amountPoints 는 1 이상이어야 합니다"))
        }
        if (req.reason.isBlank()) {
            return ResponseEntity.badRequest().body(mapOf("error" to "사유(reason) 는 필수입니다"))
        }
        if (req.grantType !in setOf("BONUS", "PAID")) {
            return ResponseEntity.badRequest().body(mapOf("error" to "grantType 은 BONUS 또는 PAID"))
        }

        val recipient = req.recipientUserId.trim()
        if (recipient.isBlank()) {
            return ResponseEntity.badRequest().body(mapOf("error" to "recipientUserId 필수"))
        }
        // 형식 검증 (UUID 가정)
        try { UUID.fromString(recipient) } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().body(mapOf("error" to "recipientUserId 형식 오류 (UUID)"))
        }

        // 1) 실 잔액 갱신
        val balance = when (req.grantType) {
            "BONUS" -> billingService.grantBonus(
                userId = recipient,
                points = req.amountPoints,
                validDays = req.validDays,
                reason = "admin_grant:${req.reason.take(48)}",
            )
            else -> billingService.creditPaidPoints(
                userId = recipient,
                points = req.amountPoints,
                provider = "ADMIN_MANUAL",
                providerReceiptId = "admin:${admin.userId.value}:${UUID.randomUUID()}",
            )
        }

        // 2) audit log
        val grantedRecord = adminBillingGrantRepository.save(
            AdminBillingGrantEntity(
                recipientUserId = recipient,
                granterAdminUserId = admin.userId.value.toString(),
                amountPoints = req.amountPoints,
                grantType = req.grantType,
                validDays = req.validDays,
                reason = req.reason.trim().take(200),
            )
        )

        log.info(
            "어드민 수동 충전 admin={} recipient={} +{}P type={} reason={}",
            admin.userId.value, recipient, req.amountPoints, req.grantType, req.reason.take(48),
        )

        return ResponseEntity.ok(
            mapOf(
                "id" to grantedRecord.id.toString(),
                "recipientUserId" to recipient,
                "amountPoints" to req.amountPoints,
                "grantType" to req.grantType,
                "newBonusBalance" to balance.bonusPoints,
                "newPaidBalance" to balance.paidPoints,
                "totalBalance" to (balance.bonusPoints + balance.paidPoints),
                "grantedAt" to grantedRecord.grantedAt.toString(),
            )
        )
    }

    /**
     * 수동 충전 이력 조회 (페이지네이션).
     *
     * @param recipientUserId 옵셔널 — 특정 사용자만 필터
     * @param page 0-based, @param size 페이지 사이즈 (기본 20, 최대 100)
     */
    @GetMapping("/grants")
    fun listGrants(
        @RequestParam(required = false) recipientUserId: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ResponseEntity<Map<String, Any?>> {
        val pageable = PageRequest.of(page.coerceAtLeast(0), size.coerceIn(1, 100))
        val pageResult = if (!recipientUserId.isNullOrBlank()) {
            adminBillingGrantRepository.findByRecipientUserIdOrderByGrantedAtDesc(recipientUserId.trim(), pageable)
        } else {
            adminBillingGrantRepository.findAllByOrderByGrantedAtDesc(pageable)
        }

        return ResponseEntity.ok(
            mapOf(
                "totalElements" to pageResult.totalElements,
                "totalPages" to pageResult.totalPages,
                "page" to pageResult.number,
                "size" to pageResult.size,
                "grants" to pageResult.content.map { g ->
                    mapOf(
                        "id" to g.id.toString(),
                        "recipientUserId" to g.recipientUserId,
                        "granterAdminUserId" to g.granterAdminUserId,
                        "amountPoints" to g.amountPoints,
                        "grantType" to g.grantType,
                        "validDays" to g.validDays,
                        "reason" to g.reason,
                        "grantedAt" to g.grantedAt.toString(),
                    )
                },
            )
        )
    }
}

data class GrantRequest(
    val recipientUserId: String,
    val amountPoints: Int,
    val grantType: String,       // "BONUS" | "PAID"
    val validDays: Int? = null,
    val reason: String,
)
