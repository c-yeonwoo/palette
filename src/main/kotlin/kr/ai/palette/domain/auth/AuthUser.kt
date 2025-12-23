package kr.ai.palette.domain.auth

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.AccountType

data class AuthUser(
    val userId: UserId,
    val nickname: String,
    val accountType: AccountType,
    val isProfileCompleted: Boolean
) {
    fun canAccessMatchingService(): Boolean {
        return accountType == AccountType.REGULAR && isProfileCompleted
    }

    fun canAccessMatchmakerService(): Boolean {
        return true // All users can be matchmakers
    }

    companion object {
        fun anonymous(): AuthUser {
            return AuthUser(
                userId = UserId(java.util.UUID.randomUUID()),
                nickname = "anonymous",
                accountType = AccountType.REGULAR,
                isProfileCompleted = false
            )
        }
    }
}
