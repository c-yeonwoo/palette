package kr.ai.palette.infrastructure.payment

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException
import java.util.Base64

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
            return PaymentGatewayResult.Failure("paymentKey와 orderId가 필요합니다")
        }

        return try {
            val response = client.post()
                .uri("/v1/payments/confirm")
                .body(
                    mapOf(
                        "paymentKey" to paymentKey,
                        "orderId" to orderId,
                        "amount" to amount
                    )
                )
                .retrieve()
                .body(TossConfirmResponse::class.java)

            if (response?.status == "DONE") {
                logger.info("[TOSS] 결제 승인 완료: paymentKey=$paymentKey orderId=$orderId amount=${amount}원")
                PaymentGatewayResult.Success(paymentKey)
            } else {
                logger.warn("[TOSS] 결제 상태 비정상: status=${response?.status}")
                PaymentGatewayResult.Failure("결제 상태 비정상: ${response?.status}")
            }
        } catch (e: RestClientException) {
            logger.error("[TOSS] 결제 승인 실패: ${e.message}")
            PaymentGatewayResult.Failure("Toss 결제 승인 실패: ${e.message}")
        }
    }
}

private data class TossConfirmResponse(
    val paymentKey: String,
    val orderId: String,
    val status: String,
    val totalAmount: Int,
    val method: String?
)
