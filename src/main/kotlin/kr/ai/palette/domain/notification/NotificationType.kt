package kr.ai.palette.domain.notification

enum class NotificationType {
    MATCH_REQUEST,          // 주선자에게: 새 주선 요청
    MATCH_APPROVED,         // 요청자에게: 주선자 승인 / 피주선자에게: 소개 도착
    MATCH_REJECTED,         // 요청자에게: 주선 거절
    MATCH_COMPLETED,        // 요청자+주선자에게: 매칭 성사
    MATCH_REJECTED_BY_TARGET, // 요청자에게: 피주선자 거절
    FRIEND_REQUEST,         // 피요청자에게: 친구 요청
    FRIEND_ACCEPTED,        // 요청자에게: 친구 수락
    PROFILE_VIEW,           // 본인에게: 프로필 열람
    SYSTEM                  // 시스템 알림
}
