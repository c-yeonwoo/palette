package kr.ai.palette.presentation.vouch

import jakarta.validation.constraints.Size
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.domain.vouch.VouchPreset
import kr.ai.palette.persistence.vouch.VouchEntity
import kr.ai.palette.persistence.vouch.VouchJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.UUID

data class CreateVouchRequest(
    /** L1 chip. null/blank = L0 quick vouch. */
    val presetKey: String? = null,
    /** L2 optional one-liner. */
    @field:Size(max = 50)
    val message: String? = null,
)

data class VouchItemDto(
    val voucherNickname: String,
    val presetKey: String?,
    val presetLabel: String?,
    val message: String?,
)

data class VouchResponse(
    val targetUserId: String,
    val vouchCount: Int,
    val voucherNicknames: List<String>,
    val vouches: List<VouchItemDto>,
    val isVouchedByMe: Boolean,
    val myVouch: VouchItemDto?,
    /** Available L1 presets for the vouch sheet. */
    val presets: List<VouchPresetDto> = VouchPreset.entries.map { VouchPresetDto(it.name, it.label) },
)

data class VouchPresetDto(
    val key: String,
    val label: String,
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
        @PathVariable targetUserId: UUID,
        @RequestBody(required = false) body: CreateVouchRequest?,
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
        val preset = VouchPreset.fromKey(body?.presetKey)
        if (body?.presetKey != null && body.presetKey.isNotBlank() && preset == null) {
            return ResponseEntity.badRequest().build()
        }
        val message = body?.message?.trim()?.takeIf { it.isNotEmpty() }?.take(50)

        val existing = vouchJpaRepository.findByTargetUserIdAndVoucherId(targetIdStr, myIdStr)
        if (existing != null) {
            existing.presetKey = preset?.name
            existing.message = message
            vouchJpaRepository.save(existing)
        } else {
            vouchJpaRepository.save(
                VouchEntity(
                    targetUserId = targetIdStr,
                    voucherId = myIdStr,
                    presetKey = preset?.name,
                    message = message,
                )
            )
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
        val items = vouchers.mapNotNull { toItemDto(it) }
        val myVouch = vouchers.find { it.voucherId == requesterId }?.let { toItemDto(it) }
        return VouchResponse(
            targetUserId = targetUserId,
            vouchCount = vouchers.size,
            voucherNicknames = items.map { it.voucherNickname },
            vouches = items,
            isVouchedByMe = myVouch != null,
            myVouch = myVouch,
        )
    }

    private fun toItemDto(vouch: VouchEntity): VouchItemDto? {
        val nickname = runCatching { userRepository.findById(UserId(UUID.fromString(vouch.voucherId))) }
            .getOrNull()?.publicInfo?.nickname ?: return null
        val preset = VouchPreset.fromKey(vouch.presetKey)
        return VouchItemDto(
            voucherNickname = nickname,
            presetKey = preset?.name,
            presetLabel = preset?.label,
            message = vouch.message,
        )
    }
}
