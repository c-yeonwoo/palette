package kr.ai.palette.infrastructure.ratelimit

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.kotest.assertions.throwables.shouldThrow
import kr.ai.palette.infrastructure.exception.RateLimitExceededException
import java.time.Duration

class InMemoryRateLimiterTest : DescribeSpec({
    describe("InMemoryRateLimiter (어뷰징 방지 — ADR 0023)") {
        it("limit 까지 허용하고 초과하면 차단한다") {
            val rl = InMemoryRateLimiter()
            val window = Duration.ofMinutes(1)
            rl.tryAcquire("k1", 3, window) shouldBe true
            rl.tryAcquire("k1", 3, window) shouldBe true
            rl.tryAcquire("k1", 3, window) shouldBe true
            rl.tryAcquire("k1", 3, window) shouldBe false
        }

        it("키가 다르면 독립적으로 카운트한다") {
            val rl = InMemoryRateLimiter()
            val window = Duration.ofMinutes(1)
            rl.tryAcquire("a", 1, window) shouldBe true
            rl.tryAcquire("a", 1, window) shouldBe false
            rl.tryAcquire("b", 1, window) shouldBe true
        }

        it("윈도우가 지나면 리셋된다") {
            val rl = InMemoryRateLimiter()
            val window = Duration.ofMillis(50)
            rl.tryAcquire("k", 1, window) shouldBe true
            rl.tryAcquire("k", 1, window) shouldBe false
            Thread.sleep(60)
            rl.tryAcquire("k", 1, window) shouldBe true
        }

        it("enforce 는 초과 시 429 예외를 던진다") {
            val rl = InMemoryRateLimiter()
            val window = Duration.ofMinutes(1)
            rl.enforce("e", 1, window, "too many")
            shouldThrow<RateLimitExceededException> { rl.enforce("e", 1, window, "too many") }
        }
    }
})
