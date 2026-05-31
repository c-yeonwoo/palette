package kr.ai.palette.domain.auth

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.AccountType
import kr.ai.palette.domain.user.UserRole

data class AuthUser(
    val userId: UserId,
    val nickname: String,
    val accountType: AccountType,
    val isProfileCompleted: Boolean,
    /** 운영자 권한. JwtAuthenticationFilter 가 이 값으로 GrantedAuthority 부여. */
    val role: UserRole = UserRole.USER,
) {
    fun canAccessMatchingService(): Boolean {
        return accountType == AccountType.REGULAR && isProfileCompleted
    }

    fun canAccessMatchmakerService(): Boolean {
        return true // All users can be matchmakers
    }

    fun isAdmin(): Boolean = role == UserRole.ADMIN

    companion object {
        fun anonymous(): AuthUser {
            return AuthUser(
                userId = UserId(java.util.UUID.randomUUID()),
                nickname = "anonymous",
                accountType = AccountType.REGULAR,
                isProfileCompleted = false,
                role = UserRole.USER,
            )
        }
    }
}
