package kr.ai.palette.application.daily

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.shouldBe
import kr.ai.palette.domain.daily.DailyQuestionPool
import java.time.LocalDate

class DailyQuestionPoolTest : DescribeSpec({
    describe("DailyQuestionPool") {
        it("rotates by dayOfYear") {
            val a = DailyQuestionPool.forDate(1)
            val b = DailyQuestionPool.forDate(1 + DailyQuestionPool.QUESTIONS.size)
            a.id shouldBe b.id
        }

        it("byId finds known questions") {
            val q = DailyQuestionPool.forDate(LocalDate.of(2026, 7, 14).dayOfYear)
            DailyQuestionPool.byId(q.id)?.text shouldBe q.text
        }
    }
})
