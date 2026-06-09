package kr.ai.palette.infrastructure.payment

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service
import java.util.UUID

@Service
@ConditionalOnProperty(name = ["payment.gateway"], havingValue = "mock", matchIfMissing = true)
class MockPaymentGateway : PaymentGateway {

    private val logger = LoggerFactory.getLogger(MockPaymentGateway::class.java)

    override fun processProfileViewPayment(
        buyerUserId: String,
        targetUserId: String,
        amount: Int,
        paymentKey: String?,
        orderId: String?
    ): PaymentGatewayResult {
        val txId = paymentKey?.takeIf { it.isNotBlank() } ?: UUID.randomUUID().toString()
        logger.info("[MOCK PAYMENT] buyer=$buyerUserId target=$targetUserId amount=${amount}원 txId=$txId")
        return PaymentGatewayResult.Success(txId)
    }

    override fun confirm(
        orderId: String,
        paymentKey: String,
        expectedAmount: Int,
    ): PaymentGatewayResult {
        logger.info("[MOCK CONFIRM] orderId={} paymentKey={} amount={}", orderId, paymentKey, expectedAmount)
        return PaymentGatewayResult.Success(paymentKey.ifBlank { UUID.randomUUID().toString() })
    }
}
