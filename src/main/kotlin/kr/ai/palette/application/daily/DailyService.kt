package kr.ai.palette.application.daily

import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.application.billing.TrialPolicy
import kr.ai.palette.domain.daily.DailyQuestion
import kr.ai.palette.domain.daily.DailyQuestionPool
import kr.ai.palette.persistence.daily.DailyAnswerEntity
import kr.ai.palette.persistence.daily.DailyAnswerJpaRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

data class DailyTodayResult(
    val date: LocalDate,
    val question: DailyQuestion,
    val answered: Boolean,
    val myAnswer: String?,
    val streakDays: Int,
    val bonusGranted: Int,
)

@Service
class DailyService(
    private val answerRepo: DailyAnswerJpaRepository,
    private val billingService: BillingService,
) {
    companion object {
        /** 일일 질문 완료 보너스 물감 (소량 · 어뷰징 방지용 하루 1회) */
        const val DAILY_BONUS_POINTS = 2
        const val DAILY_BONUS_VALID_DAYS = 7
        const val MAX_ANSWER_LENGTH = 80
    }

    fun getToday(userId: String): DailyTodayResult {
        val today = LocalDate.now(TrialPolicy.KST)
        val question = DailyQuestionPool.forDate(today.dayOfYear)
        val existing = answerRepo.findByUserIdAndAnswerDate(userId, today)
        return DailyTodayResult(
            date = today,
            question = question,
            answered = existing != null,
            myAnswer = existing?.answerText,
            streakDays = computeStreak(userId, today),
            bonusGranted = if (existing != null) DAILY_BONUS_POINTS else 0,
        )
    }

    @Transactional
    fun answer(userId: String, questionId: String, answerRaw: String): DailyTodayResult {
        val today = LocalDate.now(TrialPolicy.KST)
        val expected = DailyQuestionPool.forDate(today.dayOfYear)
        require(questionId == expected.id) { "오늘의 질문이 아니에요" }

        val answer = answerRaw.trim()
        require(answer.isNotEmpty()) { "답변을 입력해주세요" }
        require(answer.length <= MAX_ANSWER_LENGTH) { "답변은 ${MAX_ANSWER_LENGTH}자까지예요" }

        val existing = answerRepo.findByUserIdAndAnswerDate(userId, today)
        if (existing != null) {
            return DailyTodayResult(
                date = today,
                question = expected,
                answered = true,
                myAnswer = existing.answerText,
                streakDays = computeStreak(userId, today),
                bonusGranted = 0,
            )
        }

        // chip이면 풀에 있는 값인지 느슨히 허용 (커스텀 텍스트도 OK)
        answerRepo.save(
            DailyAnswerEntity(
                userId = userId,
                answerDate = today,
                questionId = questionId,
                answerText = answer.take(MAX_ANSWER_LENGTH),
            )
        )

        billingService.grantBonus(
            userId = userId,
            points = DAILY_BONUS_POINTS,
            validDays = DAILY_BONUS_VALID_DAYS,
            reason = "daily_question:$today",
        )

        return DailyTodayResult(
            date = today,
            question = expected,
            answered = true,
            myAnswer = answer.take(MAX_ANSWER_LENGTH),
            streakDays = computeStreak(userId, today),
            bonusGranted = DAILY_BONUS_POINTS,
        )
    }

    /** 오늘부터 연속으로 답변한 일수 (오늘 미답변이면 어제까지 연속). */
    fun computeStreak(userId: String, today: LocalDate): Int {
        val from = today.minusDays(60)
        val dates = answerRepo
            .findByUserIdAndAnswerDateBetweenOrderByAnswerDateDesc(userId, from, today)
            .map { it.answerDate }
            .toSet()

        var cursor = if (today in dates) today else today.minusDays(1)
        if (cursor !in dates) return 0

        var streak = 0
        while (cursor in dates) {
            streak++
            cursor = cursor.minusDays(1)
        }
        return streak
    }
}
