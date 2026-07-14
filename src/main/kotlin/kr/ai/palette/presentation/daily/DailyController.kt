package kr.ai.palette.presentation.daily

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import kr.ai.palette.application.daily.DailyService
import kr.ai.palette.domain.auth.AuthUser
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

data class DailyQuestionDto(
    val id: String,
    val text: String,
    val hint: String?,
    val chips: List<String>,
)

data class DailyTodayResponse(
    val date: String,
    val question: DailyQuestionDto,
    val answered: Boolean,
    val myAnswer: String?,
    val streakDays: Int,
    val bonusGranted: Int,
    val bonusPointsOnComplete: Int = DailyService.DAILY_BONUS_POINTS,
)

data class DailyAnswerRequest(
    @field:NotBlank
    val questionId: String,
    @field:NotBlank
    @field:Size(max = 80)
    val answer: String,
)

@RestController
@RequestMapping("/api/v1/daily")
class DailyController(
    private val dailyService: DailyService,
) {

    @GetMapping("/today")
    fun getToday(
        @AuthenticationPrincipal authUser: AuthUser,
    ): ResponseEntity<DailyTodayResponse> {
        val result = dailyService.getToday(authUser.userId.value.toString())
        return ResponseEntity.ok(toResponse(result))
    }

    @PostMapping("/answer")
    fun answer(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody body: DailyAnswerRequest,
    ): ResponseEntity<DailyTodayResponse> {
        return try {
            val result = dailyService.answer(
                userId = authUser.userId.value.toString(),
                questionId = body.questionId,
                answerRaw = body.answer,
            )
            ResponseEntity.ok(toResponse(result))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().build()
        }
    }

    private fun toResponse(result: kr.ai.palette.application.daily.DailyTodayResult) =
        DailyTodayResponse(
            date = result.date.toString(),
            question = DailyQuestionDto(
                id = result.question.id,
                text = result.question.text,
                hint = result.question.hint,
                chips = result.question.chips,
            ),
            answered = result.answered,
            myAnswer = result.myAnswer,
            streakDays = result.streakDays,
            bonusGranted = result.bonusGranted,
        )
}
