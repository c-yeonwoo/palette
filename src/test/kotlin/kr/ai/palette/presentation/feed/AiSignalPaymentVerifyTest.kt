package kr.ai.palette.presentation.feed

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.mockk
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.AccountType
import kr.ai.palette.infrastructure.payment.PaymentGatewayResult
import tools.jackson.databind.ObjectMapper
import java.util.UUID

class AiSignalPaymentVerifyTest : DescribeSpec({

    val paymentGateway = mockk<kr.ai.palette.infrastructure.payment.PaymentGateway>()
    val objectMapper = ObjectMapper()

    fun authUser() = AuthUser(UserId(UUID.randomUUID()), "tester", AccountType.REGULAR, true)

    beforeEach { clearMocks(paymentGateway) }

    describe("AiSignalController 결제 검증") {

        it("unlock — stub 모드가 아니면 PaymentGateway.confirm 을 호출한다") {
            every {
                paymentGateway.confirm(
                    orderId = "order-1",
                    paymentKey = "pay-key",
                    expectedAmount = AiSignalController.UNLOCK_PRICE,
                )
            } returns PaymentGatewayResult.Success("pay-key")

            val controller = AiSignalController(
                profileRepository = mockk(relaxed = true),
                userRepository = mockk(relaxed = true),
                cardOpenJpaRepository = mockk(relaxed = true),
                feedHideRepository = mockk(relaxed = true),
                fileStorageService = mockk(relaxed = true),
                dailyRecommendationRepo = mockk(relaxed = true),
                adminBlockedTargetRepo = mockk(relaxed = true),
                blockService = mockk(relaxed = true),
                aiPassRepo = mockk(relaxed = true),
                palettePickRecommendationService = mockk(relaxed = true),
                compatibilityAnalysisRepository = mockk(relaxed = true),
                objectMapper = objectMapper,
                paymentGateway = paymentGateway,
                paymentSecretKey = "live-secret",
            )

            val authUser = authUser()
            val response = controller.unlockSecondRecommendation(
                authUser,
                UnlockRequestBody(paymentKey = "pay-key", orderId = "order-1"),
            )

            response.statusCode.value() shouldBe 200
            response.body?.alreadyUnlocked shouldBe false
        }

        it("unlock — confirm 실패 시 402") {
            every {
                paymentGateway.confirm(any(), any(), any())
            } returns PaymentGatewayResult.Failure("금액 불일치")

            val controller = AiSignalController(
                profileRepository = mockk(relaxed = true),
                userRepository = mockk(relaxed = true),
                cardOpenJpaRepository = mockk(relaxed = true),
                feedHideRepository = mockk(relaxed = true),
                fileStorageService = mockk(relaxed = true),
                dailyRecommendationRepo = mockk(relaxed = true),
                adminBlockedTargetRepo = mockk(relaxed = true),
                blockService = mockk(relaxed = true),
                aiPassRepo = mockk(relaxed = true),
                palettePickRecommendationService = mockk(relaxed = true),
                compatibilityAnalysisRepository = mockk(relaxed = true),
                objectMapper = objectMapper,
                paymentGateway = paymentGateway,
                paymentSecretKey = "live-secret",
            )

            val response = controller.unlockSecondRecommendation(
                authUser(),
                UnlockRequestBody(paymentKey = "pay-key", orderId = "order-1"),
            )

            response.statusCode.value() shouldBe 402
        }
    }
})
