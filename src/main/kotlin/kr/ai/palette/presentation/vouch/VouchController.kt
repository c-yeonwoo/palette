package kr.ai.palette.presentation.vouch

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.persistence.vouch.VouchEntity
import kr.ai.palette.persistence.vouch.VouchJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.UUID

data class VouchResponse(
    val targetUserId: String,
    val vouchCount: Int,
    val voucherNicknames: List<String>,
    val isVouchedByMe: Boolean
)

@RestController
@RequestMapping("/api/v1/vouch")
class VouchController(
    private val userRepository: UserRepository,
    private val friendshipRepository: FriendshipRepository,
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val vouchJpaRepository: VouchJpaRepository
) {

    @PostMapping("/{targetUserId}")
    @Transactional
    fun vouchForUser(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: UUID
    ): ResponseEntity<VouchResponse> {
        val myId = authUser.userId
        val targetId = UserId(targetUserId)

        if (myId == targetId) {
            return ResponseEntity.badRequest().build()
        }

        val isDirectFriend = friendshipRepository.existsBetweenUsers(myId, targetId)
        val hasCompletedMatch = hasCompletedMatchBetween(myId, targetId)
        if (!isDirectFriend && !hasCompletedMatch) {
            return ResponseEntity.status(403).build()
        }

        val myIdStr = myId.value.toString()
        val targetIdStr = targetUserId.toString()

        if (!vouchJpaRepository.existsByTargetUserIdAndVoucherId(targetIdStr, myIdStr)) {
            vouchJpaRepository.save(VouchEntity(targetUserId = targetIdStr, voucherId = myIdStr))
        }

        return ResponseEntity.ok(buildVouchResponse(targetIdStr, myIdStr))
    }

    @DeleteMapping("/{targetUserId}")
    @Transactional
    fun unvouchForUser(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: UUID
    ): ResponseEntity<VouchResponse> {
        val myIdStr = authUser.userId.value.toString()
        val targetIdStr = targetUserId.toString()
        vouchJpaRepository.deleteByTargetUserIdAndVoucherId(targetIdStr, myIdStr)
        return ResponseEntity.ok(buildVouchResponse(targetIdStr, myIdStr))
    }

    @GetMapping("/{targetUserId}")
    fun getVouches(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: UUID
    ): ResponseEntity<VouchResponse> {
        return ResponseEntity.ok(
            buildVouchResponse(targetUserId.toString(), authUser.userId.value.toString())
        )
    }

    private fun hasCompletedMatchBetween(userId1: UserId, userId2: UserId): Boolean {
        val forward = matchmakingRequestRepository.findByRequesterIdAndTargetUserId(userId1, userId2)
        val reverse = matchmakingRequestRepository.findByRequesterIdAndTargetUserId(userId2, userId1)
        return forward?.status == MatchmakingRequestStatus.COMPLETED ||
            reverse?.status == MatchmakingRequestStatus.COMPLETED
    }

    private fun buildVouchResponse(targetUserId: String, requesterId: String): VouchResponse {
        val vouchers = vouchJpaRepository.findByTargetUserId(targetUserId)
        val voucherNicknames = vouchers.mapNotNull { vouch ->
            runCatching { userRepository.findById(UserId(UUID.fromString(vouch.voucherId))) }
                .getOrNull()?.publicInfo?.nickname
        }
        return VouchResponse(
            targetUserId = targetUserId,
            vouchCount = vouchers.size,
            voucherNicknames = voucherNicknames,
            isVouchedByMe = vouchers.any { it.voucherId == requesterId }
        )
    }
}
