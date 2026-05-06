package kr.ai.palette.infrastructure.auth

import kr.ai.palette.domain.auth.RefreshTokenRepository
import kr.ai.palette.domain.common.UserId
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Repository
import java.util.concurrent.ConcurrentHashMap

@Repository
@ConditionalOnProperty(name = ["spring.data.redis.enabled"], havingValue = "false", matchIfMissing = true)
class InMemoryRefreshTokenRepository : RefreshTokenRepository {

    private val store = ConcurrentHashMap<String, String>()

    override fun save(userId: UserId, refreshToken: String, ttlSeconds: Long) {
        store[userId.value.toString()] = refreshToken
    }

    override fun findByUserId(userId: UserId): String? =
        store[userId.value.toString()]

    override fun deleteByUserId(userId: UserId) {
        store.remove(userId.value.toString())
    }

    override fun isValid(userId: UserId, refreshToken: String): Boolean =
        store[userId.value.toString()] == refreshToken
}
