package kr.ai.palette.domain.notification

enum class NotificationType {
    MATCH_REQUEST,             // 주선자에게: 새 주선 요청
    MATCH_APPROVED,            // 요청자에게: 주선자 승인 / 피주선자에게: 소개 도착
    MATCH_REJECTED,            // 요청자에게: 주선 거절
    MATCH_COMPLETED,           // 요청자+주선자에게: 매칭 성사
    MATCH_REJECTED_BY_TARGET,  // 요청자에게: 피주선자 거절
    FRIEND_REQUEST,            // 피요청자에게: 친구 요청
    FRIEND_ACCEPTED,           // 요청자에게: 친구 수락
    PROFILE_VIEW,              // 본인에게: 프로필 열람
    // B-007 retention 트리거 (ADR 0041)
    FRIEND_NEW_SIGNUP,         // 본인에게: 지인이 가입했어요
    FEED_REFRESHED,            // 본인에게: 친구의 친구 풀 신규 N명 진입
    DAILY_PICK,                // 본인에게: 오늘의 팔레트 Pick 갱신
    POST_MATCH_NUDGE,          // 본인에게: 매칭 후 D+N "첫 메시지 보내셨나요?"
    MATCHMAKER_WEEKLY_REPORT,  // 주선자에게: 주간 활동 보고
    PROFILE_APPROVED,          // 본인에게: 운영자 프로필 승인 완료 (ADR 0054/0062)
    SYSTEM                     // 시스템 알림
}
