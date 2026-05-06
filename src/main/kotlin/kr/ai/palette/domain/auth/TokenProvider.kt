package kr.ai.palette.domain.auth

import kr.ai.palette.domain.common.UserId

interface TokenProvider {
    fun generateAccessToken(userId: UserId): String
    fun generateRefreshToken(userId: UserId): String
    fun extractUserId(token: String): UserId?
    fun validateToken(token: String): Boolean
    fun refreshTokenExpirySeconds(): Long
}
