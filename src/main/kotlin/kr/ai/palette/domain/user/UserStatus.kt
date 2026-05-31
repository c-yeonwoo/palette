package kr.ai.palette.domain.user

/**
 * 사용자 활동 상태. 탈퇴(DELETED)는 별도로 UserMetadata.deletedAt 으로 표현.
 *
 * - ACTIVE: 정상
 * - SUSPENDED: 운영자가 차단 (사유 필수 — UserStatusInfo.reason)
 * - DORMANT: 장기 미접속/휴면 (자동 또는 수동)
 *
 * 상태 변경은 운영자(ADMIN)만 가능. 변경 시 reason + updatedAt + updatedBy 기록.
 * ADR: docs/DECISIONS/0008-user-status-and-admin-actions.md
 */
enum class UserStatus {
    ACTIVE,
    SUSPENDED,
    DORMANT;

    fun isBlocked(): Boolean = this == SUSPENDED
}
