package kr.ai.palette.infrastructure.payment

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Service
import java.util.UUID

/**
 * Mock 결제 게이트웨이 (dev/qa) — 항상 성공
 */
@Service
@ConditionalOnProperty(name = ["payment.gateway"], havingValue = "mock", matchIfMissing = true)
class MockPaymentGateway : PaymentGateway {

    private val logger = LoggerFactory.getLogger(MockPaymentGateway::class.java)

    override fun processProfileViewPayment(
        buyerUserId: String,
        targetUserId: String,
        amount: Int
    ): PaymentGatewayResult {
        val txId = UUID.randomUUID().toString()
        logger.info("[MOCK PAYMENT] buyer=$buyerUserId target=$targetUserId amount=${amount}원 txId=$txId")
        return PaymentGatewayResult.Success(txId)
    }
}
