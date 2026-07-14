package kr.ai.palette.application.daily

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.domain.daily.DailyQuestionPool
import kr.ai.palette.persistence.daily.DailyAnswerEntity
import kr.ai.palette.persistence.daily.DailyAnswerJpaRepository
import java.time.LocalDate

class DailyServiceStreakTest : DescribeSpec({
    describe("computeStreak") {
        it("counts consecutive days ending today") {
            val today = LocalDate.of(2026, 7, 14)
            val repo = mockk<DailyAnswerJpaRepository>()
            val billing = mockk<BillingService>(relaxed = true)
            every {
                repo.findByUserIdAndAnswerDateBetweenOrderByAnswerDateDesc(any(), any(), any())
            } returns listOf(
                DailyAnswerEntity(userId = "u1", answerDate = today, questionId = "q", answerText = "a"),
                DailyAnswerEntity(userId = "u1", answerDate = today.minusDays(1), questionId = "q", answerText = "a"),
                DailyAnswerEntity(userId = "u1", answerDate = today.minusDays(2), questionId = "q", answerText = "a"),
            )
            val service = DailyService(repo, billing)
            service.computeStreak("u1", today) shouldBe 3
        }

        it("returns 0 when no recent answers") {
            val today = LocalDate.of(2026, 7, 14)
            val repo = mockk<DailyAnswerJpaRepository>()
            val billing = mockk<BillingService>(relaxed = true)
            every {
                repo.findByUserIdAndAnswerDateBetweenOrderByAnswerDateDesc(any(), any(), any())
            } returns emptyList()
            DailyService(repo, billing).computeStreak("u1", today) shouldBe 0
        }
    }

    describe("answer idempotency") {
        it("does not double-grant bonus on second answer same day") {
            val today = LocalDate.now(kr.ai.palette.application.billing.TrialPolicy.KST)
            val q = DailyQuestionPool.forDate(today.dayOfYear)
            val existing = DailyAnswerEntity(
                userId = "u1",
                answerDate = today,
                questionId = q.id,
                answerText = "기존",
            )
            val repo = mockk<DailyAnswerJpaRepository>()
            val billing = mockk<BillingService>(relaxed = true)
            every { repo.findByUserIdAndAnswerDate("u1", today) } returns existing
            every {
                repo.findByUserIdAndAnswerDateBetweenOrderByAnswerDateDesc(any(), any(), any())
            } returns listOf(existing)

            val result = DailyService(repo, billing).answer("u1", q.id, "새답")
            result.bonusGranted shouldBe 0
            result.myAnswer shouldBe "기존"
            verify(exactly = 0) { billing.grantBonus(any(), any(), any(), any()) }
        }
    }
})
