package kr.ai.palette.presentation.ai

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.profile.ColorType
import kr.ai.palette.domain.profile.ColorTypeEnum
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.infrastructure.ai.OpenAIService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/ai-interview")
class AIInterviewController(
    private val profileRepository: ProfileRepository,
) {

    @GetMapping("/questions")
    fun getQuestions(): ResponseEntity<InterviewQuestionsResponse> {
        return ResponseEntity.ok(InterviewQuestionsResponse(questions = INTERVIEW_QUESTIONS))
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
            )
        )
        profileRepository.save(updatedProfile)
        return ResponseEntity.ok().build()
    }

    companion object {
        val INTERVIEW_QUESTIONS = listOf(
            InterviewQuestion(
                id = "job",
                step = 1,
                category = "기본 정보",
                question = "어떤 일을 하고 계세요? 😊",
                hint = "직업이나 하는 일을 편하게 알려주세요",
                inputType = "chips",
                chips = listOf("IT/개발", "금융/보험", "교육", "의료/보건", "미디어/엔터", "서비스/영업", "공무원", "전문직", "자영업", "기타"),
            ),
            InterviewQuestion(
                id = "weekend",
                step = 2,
                category = "라이프스타일",
                question = "주말엔 주로 뭐 하시나요? 🌟",
                hint = "쉬는 날 즐기는 것들을 자유롭게 말씀해주세요",
                inputType = "text",
            ),
            InterviewQuestion(
                id = "personality",
                step = 3,
                category = "성격",
                question = "친구들이 당신을 어떻게 표현하나요? 💫",
                hint = "나를 잘 표현하는 단어들을 골라주세요",
                inputType = "chips",
                chips = listOf("다정한", "재밌는", "차분한", "열정적인", "4차원", "엉뚱한", "섬세한", "긍정적인", "유쾌한", "신중한", "활발한", "따뜻한"),
            ),
            InterviewQuestion(
                id = "passion",
                step = 4,
                category = "관심사",
                question = "요즘 빠져있는 게 있나요? 🔥",
                hint = "요즘 관심 있는 것, 취미, 새로 시작한 것 등",
                inputType = "text",
            ),
            InterviewQuestion(
                id = "happiness",
                step = 5,
                category = "행복",
                question = "어떤 순간에 가장 행복하세요? ✨",
                hint = "소소하거나 특별한 행복의 순간들",
                inputType = "text",
            ),
            InterviewQuestion(
                id = "date",
                step = 6,
                category = "연애관",
                question = "이상적인 데이트가 있다면? 💑",
                hint = "같이 하고 싶은 것들을 편하게 말씀해주세요",
                inputType = "text",
            ),
            InterviewQuestion(
                id = "loveValue",
                step = 7,
                category = "연애관",
                question = "연애에서 가장 중요하게 생각하는 건? 💝",
                hint = "여러 개 선택 가능해요",
                inputType = "chips",
                chips = listOf("배려심", "대화", "유머", "공감", "신뢰", "솔직함", "취미 공유", "경제적 안정", "외모", "가치관"),
            ),
            InterviewQuestion(
                id = "attractedTo",
                step = 8,
                category = "이상형",
                question = "어떤 사람에게 끌리시나요? 💘",
                hint = "외모, 성격, 분위기 뭐든 자유롭게",
                inputType = "text",
            ),
            // Deal breaker 질문은 이상형 설정의 Q5 와 중복이라 제거 (2026-05 UX)
            InterviewQuestion(
                id = "motto",
                step = 9,
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
)
