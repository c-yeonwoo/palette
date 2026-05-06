package kr.ai.palette.domain.auth

import kr.ai.palette.domain.common.UserId

interface RefreshTokenRepository {
    fun save(userId: UserId, refreshToken: String, ttlSeconds: Long)
    fun findByUserId(userId: UserId): String?
    fun deleteByUserId(userId: UserId)
    fun isValid(userId: UserId, refreshToken: String): Boolean
}
