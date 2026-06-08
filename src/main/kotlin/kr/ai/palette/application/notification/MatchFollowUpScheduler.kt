package kr.ai.palette.application.notification

import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.user.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import java.time.LocalDate

/**
 * 매칭 완료 후 retention nudge 스케줄러. ADR 0041 / B-007.
 *
 * updatedAt 을 completedAt 의 프록시로 사용 (acceptByTarget 시 갱신).
 * 매일 오전 10시 D+1 / D+3 / D+7 세 단계 nudge:
 *  · D+1 — 첫 메시지 유도
 *  · D+3 — 만남 일정 유도
 *  · D+7 — 사진 보증 / 소감
 */
@Component
class MatchFollowUpScheduler(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val userRepository: UserRepository,
    private val pushNotificationService: PushNotificationService
) {
    private val logger = LoggerFactory.getLogger(MatchFollowUpScheduler::class.java)

    @Scheduled(cron = "0 0 10 * * *")
    fun sendMatchFollowUpPush() {
        val today = LocalDate.now()
        val completed = matchmakingRequestRepository
            .findByStatus(MatchmakingRequestStatus.COMPLETED)

        sendStageNudge(
            stage = "D+1",
            matches = completed.filter { it.updatedAt.toLocalDate() == today.minusDays(1) },
            title = "첫 메시지 보내셨어요? ☕",
            body = { name -> "${name}님께 가벼운 인사를 건네보세요. 첫 대화는 두 분의 색이 어울리는지 살펴보는 시간이에요." },
        )

        sendStageNudge(
            stage = "D+3",
            matches = completed.filter { it.updatedAt.toLocalDate() == today.minusDays(3) },
            title = "이번 주말 어떠세요? 🌿",
            body = { name -> "${name}님과 첫 만남 일정을 잡아볼 시점이에요. 가벼운 카페부터 시작하면 부담이 적어요." },
        )

        sendStageNudge(
            stage = "D+7",
            matches = completed.filter { it.updatedAt.toLocalDate() == today.minusDays(7) },
            title = "만남은 어떠셨나요? 💫",
            body = { name -> "${name}님과의 만남은 잘 이루어졌나요? 사진 보증으로 소감을 남겨주세요." },
        )
    }

    private fun sendStageNudge(
        stage: String,
        matches: List<kr.ai.palette.domain.matchmaking.MatchmakingRequest>,
        title: String,
        body: (String) -> String,
    ) {
        if (matches.isEmpty()) return
        logger.info("[MatchFollowUp] {} 단계 {}건 nudge 발송", stage, matches.size)
        for (match in matches) {
            val requester = userRepository.findById(match.requesterId) ?: continue
            val target = userRepository.findById(match.targetUserId) ?: continue
            pushNotificationService.sendToUser(
                userId = match.requesterId,
                title = title,
                body = body(target.publicInfo.nickname),
            )
            pushNotificationService.sendToUser(
                userId = match.targetUserId,
                title = title,
                body = body(requester.publicInfo.nickname),
            )
        }
    }
}
