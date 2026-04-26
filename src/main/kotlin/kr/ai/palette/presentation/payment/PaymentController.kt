package kr.ai.palette.presentation.payment

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.infrastructure.payment.PaymentGateway
import kr.ai.palette.infrastructure.payment.PaymentGatewayResult
import kr.ai.palette.persistence.payment.PaidViewEntity
import kr.ai.palette.persistence.payment.PaidViewJpaRepository
import kr.ai.palette.persistence.payment.PaymentTransactionEntity
import kr.ai.palette.persistence.payment.PaymentTransactionJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

data class ProfileViewCostResponse(
    val targetUserId: String,
    val degree: Int,
    val cost: Int,
    val isAlreadyPaid: Boolean,
    val canView: Boolean
)

data class PayProfileViewRequest(
    val targetUserId: String,
    val paymentMethod: String = "CARD"
)

data class PaymentResult(
    val success: Boolean,
    val transactionId: String,
    val amount: Int,
    val message: String
)

data class TransactionRecord(
    val id: String,
    val targetUserId: String,
    val amount: Int,
    val paymentMethod: String,
    val createdAt: String
)

@RestController
@RequestMapping("/api/v1/payment")
class PaymentController(
    private val friendshipRepository: FriendshipRepository,
    private val paymentGateway: PaymentGateway,
    private val paidViewRepository: PaidViewJpaRepository,
    private val transactionRepository: PaymentTransactionJpaRepository,
) {

    companion object {
        fun costForDegree(degree: Int): Int = when (degree) {
            1 -> 0
            2 -> 3000
            3 -> 5000
            else -> 5000
        }
    }

    private fun getDegree(myUserId: UserId, targetUserId: UserId): Int {
        if (friendshipRepository.findFriendIdsByUserId(myUserId).contains(targetUserId)) return 1
        if (friendshipRepository.findSecondDegreeFriendIds(myUserId).contains(targetUserId)) return 2
        return 3
    }

    @GetMapping("/profile-view-cost")
    fun getProfileViewCost(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestParam targetUserId: UUID
    ): ResponseEntity<ProfileViewCostResponse> {
        val myId = authUser.userId
        val targetId = UserId(targetUserId)

        val degree = getDegree(myId, targetId)
        val cost = costForDegree(degree)
        val isAlreadyPaid = paidViewRepository.existsByBuyerUserIdAndTargetUserId(
            myId.value.toString(), targetUserId.toString()
        )

        return ResponseEntity.ok(
            ProfileViewCostResponse(
                targetUserId = targetUserId.toString(),
                degree = degree,
                cost = cost,
                isAlreadyPaid = isAlreadyPaid,
                canView = cost == 0 || isAlreadyPaid
            )
        )
    }

    @PostMapping("/profile-view")
    fun payForProfileView(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: PayProfileViewRequest
    ): ResponseEntity<PaymentResult> {
        val myIdStr = authUser.userId.value.toString()
        val targetId = UserId(UUID.fromString(request.targetUserId))
        val degree = getDegree(authUser.userId, targetId)
        val cost = costForDegree(degree)

        if (cost == 0) {
            return ResponseEntity.ok(
                PaymentResult(
                    success = true,
                    transactionId = UUID.randomUUID().toString(),
                    amount = 0,
                    message = "1촌 친구는 무료로 열람 가능합니다"
                )
            )
        }

        if (paidViewRepository.existsByBuyerUserIdAndTargetUserId(myIdStr, request.targetUserId)) {
            return ResponseEntity.ok(
                PaymentResult(
                    success = true,
                    transactionId = "already-paid",
                    amount = 0,
                    message = "이미 결제된 프로필입니다"
                )
            )
        }

        return when (val result = paymentGateway.processProfileViewPayment(myIdStr, request.targetUserId, cost)) {
            is PaymentGatewayResult.Success -> {
                paidViewRepository.save(PaidViewEntity(buyerUserId = myIdStr, targetUserId = request.targetUserId))
                transactionRepository.save(
                    PaymentTransactionEntity(
                        id = result.transactionId,
                        buyerUserId = myIdStr,
                        targetUserId = request.targetUserId,
                        amount = cost,
                        paymentMethod = request.paymentMethod,
                    )
                )
                ResponseEntity.ok(
                    PaymentResult(
                        success = true,
                        transactionId = result.transactionId,
                        amount = cost,
                        message = "${cost / 1000},000원 결제가 완료되었습니다"
                    )
                )
            }
            is PaymentGatewayResult.Failure -> ResponseEntity.ok(
                PaymentResult(
                    success = false,
                    transactionId = "",
                    amount = 0,
                    message = result.reason
                )
            )
        }
    }

    @GetMapping("/my-transactions")
    fun getMyTransactions(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<List<TransactionRecord>> {
        val records = transactionRepository
            .findByBuyerUserIdOrderByCreatedAtDesc(authUser.userId.value.toString())
            .map {
                TransactionRecord(
                    id = it.id,
                    targetUserId = it.targetUserId,
                    amount = it.amount,
                    paymentMethod = it.paymentMethod,
                    createdAt = it.createdAt.toString()
                )
            }
        return ResponseEntity.ok(records)
    }
}
