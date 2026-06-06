package kr.ai.palette.infrastructure.ratelimit

import kr.ai.palette.infrastructure.exception.RateLimitExceededException
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Component
import java.time.Duration
import java.util.concurrent.ConcurrentHashMap

/**
 * 고정 윈도우 rate limiter (어뷰징 방지 — ADR 0023).
 * 친구/매칭 요청·Nudge 등 쓰기 액션 스팸 차단.
 *
 * 구현 분기는 refresh token 패턴과 동일:
 *  - spring.data.redis.enabled=true  → Redis (다중 인스턴스 안전)
 *  - 미설정/false (dev·단일 인스턴스) → in-memory
 */
interface RateLimiter {
    /** window 동안 limit 회까지 허용. 초과면 false. */
    fun tryAcquire(key: String, limit: Int, window: Duration): Boolean

    /** 초과 시 429 예외를 던지는 헬퍼. */
    fun enforce(key: String, limit: Int, window: Duration, message: String) {
        if (!tryAcquire(key, limit, window)) throw RateLimitExceededException(message)
    }
}

@Component
@ConditionalOnProperty(name = ["spring.data.redis.enabled"], havingValue = "false", matchIfMissing = true)
class InMemoryRateLimiter : RateLimiter {
    private data class Counter(val windowStartMs: Long, val count: Int)
    private val buckets = ConcurrentHashMap<String, Counter>()

    override fun tryAcquire(key: String, limit: Int, window: Duration): Boolean {
        val nowMs = System.currentTimeMillis()
        val windowMs = window.toMillis()
        val updated = buckets.compute(key) { _, cur ->
            if (cur == null || nowMs - cur.windowStartMs >= windowMs) {
                Counter(nowMs, 1)
            } else {
                cur.copy(count = cur.count + 1)
            }
        }!!
        // 메모리 누수 방지: 가끔 만료 버킷 정리
        if (buckets.size > 10_000) {
            buckets.entries.removeIf { nowMs - it.value.windowStartMs >= windowMs }
        }
        return updated.count <= limit
    }
}

@Component
@ConditionalOnProperty(name = ["spring.data.redis.enabled"], havingValue = "true")
class RedisRateLimiter(
    private val redisTemplate: StringRedisTemplate
) : RateLimiter {
    override fun tryAcquire(key: String, limit: Int, window: Duration): Boolean {
        val redisKey = "ratelimit:$key"
        val count = redisTemplate.opsForValue().increment(redisKey) ?: 1L
        if (count == 1L) {
            redisTemplate.expire(redisKey, window)
        }
        return count <= limit
    }
}
