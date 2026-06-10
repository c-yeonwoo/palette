package kr.ai.palette.presentation.admin

import kr.ai.palette.persistence.payment.PaymentTransactionJpaRepository
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

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
) {

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
                        "createdAt" to tx.createdAt.toString(),
                    )
                },
            )
        )
    }
}
