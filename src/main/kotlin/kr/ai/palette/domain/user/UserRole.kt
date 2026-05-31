package kr.ai.palette.domain.user

/**
 * 사용자 역할.
 * - USER: 일반 사용자 (REGULAR / MATCHMAKER_ONLY 모두 포함)
 * - ADMIN: 운영자 — /api/v1/admin 하위 endpoint 접근 가능
 *
 * AccountType (REGULAR vs MATCHMAKER_ONLY) 와는 다른 축.
 * 운영자도 별도 admin 페이지(/admin)로만 접근, 일반 서비스는 사용하지 않음.
 */
enum class UserRole {
    USER,
    ADMIN;

    fun authorityName(): String = "ROLE_$name"
}
