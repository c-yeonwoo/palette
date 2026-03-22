package kr.ai.palette.domain.notification

/**
 * 서비스 내 도메인 이벤트 정의.
 * Spring ApplicationEventPublisher로 발행하며
 * NotificationEventListener가 처리해 Notification을 생성한다.
 */
sealed class PaletteEvent {

    // ── 주선 요청 이벤트 ──────────────────────────────────────────────

    /** 요청자 → 주선자에게 새 주선 요청 */
    data class MatchmakingRequested(
        val requestId: String,
        val matchmakerId: String,
        val requesterName: String,
        val targetName: String
    ) : PaletteEvent()

    /** 주선자 승인: 요청자에게 승인 알림 + 피주선자에게 소개 도착 알림 */
    data class MatchmakingApproved(
        val requestId: String,
        val requesterId: String,
        val targetUserId: String,
        val matchmakerName: String,
        val matchmakerMessage: String?
    ) : PaletteEvent()

    /** 주선자 거절: 요청자에게 거절 알림 */
    data class MatchmakingRejectedByMatchmaker(
        val requestId: String,
        val requesterId: String,
        val matchmakerName: String
    ) : PaletteEvent()

    /** 피주선자 수락(매칭 성사): 요청자 + 주선자에게 알림 */
    data class MatchmakingCompleted(
        val requestId: String,
        val requesterId: String,
        val matchmakerId: String,
        val partnerName: String
    ) : PaletteEvent()

    /** 피주선자 거절: 요청자에게 알림 */
    data class MatchmakingRejectedByTarget(
        val requestId: String,
        val requesterId: String
    ) : PaletteEvent()

    // ── 친구 요청 이벤트 ──────────────────────────────────────────────

    /** 친구 요청 도착: 피요청자에게 알림 */
    data class FriendRequested(
        val friendshipId: String,
        val targetUserId: String,
        val requesterName: String
    ) : PaletteEvent()

    /** 친구 요청 수락: 원래 요청자에게 알림 */
    data class FriendAccepted(
        val friendshipId: String,
        val requesterId: String,
        val accepterName: String
    ) : PaletteEvent()
}
