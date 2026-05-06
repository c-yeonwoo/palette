package kr.ai.palette.infrastructure.payment

interface PaymentGateway {
    /**
     * 프로필 열람 결제를 처리합니다.
     *
     * Mock(dev): paymentKey/orderId 불필요, 항상 성공.
     * Toss(prod): 프론트엔드 SDK에서 받은 paymentKey/orderId로 Toss confirm API 호출.
     */
    fun processProfileViewPayment(
        buyerUserId: String,
        targetUserId: String,
        amount: Int,
        paymentKey: String? = null,
        orderId: String? = null
    ): PaymentGatewayResult
}

sealed class PaymentGatewayResult {
    data class Success(val transactionId: String) : PaymentGatewayResult()
    data class Failure(val reason: String) : PaymentGatewayResult()
}
