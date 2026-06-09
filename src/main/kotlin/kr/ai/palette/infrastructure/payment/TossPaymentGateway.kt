package kr.ai.palette.infrastructure.payment

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException
import java.util.Base64

/**
 * Toss Payments confirm API 연동. PA-002.
 *
 * 활성화: `payment.gateway=toss` + `toss.payments.secret-key` (env: TOSS_SECRET_KEY).
 * - test key: `test_sk_...` (가맹 신청 전에도 발급)
 * - live key: `live_sk_...` (가맹 통과 후, prod 환경에만)
 *
 * Toss API: https://docs.tosspayments.com/reference#payment-요청-검증
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
        .defaultHeader(
            "Authorization",
            "Basic ${Base64.getEncoder().encodeToString("$secretKey:".toByteArray())}"
        )
        .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
        .build()

    override fun processProfileViewPayment(
        buyerUserId: String,
        targetUserId: String,
        amount: Int,
        paymentKey: String?,
        orderId: String?
    ): PaymentGatewayResult {
        if (paymentKey.isNullOrBlank() || orderId.isNullOrBlank()) {
            return PaymentGatewayResult.Failure("paymentKey 와 orderId 가 필요합니다")
        }
        return confirm(orderId = orderId, paymentKey = paymentKey, expectedAmount = amount)
    }

    override fun confirm(
        orderId: String,
        paymentKey: String,
        expectedAmount: Int,
    ): PaymentGatewayResult {
        if (paymentKey.isBlank() || orderId.isBlank()) {
            return PaymentGatewayResult.Failure("paymentKey 와 orderId 가 비어있습니다")
        }
        return try {
            val response = client.post()
                .uri("/v1/payments/confirm")
                .body(
                    mapOf(
                        "paymentKey" to paymentKey,
                        "orderId" to orderId,
                        "amount" to expectedAmount,
                    )
                )
                .retrieve()
                .body(TossConfirmResponse::class.java)

            when {
                response == null -> PaymentGatewayResult.Failure("Toss 응답 없음")
                response.status != "DONE" -> {
                    logger.warn("[TOSS] 결제 상태 비정상 status={} orderId={}", response.status, orderId)
                    PaymentGatewayResult.Failure("결제 상태 비정상: ${response.status}")
                }
                response.totalAmount != expectedAmount -> {
                    // 위변조 방지 — 응답 금액 ≠ 백엔드가 인지한 금액
                    logger.error(
                        "[TOSS] 금액 불일치 expected={} actual={} orderId={}",
                        expectedAmount, response.totalAmount, orderId,
                    )
                    PaymentGatewayResult.Failure("금액 불일치 (위변조 의심)")
                }
                else -> {
                    logger.info(
                        "[TOSS] 승인 OK paymentKey={} orderId={} amount={}",
                        paymentKey, orderId, response.totalAmount,
                    )
                    PaymentGatewayResult.Success(paymentKey)
                }
            }
        } catch (e: RestClientException) {
            logger.error("[TOSS] 승인 실패 orderId={} err={}", orderId, e.message)
            PaymentGatewayResult.Failure("Toss 결제 승인 실패: ${e.message}")
        }
    }
}

private data class TossConfirmResponse(
    val paymentKey: String,
    val orderId: String,
    val status: String,
    val totalAmount: Int,
    val method: String?,
)
