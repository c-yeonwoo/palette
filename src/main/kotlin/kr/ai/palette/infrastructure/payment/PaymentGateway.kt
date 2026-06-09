package kr.ai.palette.infrastructure.payment

/**
 * 외부 결제 시스템(Toss / Mock) 통합 인터페이스. PA-002.
 *
 *  · Mock(dev/beta): 항상 성공, paymentKey 가짜값 OK
 *  · Toss(prod): 프론트 SDK 결제 위젯 → paymentKey 수신 → confirm API 검증
 */
interface PaymentGateway {
    /**
     * 프로필 단건 열람 결제 (legacy 경로 — paid_views).
     * 신규 티켓 묶음 충전은 [confirm] 사용.
     */
    fun processProfileViewPayment(
        buyerUserId: String,
        targetUserId: String,
        amount: Int,
        paymentKey: String? = null,
        orderId: String? = null
    ): PaymentGatewayResult

    /**
     * 일반 결제 confirm — 티켓 묶음 충전 / 구독 결제 공용.
     *
     * 프론트 SDK 가 결제 위젯에서 받은 (paymentKey, orderId) 와 사용자 의도
     * (expectedAmount) 를 백엔드가 검증. amount 위변조 시 실패.
     */
    fun confirm(
        orderId: String,
        paymentKey: String,
        expectedAmount: Int,
    ): PaymentGatewayResult
}

sealed class PaymentGatewayResult {
    data class Success(val transactionId: String) : PaymentGatewayResult()
    data class Failure(val reason: String) : PaymentGatewayResult()
}
