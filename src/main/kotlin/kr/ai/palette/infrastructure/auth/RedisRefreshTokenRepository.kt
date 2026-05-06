package kr.ai.palette.infrastructure.auth

import kr.ai.palette.domain.auth.RefreshTokenRepository
import kr.ai.palette.domain.common.UserId
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository
import java.time.Duration

@Repository
@ConditionalOnProperty(name = ["spring.data.redis.enabled"], havingValue = "true")
class RedisRefreshTokenRepository(
    private val redisTemplate: StringRedisTemplate
) : RefreshTokenRepository {

    private fun key(userId: UserId) = "refresh_token:${userId.value}"

    override fun save(userId: UserId, refreshToken: String, ttlSeconds: Long) {
        redisTemplate.opsForValue().set(key(userId), refreshToken, Duration.ofSeconds(ttlSeconds))
    }

    override fun findByUserId(userId: UserId): String? =
        redisTemplate.opsForValue().get(key(userId))

    override fun deleteByUserId(userId: UserId) {
        redisTemplate.delete(key(userId))
    }

    override fun isValid(userId: UserId, refreshToken: String): Boolean =
        findByUserId(userId) == refreshToken
}
