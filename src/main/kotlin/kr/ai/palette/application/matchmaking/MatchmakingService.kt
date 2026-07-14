package kr.ai.palette.application.matchmaking

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaker.MatchmakerRepository
import kr.ai.palette.domain.notification.PaletteEvent
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.application.billing.BillingService
import org.slf4j.LoggerFactory
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class MatchmakingService(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val matchmakerRepository: MatchmakerRepository,
    private val userRepository: UserRepository,
    private val billingService: BillingService,
    private val eventPublisher: ApplicationEventPublisher
) {
    private val log = LoggerFactory.getLogger(MatchmakingService::class.java)

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
        val requesterName = userRepository.findById(request.requesterId)?.publicInfo?.nickname
        eventPublisher.publishEvent(
            PaletteEvent.MatchmakingApproved(
                requestId = requestId.value.toString(),
                requesterId = request.requesterId.value.toString(),
                targetUserId = request.targetUserId.value.toString(),
                matchmakerName = matchmakerName,
                matchmakerMessage = message,
                requesterName = requesterName,
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

        // 팔레트 Pick 직접 연결(createDirect)은 실제 주선자가 없어 matchmakerId=requesterId(placeholder).
        // 이 경우 주선자 보상(등급·크레딧)을 지급하면 요청자가 자기 매칭으로 '주선자' 보상을 챙기는 자가-크레딧/랭킹 오염 +
        // direct 요청 남발 파밍 인센티브가 된다 → 실제 주선자가 있을 때만 보상.
        val hasRealMatchmaker = request.matchmakerId != request.requesterId
        if (hasRealMatchmaker) {
            updateMatchmakerStats(request.matchmakerId) { it.recordMatchSuccess() }

            // 주선자 폐쇄형 크레딧 (CS-009, ADR 0072 §2-5) — 성사 시 주선자에게 물감 보너스.
            // 현금 아님(출금 불가·내부 재사용만) → 컴플라이언스 회피 + 공급 동기. 명예(등급·리그)가 1차, 크레딧은 보조.
            // 액수는 소소하게(어뷰징=가짜 매칭 파밍 인센티브 최소화; 매칭은 2단계 승인+연락처 검증으로 이미 게이팅).
            runCatching {
                billingService.grantBonus(
                    userId = request.matchmakerId.value.toString(),
                    points = MATCH_SUCCESS_CREDIT_POINTS,
                    validDays = MATCH_SUCCESS_CREDIT_VALID_DAYS,
                    reason = "match_success:${requestId.value}",
                )
            }.onFailure { log.warn("주선자 크레딧 지급 실패 — matchmaker={} req={} err={}", request.matchmakerId.value, requestId.value, it.message) }
        }

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

    // 마일스톤 물감 보상(applyMilestoneBonus)은 무현금 모델(ADR 0064)로 제거.
    // MatchmakerMilestonePolicy 도메인은 보존(휴면) — 향후 명예 배지 등에 재사용 가능.

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

    companion object {
        /** 매칭 성사 시 주선자 폐쇄형 크레딧 (CS-009, ADR 0072 §2-5). 튜너블 정책값 — 3촌 프로필 1건 열람가(30) 기준, 명예 위 소소한 보너스. */
        const val MATCH_SUCCESS_CREDIT_POINTS = 30

        /** 지급 크레딧 유효기간(일) — 보너스 버킷. 성사는 드문 이벤트라 넉넉히. */
        const val MATCH_SUCCESS_CREDIT_VALID_DAYS = 90
    }
}
