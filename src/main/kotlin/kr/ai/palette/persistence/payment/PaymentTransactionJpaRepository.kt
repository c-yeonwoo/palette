package kr.ai.palette.persistence.payment

import org.springframework.data.jpa.repository.JpaRepository

interface PaymentTransactionJpaRepository : JpaRepository<PaymentTransactionEntity, String> {
    fun findByBuyerUserIdOrderByCreatedAtDesc(buyerUserId: String): List<PaymentTransactionEntity>

    /**
     * PA-001 멱등 조회 — 동일 외부 영수증 (Toss paymentKey / Apple originalTransactionId /
     * Google purchaseToken) 이 이미 처리됐는지 확인. 같은 영수증으로 두 번 charge 호출 시
     * Phase B 결제 서비스가 이 메서드로 차단.
     */
    fun findByProviderAndProviderReceiptId(
        provider: String,
        providerReceiptId: String,
    ): PaymentTransactionEntity?
}
