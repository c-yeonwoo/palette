package kr.ai.palette.domain.auth

import java.time.Instant

data class AuthToken(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresAt: Instant,
    val refreshExpiresAt: Instant
) {
    fun isAccessTokenExpired(): Boolean {
        return Instant.now().isAfter(expiresAt)
    }

    fun isRefreshTokenExpired(): Boolean {
        return Instant.now().isAfter(refreshExpiresAt)
    }

    fun isValid(): Boolean {
        return !isAccessTokenExpired()
    }

    companion object {
        fun create(
            accessToken: String,
            refreshToken: String,
            accessTokenExpirySeconds: Long = 3600, // 1 hour
            refreshTokenExpirySeconds: Long = 2592000 // 30 days
        ): AuthToken {
            val now = Instant.now()
            return AuthToken(
                accessToken = accessToken,
                refreshToken = refreshToken,
                expiresAt = now.plusSeconds(accessTokenExpirySeconds),
                refreshExpiresAt = now.plusSeconds(refreshTokenExpirySeconds)
            )
        }
    }
}
