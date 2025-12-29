package kr.ai.palette.application.matchmaking

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaker.MatchmakerRepository
import kr.ai.palette.domain.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class MatchmakingService(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val matchmakerRepository: MatchmakerRepository,
    private val userRepository: UserRepository
) {

    /**
     * 주선자가 주선 요청을 승인합니다.
     * - 상태를 MATCHMAKER_APPROVED로 변경
     * - 주선자의 통계 업데이트 (approved requests)
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

        // 주선자 통계 업데이트
        updateMatchmakerStats(matchmakerId) { matchmaker ->
            matchmaker.recordMatchApproval()
        }

        return saved
    }

    /**
     * 주선자가 주선 요청을 거절합니다.
     * - 상태를 REJECTED_BY_MATCHMAKER로 변경
     * - 주선자의 통계 업데이트 (rejected requests)
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

        // 주선자 통계 업데이트
        updateMatchmakerStats(matchmakerId) { matchmaker ->
            matchmaker.recordMatchRejection()
        }

        return saved
    }

    /**
     * 피주선자가 주선을 수락합니다.
     * - 상태를 COMPLETED로 변경
     * - 연락처 정보 교환 (향후 구현)
     * - 주선자에게 포인트 지급 (1,500P)
     * - 주선자의 통계 업데이트 (successful matches)
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

        // 연락처 정보 확인 (필수)
        validateContactInfo(request.requesterId)
        validateContactInfo(request.targetUserId)

        // 주선자에게 포인트 지급 및 통계 업데이트 (1,500P)
        updateMatchmakerStats(request.matchmakerId) { matchmaker ->
            matchmaker.recordMatchSuccess()
        }

        return saved
    }

    /**
     * 피주선자가 주선을 거절합니다.
     * - 상태를 REJECTED_BY_TARGET로 변경
     * - 주선자의 통계 업데이트 (failed matches)
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

        // 주선자 통계 업데이트
        updateMatchmakerStats(request.matchmakerId) { matchmaker ->
            matchmaker.recordMatchFailure()
        }

        return saved
    }

    /**
     * 사용자의 연락처 정보가 있는지 확인합니다.
     */
    private fun validateContactInfo(userId: UserId) {
        val user = userRepository.findById(userId)
            ?: throw IllegalArgumentException("User not found: ${userId.value}")

        val phoneNumber = user.privateInfo.getEffectivePhoneNumber()
        require(!phoneNumber.isNullOrBlank()) {
            "User ${user.publicInfo.nickname} must have a phone number for contact exchange"
        }
    }

    /**
     * 주선자 통계를 업데이트합니다.
     */
    private fun updateMatchmakerStats(
        matchmakerId: UserId,
        updateFn: (kr.ai.palette.domain.matchmaker.Matchmaker) -> kr.ai.palette.domain.matchmaker.Matchmaker
    ) {
        val matchmaker = matchmakerRepository.findByUserId(matchmakerId)
            ?: throw IllegalArgumentException("Matchmaker not found for user: ${matchmakerId.value}")

        val updated = updateFn(matchmaker)
        matchmakerRepository.save(updated)
    }
}
