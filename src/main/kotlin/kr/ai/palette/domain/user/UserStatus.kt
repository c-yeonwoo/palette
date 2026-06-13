package kr.ai.palette.domain.user

/**
 * 사용자 활동 상태. 탈퇴(DELETED)는 별도로 UserMetadata.deletedAt 으로 표현.
 *
 * - ACTIVE: 정상 (= 운영자 승인 완료)
 * - PENDING_APPROVAL: 프로필 완성 후 운영자 승인 대기 (ADR 0054). 로그인은 되나 서비스 이용 차단
 * - REJECTED: 운영자가 프로필/인증을 반려 (사유 필수). 재제출 가능
 * - SUSPENDED: 운영자가 차단 (사유 필수 — UserStatusInfo.reason)
 * - DORMANT: 장기 미접속/휴면 (자동 또는 수동)
 *
 * 상태 변경은 운영자(ADMIN)만 가능. 변경 시 reason + updatedAt + updatedBy 기록.
 * ADR: docs/DECISIONS/0008-user-status-and-admin-actions.md, 0054 (승인 게이팅)
 */
enum class UserStatus {
    ACTIVE,
    PENDING_APPROVAL,
    REJECTED,
    SUSPENDED,
    DORMANT;

    fun isBlocked(): Boolean = this == SUSPENDED

    /** 프로필은 완성했지만 아직 서비스를 이용할 수 없는 상태 (승인 대기/반려) */
    fun requiresApproval(): Boolean = this == PENDING_APPROVAL || this == REJECTED
}
