package kr.ai.palette.presentation.payment

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

data class ProfileViewCostResponse(
    val targetUserId: String,
    val degree: Int,        // 1촌=1, 2촌=2, 3촌=3, 0=not in network
    val cost: Int,          // 0 for free, 3000 for 2촌, 5000 for 3촌
    val isAlreadyPaid: Boolean,
    val canView: Boolean    // true if free OR already paid
)

data class PayProfileViewRequest(
    val targetUserId: String,
    val paymentMethod: String = "MOCK_CARD"   // Mock: always succeeds
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
    private val friendshipRepository: FriendshipRepository
) {

    companion object {
        // userId -> Set of targetUserIds they've already paid to view
        private val paidViews = ConcurrentHashMap<String, MutableSet<String>>()
        // userId -> list of transactions
        private val transactions = ConcurrentHashMap<String, MutableList<TransactionRecord>>()

        fun costForDegree(degree: Int): Int = when (degree) {
            1 -> 0
            2 -> 3000
            3 -> 5000
            else -> 5000
        }
    }

    private fun getDegree(myUserId: UserId, targetUserId: UserId): Int {
        if (friendshipRepository.findFriendIdsByUserId(myUserId).contains(targetUserId)) {
            return 1
        }
        val secondDegree = friendshipRepository.findSecondDegreeFriendIds(myUserId)
        if (secondDegree.contains(targetUserId)) {
            return 2
        }
        return 3
    }

    /**
     * 프로필 열람 비용 조회
     */
    @GetMapping("/profile-view-cost")
    fun getProfileViewCost(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestParam targetUserId: UUID
    ): ResponseEntity<ProfileViewCostResponse> {
        val myId = authUser.userId
        val targetId = UserId(targetUserId)
        val targetStr = targetUserId.toString()

        val degree = getDegree(myId, targetId)
        val cost = costForDegree(degree)
        val isAlreadyPaid = paidViews[myId.value.toString()]?.contains(targetStr) == true
        val canView = cost == 0 || isAlreadyPaid

        return ResponseEntity.ok(
            ProfileViewCostResponse(
                targetUserId = targetStr,
                degree = degree,
                cost = cost,
                isAlreadyPaid = isAlreadyPaid,
                canView = canView
            )
        )
    }

    /**
     * 프로필 열람 결제 (Mock: 항상 성공)
     */
    @PostMapping("/profile-view")
    fun payForProfileView(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: PayProfileViewRequest
    ): ResponseEntity<PaymentResult> {
        val myId = authUser.userId
        val myIdStr = myId.value.toString()

        val targetId = UserId(UUID.fromString(request.targetUserId))
        val degree = getDegree(myId, targetId)
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

        // Check already paid
        if (paidViews[myIdStr]?.contains(request.targetUserId) == true) {
            return ResponseEntity.ok(
                PaymentResult(
                    success = true,
                    transactionId = "already-paid",
                    amount = 0,
                    message = "이미 결제된 프로필입니다"
                )
            )
        }

        // Mock payment processing (always succeeds)
        val txId = UUID.randomUUID().toString()

        // Record payment
        paidViews.getOrPut(myIdStr) { mutableSetOf() }.add(request.targetUserId)
        transactions.getOrPut(myIdStr) { mutableListOf() }.add(
            TransactionRecord(
                id = txId,
                targetUserId = request.targetUserId,
                amount = cost,
                paymentMethod = request.paymentMethod,
                createdAt = Instant.now().toString()
            )
        )

        return ResponseEntity.ok(
            PaymentResult(
                success = true,
                transactionId = txId,
                amount = cost,
                message = "${cost / 1000},000원 결제가 완료되었습니다"
            )
        )
    }

    /**
     * 내 결제 내역
     */
    @GetMapping("/my-transactions")
    fun getMyTransactions(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<List<TransactionRecord>> {
        val myId = authUser.userId.value.toString()
        val txList = transactions[myId] ?: emptyList<TransactionRecord>()
        return ResponseEntity.ok(txList.reversed())
    }
}
