package kr.ai.palette.domain.auth

import kr.ai.palette.domain.common.UserId

interface TokenProvider {
    /**
     * JWT Access Token 생성
     */
    fun generateAccessToken(userId: UserId): String

    /**
     * JWT Refresh Token 생성
     */
    fun generateRefreshToken(userId: UserId): String

    /**
     * Access Token에서 UserId 추출
     */
    fun extractUserId(token: String): UserId?

    /**
     * Token 유효성 검증
     */
    fun validateToken(token: String): Boolean
}
