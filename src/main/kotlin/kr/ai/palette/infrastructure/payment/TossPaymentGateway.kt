package kr.ai.palette.infrastructure.payment

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import java.util.Base64

/**
 * Toss Payments 결제 게이트웨이 (prod)
 * 실제 결제 승인 API를 호출합니다.
 */
@Service
@ConditionalOnProperty(name = ["payment.gateway"], havingValue = "toss")
class TossPaymentGateway(
    @Value("\${toss.payments.secret-key}") private val secretKey: String,
    restClientBuilder: RestClient.Builder,
) : PaymentGateway {

    private val logger = LoggerFactory.getLogger(TossPaymentGateway::class.java)

    private val client: RestClient = restClientBuilder
        .baseUrl("https://api.tosspayments.com")
        .defaultHeader("Authorization", "Basic ${Base64.getEncoder().encodeToString("$secretKey:".toByteArray())}")
        .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .build()

    override fun processProfileViewPayment(
        buyerUserId: String,
        targetUserId: String,
        amount: Int
    ): PaymentGatewayResult {
        // TODO: Toss Payments 결제 승인 흐름
        // 1. 프론트엔드에서 Toss SDK로 결제창 호출 → paymentKey, orderId, amount 수신
        // 2. 이 메서드에서 /v1/payments/confirm API 호출
        // 실제 구현 시 paymentKey, orderId를 파라미터로 받아야 합니다.
        logger.warn("TossPaymentGateway.processProfileViewPayment called — implement confirm API")
        return PaymentGatewayResult.Failure("Toss Payments 결제 승인 미구현")
    }
}
