package kr.ai.palette.infrastructure.payment

/**
 * 결제 게이트웨이 인터페이스
 */
interface PaymentGateway {
    /**
     * 프로필 열람 결제를 처리합니다.
     * @return 트랜잭션 ID (성공 시), null (실패 시)
     */
    fun processProfileViewPayment(buyerUserId: String, targetUserId: String, amount: Int): PaymentGatewayResult
}

sealed class PaymentGatewayResult {
    data class Success(val transactionId: String) : PaymentGatewayResult()
    data class Failure(val reason: String) : PaymentGatewayResult()
}
