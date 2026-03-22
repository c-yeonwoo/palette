package kr.ai.palette.application.notification

import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDate

/**
 * 매칭 완료 7일 후, 양측에게 사진 보증 평가 푸시 알림을 발송하는 스케줄러.
 * updatedAt을 completedAt의 프록시로 사용 (acceptByTarget() 시점에 updatedAt이 갱신됨).
 */
@Component
class MatchFollowUpScheduler(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val userRepository: UserRepository,
    private val pushNotificationService: PushNotificationService
) {
    private val logger = LoggerFactory.getLogger(MatchFollowUpScheduler::class.java)

    // 매일 오전 10시 실행
    @Scheduled(cron = "0 0 10 * * *")
    fun sendMatchFollowUpPush() {
        val targetDate = LocalDate.now().minusDays(7)

        val followUpTargets = matchmakingRequestRepository
            .findByStatus(MatchmakingRequestStatus.COMPLETED)
            .filter { it.updatedAt.toLocalDate() == targetDate }

        if (followUpTargets.isEmpty()) return

        logger.info("[MatchFollowUp] ${targetDate} 완료된 매칭 ${followUpTargets.size}건 팔로업 발송")

        for (match in followUpTargets) {
            val requester = userRepository.findById(match.requesterId) ?: continue
            val target = userRepository.findById(match.targetUserId) ?: continue

            val requesterNickname = requester.publicInfo.nickname
            val targetNickname = target.publicInfo.nickname

            // 요청자 → 대상자 이름으로 알림
            pushNotificationService.sendToUser(
                userId = match.requesterId,
                title = "만남은 어떠셨나요? 💫",
                body = "${targetNickname}님과의 만남은 잘 이루어졌나요? 사진 보증으로 소감을 남겨주세요."
            )

            // 대상자 → 요청자 이름으로 알림
            pushNotificationService.sendToUser(
                userId = match.targetUserId,
                title = "만남은 어떠셨나요? 💫",
                body = "${requesterNickname}님과의 만남은 잘 이루어졌나요? 사진 보증으로 소감을 남겨주세요."
            )
        }
    }
}
