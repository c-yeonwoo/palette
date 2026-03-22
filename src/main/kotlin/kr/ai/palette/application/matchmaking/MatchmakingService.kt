package kr.ai.palette.application.matchmaking

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaker.MatchmakerRepository
import kr.ai.palette.domain.notification.PaletteEvent
import kr.ai.palette.domain.user.UserRepository
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class MatchmakingService(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val matchmakerRepository: MatchmakerRepository,
    private val userRepository: UserRepository,
    private val eventPublisher: ApplicationEventPublisher
) {

    /**
     * 주선자가 주선 요청을 승인합니다.
     */
    fun approveByMatchmaker(
        requestId: MatchmakingRequestId,
        matchmakerId: UserId,
        message: String?
    ): MatchmakingRequest {
        val request = matchmakingRequestRepository.findById(requestId)
            ?: throw IllegalArgumentException("Matchmaking request not found: ${requestId.value}")

        require(request.matchmakerId == matchmakerId) {
            "Only the matchmaker can approve this request"
        }

        val approved = request.approveByMatchmaker(message)
        val saved = matchmakingRequestRepository.save(approved)

        updateMatchmakerStats(matchmakerId) { it.recordMatchApproval() }

        // 이벤트 발행 (트랜잭션 커밋 후 알림 생성)
        val matchmakerName = userRepository.findById(matchmakerId)?.privateInfo?.realName ?: "주선자"
        eventPublisher.publishEvent(
            PaletteEvent.MatchmakingApproved(
                requestId = requestId.value.toString(),
                requesterId = request.requesterId.value.toString(),
                targetUserId = request.targetUserId.value.toString(),
                matchmakerName = matchmakerName,
                matchmakerMessage = message
            )
        )

        return saved
    }

    /**
     * 주선자가 주선 요청을 거절합니다.
     */
    fun rejectByMatchmaker(
        requestId: MatchmakingRequestId,
        matchmakerId: UserId,
        message: String?
    ): MatchmakingRequest {
        val request = matchmakingRequestRepository.findById(requestId)
            ?: throw IllegalArgumentException("Matchmaking request not found: ${requestId.value}")

        require(request.matchmakerId == matchmakerId) {
            "Only the matchmaker can reject this request"
        }

        val rejected = request.rejectByMatchmaker(message)
        val saved = matchmakingRequestRepository.save(rejected)

        updateMatchmakerStats(matchmakerId) { it.recordMatchRejection() }

        val matchmakerName = userRepository.findById(matchmakerId)?.privateInfo?.realName ?: "주선자"
        eventPublisher.publishEvent(
            PaletteEvent.MatchmakingRejectedByMatchmaker(
                requestId = requestId.value.toString(),
                requesterId = request.requesterId.value.toString(),
                matchmakerName = matchmakerName
            )
        )

        return saved
    }

    /**
     * 피주선자가 주선을 수락합니다. (매칭 성사)
     */
    fun acceptByTarget(
        requestId: MatchmakingRequestId,
        targetUserId: UserId,
        message: String?
    ): MatchmakingRequest {
        val request = matchmakingRequestRepository.findById(requestId)
            ?: throw IllegalArgumentException("Matchmaking request not found: ${requestId.value}")

        require(request.targetUserId == targetUserId) {
            "Only the target user can accept this request"
        }

        val accepted = request.acceptByTarget(message)
        val saved = matchmakingRequestRepository.save(accepted)

        validateContactInfo(request.requesterId)
        validateContactInfo(request.targetUserId)

        updateMatchmakerStats(request.matchmakerId) { it.recordMatchSuccess() }

        // 매칭 성사 이벤트: 요청자 + 주선자에게 알림
        val targetName = userRepository.findById(targetUserId)?.publicInfo?.nickname ?: "상대방"
        eventPublisher.publishEvent(
            PaletteEvent.MatchmakingCompleted(
                requestId = requestId.value.toString(),
                requesterId = request.requesterId.value.toString(),
                matchmakerId = request.matchmakerId.value.toString(),
                partnerName = targetName
            )
        )

        return saved
    }

    /**
     * 피주선자가 주선을 거절합니다.
     */
    fun rejectByTarget(
        requestId: MatchmakingRequestId,
        targetUserId: UserId,
        message: String?
    ): MatchmakingRequest {
        val request = matchmakingRequestRepository.findById(requestId)
            ?: throw IllegalArgumentException("Matchmaking request not found: ${requestId.value}")

        require(request.targetUserId == targetUserId) {
            "Only the target user can reject this request"
        }

        val rejected = request.rejectByTarget(message)
        val saved = matchmakingRequestRepository.save(rejected)

        updateMatchmakerStats(request.matchmakerId) { it.recordMatchFailure() }

        eventPublisher.publishEvent(
            PaletteEvent.MatchmakingRejectedByTarget(
                requestId = requestId.value.toString(),
                requesterId = request.requesterId.value.toString()
            )
        )

        return saved
    }

    private fun validateContactInfo(userId: UserId) {
        val user = userRepository.findById(userId)
            ?: throw IllegalArgumentException("User not found: ${userId.value}")

        val phoneNumber = user.privateInfo.getEffectivePhoneNumber()
        require(!phoneNumber.isNullOrBlank()) {
            "User ${user.publicInfo.nickname} must have a phone number for contact exchange"
        }
    }

    private fun updateMatchmakerStats(
        matchmakerId: UserId,
        updateFn: (kr.ai.palette.domain.matchmaker.Matchmaker) -> kr.ai.palette.domain.matchmaker.Matchmaker
    ) {
        val matchmaker = matchmakerRepository.findByUserId(matchmakerId)
            ?: throw IllegalArgumentException("Matchmaker not found for user: ${matchmakerId.value}")
        matchmakerRepository.save(updateFn(matchmaker))
    }
}
