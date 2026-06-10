package kr.ai.palette.presentation.admin

import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.domain.billing.PointBundleCatalog
import kr.ai.palette.persistence.payment.PaymentTransactionJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant

/**
 * 운영자 결제 트랜잭션 조회. ADR 0044 운영 감사.
 *
 * Toss / Apple IAP / Google Play Billing / MOCK 영수증을 한 데서 조회.
 * 환불 처리는 P1 (지금은 read-only).
 * /api/v1/admin/&#42;&#42; 패스가 SecurityConfig hasRole("ADMIN") 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/payments")
class AdminPaymentsController(
    private val paymentTransactionJpaRepository: PaymentTransactionJpaRepository,
    private val billingService: BillingService,
) {

    private val log = LoggerFactory.getLogger(AdminPaymentsController::class.java)

    /**
     * 결제 트랜잭션 페이지네이션 조회.
     *
     * @param buyerUserId 옵셔널 — 특정 사용자만 필터
     * @param page 0-based, @param size 페이지 사이즈 (기본 20, 최대 100)
     */
    @GetMapping("/transactions")
    fun listTransactions(
        @RequestParam(required = false) buyerUserId: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ResponseEntity<Map<String, Any?>> {
        val pageable = PageRequest.of(page.coerceAtLeast(0), size.coerceIn(1, 100), Sort.by(Sort.Direction.DESC, "createdAt"))
        val pageResult = paymentTransactionJpaRepository.findAll(pageable)
        // buyerUserId 필터는 메모리에서 (PaymentTransactionJpaRepository 에 별도 페이지 메서드 미정의 — 베타 단순화)
        val filtered = if (!buyerUserId.isNullOrBlank()) {
            pageResult.content.filter { it.buyerUserId == buyerUserId.trim() }
        } else {
            pageResult.content
        }

        return ResponseEntity.ok(
            mapOf(
                "totalElements" to (if (buyerUserId.isNullOrBlank()) pageResult.totalElements else filtered.size.toLong()),
                "totalPages" to (if (buyerUserId.isNullOrBlank()) pageResult.totalPages else 1),
                "page" to pageResult.number,
                "size" to pageResult.size,
                "transactions" to filtered.map { tx ->
                    mapOf(
                        "id" to tx.id,
                        "buyerUserId" to tx.buyerUserId,
                        "targetUserId" to tx.targetUserId,
                        "amount" to tx.amount,
                        "paymentMethod" to tx.paymentMethod,
                        "provider" to tx.provider,
                        "providerReceiptId" to tx.providerReceiptId,
                        "status" to tx.status,
                        "createdAt" to tx.createdAt.toString(),
                        "refundedAt" to tx.refundedAt?.toString(),
                    )
                },
            )
        )
    }

    /**
     * 결제 환불 — ADR 0044 + POLICY §2 운영 처리.
     *
     * **베타 단계**: Toss/Apple/Google 외부 환불 API 는 stub (호출 X). DB·잔액만 갱신.
     *  · PaymentTransaction.status = "REFUNDED" + refundedAt = now
     *  · 구매자 잔액 차감 — 정책 §2 미사용분만 환불이라 차감 금액은 운영자 입력값 사용
     *    (충전된 묶음 보너스 포함 적립분 만큼 paidPoints 에서 빼고 부족분은 bonus 로 보정)
     *
     * **정식 단계 (PA refund sprint)**: PaymentGateway.refund(provider, receiptId, amount) 호출 후
     * 응답 성공 시에만 DB 갱신 (외부 API 우선, idempotent).
     *
     * @param refundPoints 차감할 물감 (충전된 묶음의 pointsCredited 또는 부분 환불값)
     */
    @PostMapping("/transactions/{id}/refund")
    @Transactional
    fun refund(
        @PathVariable id: String,
        @RequestBody req: RefundRequest,
    ): ResponseEntity<Map<String, Any?>> {
        if (req.refundPoints <= 0) {
            return ResponseEntity.badRequest().body(mapOf("error" to "refundPoints > 0"))
        }
        if (req.reason.isBlank()) {
            return ResponseEntity.badRequest().body(mapOf("error" to "사유(reason) 필수"))
        }

        val tx = paymentTransactionJpaRepository.findById(id).orElse(null)
            ?: return ResponseEntity.notFound().build()

        if (tx.status == "REFUNDED") {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                mapOf("error" to "ALREADY_REFUNDED", "refundedAt" to tx.refundedAt?.toString())
            )
        }

        // 보호 검증 — refundPoints 가 묶음 카탈로그 최대치 초과면 거절 (부분 환불도 허용 범위)
        val maxPoints = PointBundleCatalog.BUNDLES.maxOf { it.pointsCredited }
        if (req.refundPoints > maxPoints) {
            return ResponseEntity.badRequest().body(
                mapOf("error" to "refundPoints 가 카탈로그 최대(${maxPoints})를 초과합니다")
            )
        }

        // 잔액 차감 (BillingService 위임 — paid 우선, 부족분 bonus, 음수 클램프)
        val deduct = billingService.refundCharge(
            userId = tx.buyerUserId,
            points = req.refundPoints,
            reason = "admin_refund:txId=${tx.id}:${req.reason.take(48)}",
        )

        tx.status = "REFUNDED"
        tx.refundedAt = Instant.now()
        paymentTransactionJpaRepository.save(tx)

        log.info(
            "결제 환불 (stub) txId={} buyer={} refundPoints={} reason={}",
            tx.id, tx.buyerUserId, req.refundPoints, req.reason.take(48),
        )

        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "id" to tx.id,
                "status" to tx.status,
                "refundedAt" to tx.refundedAt?.toString(),
                "deductedFromPaid" to deduct.deductedFromPaid,
                "deductedFromBonus" to deduct.deductedFromBonus,
                "newPaidBalance" to deduct.newPaidBalance,
                "newBonusBalance" to deduct.newBonusBalance,
            )
        )
    }
}

data class RefundRequest(
    val refundPoints: Int,
    val reason: String,
)
