package kr.ai.palette.presentation.ai

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.profile.ColorType
import kr.ai.palette.domain.profile.ColorTypeEnum
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.infrastructure.ai.OpenAIService
import kr.ai.palette.persistence.interview.InterviewQuestionJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/ai-interview")
class AIInterviewController(
    private val profileRepository: ProfileRepository,
    private val interviewQuestionRepository: InterviewQuestionJpaRepository,
) {

    @GetMapping("/questions")
    fun getQuestions(): ResponseEntity<InterviewQuestionsResponse> {
        // ADR 0055 — 어드민이 관리하는 DB 질문(활성, 순서대로). 비어있으면 하드코딩 기본값으로 폴백.
        val rows = interviewQuestionRepository.findByActiveTrueOrderByDisplayOrderAsc()
        val questions = if (rows.isEmpty()) {
            INTERVIEW_QUESTIONS
        } else {
            rows.map { row ->
                InterviewQuestion(
                    id = row.questionKey,
                    step = row.displayOrder,
                    category = row.category,
                    question = row.question,
                    hint = row.hint ?: "",
                    inputType = row.inputType,
                    chips = row.chips?.split("\n")?.filter { it.isNotBlank() } ?: emptyList(),
                )
            }
        }
        return ResponseEntity.ok(InterviewQuestionsResponse(questions = questions))
    }

    @PostMapping("/complete")
    @Transactional
    fun completeInterview(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: CompleteInterviewRequest,
    ): ResponseEntity<Unit> {
        val profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        val colorTypeEnum = runCatching { ColorTypeEnum.valueOf(request.colorType) }.getOrNull()
        val colorInfo = OpenAIService.COLOR_TYPE_INFO[request.colorType]

        val updatedProfile = profile.updateColorType(
            ColorType(
                type = colorTypeEnum,
                name = colorInfo?.name,
                hex = colorInfo?.hex,
                description = colorInfo?.description,
                reasoning = request.colorReasoning?.takeIf { it.isNotBlank() },
                personalitySummary = request.personalitySummary?.takeIf { it.isNotBlank() },
                idealTypeInsight = request.idealTypeInsight?.takeIf { it.isNotBlank() },
                strengths = request.strengths?.filter { it.isNotBlank() }?.takeIf { it.isNotEmpty() },
            )
        )
        profileRepository.save(updatedProfile)
        return ResponseEntity.ok().build()
    }

    companion object {
        // 색깔 분석용 "스토리" 5문항만. 직업(basicInfo)·데이트/연애가치/끌리는사람(idealType 칩)과
        // 중복되던 job·date·loveValue·attractedTo 는 제거 — 자유서술 직후 같은 걸 칩으로 또 고르던 피로 해소.
        // (dealBreaker 도 idealType Q5 중복으로 이전에 제거됨.) 구조화 필터는 basicInfo/idealType 이 단일 소스이고
        // 그 데이터는 /ai-profile/generate 요청에 이미 포함되어 색 분석 신호 손실 없음.
        val INTERVIEW_QUESTIONS = listOf(
            InterviewQuestion(
                id = "weekend",
                step = 1,
                category = "라이프스타일",
                question = "주말엔 주로 뭐 하시나요? 🌟",
                hint = "쉬는 날 즐기는 것들을 자유롭게 말씀해주세요",
                inputType = "text",
            ),
            InterviewQuestion(
                id = "personality",
                step = 2,
                category = "성격",
                question = "친구들이 당신을 어떻게 표현하나요? 💫",
                hint = "나를 잘 표현하는 단어들을 골라주세요",
                inputType = "chips",
                chips = listOf("다정한", "재밌는", "차분한", "열정적인", "4차원", "엉뚱한", "섬세한", "긍정적인", "유쾌한", "신중한", "활발한", "따뜻한"),
            ),
            InterviewQuestion(
                id = "passion",
                step = 3,
                category = "관심사",
                question = "요즘 빠져있는 게 있나요? 🔥",
                hint = "요즘 관심 있는 것, 취미, 새로 시작한 것 등",
                inputType = "text",
            ),
            InterviewQuestion(
                id = "happiness",
                step = 4,
                category = "행복",
                question = "어떤 순간에 가장 행복하세요? ✨",
                hint = "소소하거나 특별한 행복의 순간들",
                inputType = "text",
            ),
            InterviewQuestion(
                id = "motto",
                step = 5,
                category = "가치관",
                question = "나의 인생 좌우명이나 요즘 마음에 두는 말은? 🌈",
                hint = "짧은 문장이나 단어도 좋아요",
                inputType = "text",
            ),
        )
    }
}

data class InterviewQuestion(
    val id: String,
    val step: Int,
    val category: String,
    val question: String,
    val hint: String,
    val inputType: String,
    val chips: List<String> = emptyList(),
)

data class InterviewQuestionsResponse(
    val questions: List<InterviewQuestion>,
)

data class CompleteInterviewRequest(
    val colorType: String,
    val answers: Map<String, String> = emptyMap(),
    val colorReasoning: String? = null,
    val personalitySummary: String? = null,
    val idealTypeInsight: String? = null,
    val strengths: List<String>? = null,
)
