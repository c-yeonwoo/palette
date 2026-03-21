package kr.ai.palette.presentation.vouch

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

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
    private val friendshipRepository: FriendshipRepository
) {
    companion object {
        // targetUserId -> Set<voucherId>
        private val vouches = ConcurrentHashMap<String, MutableSet<String>>()
    }

    /**
     * 프로필 사진 보증하기 (1촌 친구만 가능)
     */
    @PostMapping("/{targetUserId}")
    fun vouchForUser(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: UUID
    ): ResponseEntity<VouchResponse> {
        val myId = authUser.userId
        val targetId = UserId(targetUserId)

        // 자기 자신 보증 불가
        if (myId == targetId) {
            return ResponseEntity.badRequest().build()
        }

        // 1촌 친구인지 확인
        if (!friendshipRepository.existsBetweenUsers(myId, targetId)) {
            return ResponseEntity.status(403).build()
        }

        val voucherSet = vouches.getOrPut(targetUserId.toString()) { mutableSetOf() }
        voucherSet.add(myId.value.toString())

        return ResponseEntity.ok(buildVouchResponse(targetUserId.toString(), myId.value.toString()))
    }

    /**
     * 보증 취소
     */
    @DeleteMapping("/{targetUserId}")
    fun unvouchForUser(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: UUID
    ): ResponseEntity<VouchResponse> {
        val myId = authUser.userId
        vouches[targetUserId.toString()]?.remove(myId.value.toString())
        return ResponseEntity.ok(buildVouchResponse(targetUserId.toString(), myId.value.toString()))
    }

    /**
     * 보증 현황 조회
     */
    @GetMapping("/{targetUserId}")
    fun getVouches(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: UUID
    ): ResponseEntity<VouchResponse> {
        return ResponseEntity.ok(
            buildVouchResponse(targetUserId.toString(), authUser.userId.value.toString())
        )
    }

    private fun buildVouchResponse(targetUserId: String, requesterId: String): VouchResponse {
        val voucherSet = vouches[targetUserId] ?: emptySet()
        val voucherNicknames = voucherSet.mapNotNull { voucherId ->
            runCatching { userRepository.findById(UserId(UUID.fromString(voucherId))) }
                .getOrNull()?.publicInfo?.nickname
        }
        return VouchResponse(
            targetUserId = targetUserId,
            vouchCount = voucherSet.size,
            voucherNicknames = voucherNicknames,
            isVouchedByMe = voucherSet.contains(requesterId)
        )
    }
}
