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
        val isPalli = event.matchmakerName == "팔리"

        // 사람 주선자 승인만 요청자에게 알림. 팔리(시스템) 자동 승인은 중복·어색한 알림 스킵 (ADR 0078).
        if (!isPalli) {
            notificationService.create(
                userId = event.requesterId,
                type = NotificationType.MATCH_APPROVED,
                title = "주선 요청이 승인되었습니다 ✅",
                body = "${event.matchmakerName}님이 주선 요청을 승인했습니다. 상대방의 응답을 기다려주세요.",
                metadata = mapOf("requestId" to event.requestId)
            )
        }

        val targetBody = if (isPalli) {
            val who = event.requesterName?.takeIf { it.isNotBlank() }?.let { "${it}님을" } ?: "누군가를"
            "팔리가 ${who} 소개하고 싶어 해요"
        } else {
            buildString {
                append("새로운 소개가 도착했습니다")
                if (!event.matchmakerMessage.isNullOrBlank()) {
                    append(" — \"${event.matchmakerMessage}\"")
                }
            }
        }
        notificationService.create(
            userId = event.targetUserId,
            type = NotificationType.MATCH_APPROVED,
            title = if (isPalli) "팔리가 소개를 보냈어요 💌" else "새로운 소개가 도착했어요 💌",
            body = targetBody,
            metadata = mapOf("requestId" to event.requestId)
        )
    }

    // ── 주선자 거절 ────────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMatchmakingRejectedByMatchmaker(event: PaletteEvent.MatchmakingRejectedByMatchmaker) =
        runSafely("MatchmakingRejectedByMatchmaker") {
            // S-001 — 정서적 회복 톤. "거절"보다 "타이밍이 아니었다" 프레이밍.
            notificationService.create(
                userId = event.requesterId,
                type = NotificationType.MATCH_REJECTED,
                title = "이번엔 타이밍이 아니었어요",
                body = "${event.matchmakerName}님이 이번 주선은 어렵다고 했어요. 소개 요청 티켓은 자동 환불됐어요 — 마음에 드는 다른 분께 다시 시도해보세요.",
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
        // 주선자에게 — 단, 팔레트 Pick 직접 연결(matchmakerId==requesterId, 실제 주선자 없음)이면 스킵(요청자에게 중복 알림 방지).
        if (event.matchmakerId != event.requesterId) {
            notificationService.create(
                userId = event.matchmakerId,
                type = NotificationType.MATCH_COMPLETED,
                // 무현금 모델(ADR 0064/0072): 현금 지급 아님 → "1,500P" 표기 폐기. 명예(등급·리그) + 폐쇄형 물감 크레딧.
                title = "주선 성공! 🎊",
                body = "${event.partnerName}님과의 주선이 성사됐어요. 등급이 오르고 크레딧(물감)이 적립됐습니다.",
                metadata = mapOf("requestId" to event.requestId)
            )
        }
    }

    // ── 피주선자 거절 ──────────────────────────────────────────────────

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onMatchmakingRejectedByTarget(event: PaletteEvent.MatchmakingRejectedByTarget) =
        runSafely("MatchmakingRejectedByTarget") {
            // S-001 — 정서적 회복. "당신 잘못이 아님" + 다음 추천 노출 유도.
            notificationService.create(
                userId = event.requesterId,
                type = NotificationType.MATCH_REJECTED_BY_TARGET,
                title = "이번 인연은 아니었어요 🌿",
                body = "마음이 맞는 시점은 사람마다 달라요. 당신의 색과 더 잘 어울리는 분이 곧 나타날 거예요 — 팔리의 추천에서 확인해보세요.",
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
