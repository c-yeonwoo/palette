package kr.ai.palette.presentation.payment

import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.application.billing.InsufficientBalanceException
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.billing.PointPrice
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.persistence.payment.PaidViewEntity
import kr.ai.palette.persistence.payment.PaidViewJpaRepository
import kr.ai.palette.persistence.payment.PaymentTransactionJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * 프로필 열람 비용 응답. ADR 0042 — 단일 잔액(물감) 모델.
 *
 * @param cost  필요한 잔액 (단위: 물감 / P). 1 물감 = 100원.
 * @param isAlreadyPaid 동일 타겟을 이미 unlock 한 경우 true (재차감 X)
 * @param canView 1촌 무료거나 이미 unlock 된 경우 true (즉시 열람 가능)
 */
data class ProfileViewCostResponse(
    val targetUserId: String,
    val degree: Int,
    val cost: Int,
    val unit: String = "P",
    val isAlreadyPaid: Boolean,
    val canView: Boolean,
)

data class PayProfileViewRequest(
    val targetUserId: String,
)

data class PaymentResult(
    val success: Boolean,
    val transactionId: String,
    /** 차감된 물감 수 (P). 1 물감 = 100원. */
    val amount: Int,
    val unit: String = "P",
    val message: String,
)

data class TransactionRecord(
    val id: String,
    val targetUserId: String,
    val amount: Int,
    val paymentMethod: String,
    val createdAt: String
)

/**
 * 프로필 열람 게이트 컨트롤러.
 *
 * **PA-023** — ADR 0039 (paid_views 단건 결제) 를 ADR 0042 (단일 잔액 차감) 으로 교체.
 *   - 친구의 친구 열람 = 20 물감 차감 (커피 한잔값 — ADR 0044)
 *   - 한 다리 더 건너 열람 = 30 물감 차감 (셀프 풀 확장 인센티브 — ADR 0044)
 *   - 동일 타겟은 paid_views 로 unlock 영속화 → 재방문 시 무료 (UX 보호)
 *
 * 잔액 부족 시 402 PAYMENT_REQUIRED + INSUFFICIENT_BALANCE 코드 → 프론트가 BillingScreen 으로 유도.
 */
@RestController
@RequestMapping("/api/v1/payment")
class PaymentController(
    private val friendshipRepository: FriendshipRepository,
    private val billingService: BillingService,
    private val paidViewRepository: PaidViewJpaRepository,
    private val transactionRepository: PaymentTransactionJpaRepository,
) {

    private val log = LoggerFactory.getLogger(PaymentController::class.java)

    companion object {
        /**
         * 거리별 프로필 열람 비용 (물감 / P). ADR 0042.
         * 정책 단가 변경 시 PointPrice (SoT) 와 POLICY §1.1 동기화 필수.
         *
         * 1촌(지인) 무료 / 친구의 친구 [PointPrice.FRIEND_OF_FRIEND_VIEW] 물감 /
         * 한 다리 더 건너 [PointPrice.FURTHER_VIEW] 물감
         */
        fun costForDegree(degree: Int): Int = when (degree) {
            1 -> PointPrice.FRIEND_VIEW
            2 -> PointPrice.FRIEND_OF_FRIEND_VIEW
            3 -> PointPrice.FURTHER_VIEW
            else -> PointPrice.FURTHER_VIEW
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
                canView = cost == 0 || isAlreadyPaid,
            )
        )
    }

    /**
     * 프로필 열람 unlock — 단일 잔액(물감) 차감 (ADR 0042 / PA-023).
     *
     * 흐름:
     *  1) 1촌 → 무료, 즉시 OK
     *  2) 이미 unlock 된 타겟 → 멱등 OK (재차감 X)
     *  3) BillingService.consume(cost, "view_friend_of_friend" | "view_further")
     *  4) paid_views 에 unlock 기록
     *
     * 잔액 부족: [InsufficientBalanceException] → 402 응답 (BillingController 의 핸들러가 처리)
     */
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
                    message = "1촌 친구는 무료로 열람 가능합니다",
                )
            )
        }

        if (paidViewRepository.existsByBuyerUserIdAndTargetUserId(myIdStr, request.targetUserId)) {
            return ResponseEntity.ok(
                PaymentResult(
                    success = true,
                    transactionId = "already-unlocked",
                    amount = 0,
                    message = "이미 열람한 프로필이에요",
                )
            )
        }

        val reason = if (degree == 2) "view_friend_of_friend" else "view_further"
        try {
            billingService.consume(myIdStr, cost, reason)
        } catch (e: InsufficientBalanceException) {
            // BillingController @ExceptionHandler 와 동일 페이로드로 응답
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(
                PaymentResult(
                    success = false,
                    transactionId = "",
                    amount = 0,
                    message = "INSUFFICIENT_BALANCE",
                )
            )
        }
        paidViewRepository.save(PaidViewEntity(buyerUserId = myIdStr, targetUserId = request.targetUserId))
        log.info("프로필 열람 unlock user={} target={} -{}P degree={}", myIdStr, request.targetUserId, cost, degree)

        return ResponseEntity.ok(
            PaymentResult(
                success = true,
                transactionId = UUID.randomUUID().toString(),
                amount = cost,
                message = "${cost} 물감으로 프로필을 열람했어요",
            )
        )
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
