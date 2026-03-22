package kr.ai.palette.application.notification

import kr.ai.palette.domain.notification.NotificationType
import kr.ai.palette.domain.notification.PaletteEvent
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Async
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

/**
 * PaletteEvent를 수신해 알림을 생성한다.
 *
 * - @TransactionalEventListener(AFTER_COMMIT): 주 트랜잭션 커밋 후에 실행 → 데이터 정합성 보장
 * - @Async: 별도 스레드에서 처리 → 주 요청 응답 지연 없음
 * - 내부에서 notificationService.create()가 새 트랜잭션으로 알림 저장
 */
@Component
class NotificationEventListener(
    private val notificationService: NotificationService
) {
    private val log = LoggerFactory.getLogger(NotificationEventListener::class.java)

    // ── 주선 요청 ──────────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMatchmakingRequested(event: PaletteEvent.MatchmakingRequested) = runSafely("MatchmakingRequested") {
        notificationService.create(
            userId = event.matchmakerId,
            type = NotificationType.MATCH_REQUEST,
            title = "새 주선 요청 도착",
            body = "${event.requesterName}님이 ${event.targetName}님과의 주선을 요청했습니다",
            metadata = mapOf("requestId" to event.requestId)
        )
    }

    // ── 주선자 승인 ────────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMatchmakingApproved(event: PaletteEvent.MatchmakingApproved) = runSafely("MatchmakingApproved") {
        // 요청자에게: 주선자가 승인했다
        notificationService.create(
            userId = event.requesterId,
            type = NotificationType.MATCH_APPROVED,
            title = "주선 요청이 승인되었습니다 ✅",
            body = "${event.matchmakerName}님이 주선 요청을 승인했습니다. 상대방의 응답을 기다려주세요.",
            metadata = mapOf("requestId" to event.requestId)
        )
        // 피주선자에게: 새 소개가 도착했다
        val targetBody = buildString {
            append("새로운 소개가 도착했습니다")
            if (!event.matchmakerMessage.isNullOrBlank()) {
                append(" — \"${event.matchmakerMessage}\"")
            }
        }
        notificationService.create(
            userId = event.targetUserId,
            type = NotificationType.MATCH_APPROVED,
            title = "새로운 소개가 도착했어요 💌",
            body = targetBody,
            metadata = mapOf("requestId" to event.requestId)
        )
    }

    // ── 주선자 거절 ────────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMatchmakingRejectedByMatchmaker(event: PaletteEvent.MatchmakingRejectedByMatchmaker) =
        runSafely("MatchmakingRejectedByMatchmaker") {
            notificationService.create(
                userId = event.requesterId,
                type = NotificationType.MATCH_REJECTED,
                title = "주선 요청이 거절되었습니다",
                body = "${event.matchmakerName}님이 이번 주선은 어렵다고 했어요. 다른 인연을 찾아보세요.",
                metadata = mapOf("requestId" to event.requestId)
            )
        }

    // ── 매칭 성사 ──────────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMatchmakingCompleted(event: PaletteEvent.MatchmakingCompleted) = runSafely("MatchmakingCompleted") {
        // 요청자에게
        notificationService.create(
            userId = event.requesterId,
            type = NotificationType.MATCH_COMPLETED,
            title = "매칭이 성사되었습니다 🎉",
            body = "${event.partnerName}님과의 소개가 성사되었습니다! 연락처를 확인해보세요.",
            metadata = mapOf("requestId" to event.requestId)
        )
        // 주선자에게
        notificationService.create(
            userId = event.matchmakerId,
            type = NotificationType.MATCH_COMPLETED,
            title = "주선 성공! +1,500P 🎊",
            body = "${event.partnerName}님과의 주선이 성사되었습니다. 포인트가 지급되었어요.",
            metadata = mapOf("requestId" to event.requestId)
        )
    }

    // ── 피주선자 거절 ──────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMatchmakingRejectedByTarget(event: PaletteEvent.MatchmakingRejectedByTarget) =
        runSafely("MatchmakingRejectedByTarget") {
            notificationService.create(
                userId = event.requesterId,
                type = NotificationType.MATCH_REJECTED_BY_TARGET,
                title = "이번 인연은 아니었어요",
                body = "아쉽게도 이번 주선은 이루어지지 않았습니다. 다음 인연을 기대해보세요.",
                metadata = mapOf("requestId" to event.requestId)
            )
        }

    // ── 친구 요청 ──────────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onFriendRequested(event: PaletteEvent.FriendRequested) = runSafely("FriendRequested") {
        notificationService.create(
            userId = event.targetUserId,
            type = NotificationType.FRIEND_REQUEST,
            title = "새 친구 요청",
            body = "${event.requesterName}님이 친구 요청을 보냈습니다",
            metadata = mapOf("friendshipId" to event.friendshipId)
        )
    }

    // ── 친구 수락 ──────────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onFriendAccepted(event: PaletteEvent.FriendAccepted) = runSafely("FriendAccepted") {
        notificationService.create(
            userId = event.requesterId,
            type = NotificationType.FRIEND_ACCEPTED,
            title = "친구 요청이 수락되었습니다 🤝",
            body = "${event.accepterName}님이 친구 요청을 수락했습니다",
            metadata = mapOf("friendshipId" to event.friendshipId)
        )
    }

    // ── 유틸 ──────────────────────────────────────────────────────────

    private inline fun runSafely(tag: String, block: () -> Unit) {
        try {
            block()
        } catch (e: Exception) {
            log.error("[$tag] 알림 생성 실패: ${e.message}", e)
        }
    }
}
