package kr.ai.palette.presentation.ai

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.profile.ColorType
import kr.ai.palette.domain.profile.ColorTypeEnum
import kr.ai.palette.domain.profile.ProfileRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/ai-interview")
class AIInterviewController(
    private val profileRepository: ProfileRepository
) {

    @GetMapping("/questions")
    fun getQuestions(): ResponseEntity<InterviewQuestionsResponse> {
        return ResponseEntity.ok(
            InterviewQuestionsResponse(
                questions = INTERVIEW_QUESTIONS
            )
        )
    }

    @PostMapping("/analyze")
    fun analyzeAnswers(
        @RequestBody request: AnalyzeAnswersRequest
    ): ResponseEntity<AnalyzeAnswersResponse> {
        val colorTypeStr = determineColorType(request.answers)
        val colorTypeEnum = runCatching { ColorTypeEnum.valueOf(colorTypeStr) }.getOrNull()
        val colorInfo = COLOR_TYPE_INFO[colorTypeEnum]
        val generatedIntro = generateIntroduction(request.answers, colorTypeStr)
        return ResponseEntity.ok(
            AnalyzeAnswersResponse(
                colorType = colorTypeStr,
                colorName = colorInfo?.first ?: "",
                colorHex = colorInfo?.second ?: "",
                colorDescription = colorInfo?.third ?: "",
                generatedIntroduction = generatedIntro
            )
        )
    }

    @PostMapping("/complete")
    @Transactional
    fun completeInterview(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: CompleteInterviewRequest
    ): ResponseEntity<Unit> {
        val profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        val colorTypeEnum = runCatching { ColorTypeEnum.valueOf(request.colorType) }.getOrNull()
        val colorInfo = COLOR_TYPE_INFO[colorTypeEnum]

        val updatedProfile = profile.updateColorType(
            ColorType(
                type = colorTypeEnum,
                name = colorInfo?.first,
                hex = colorInfo?.second,
                description = colorInfo?.third
            )
        )
        profileRepository.save(updatedProfile)
        return ResponseEntity.ok().build()
    }

    private fun determineColorType(answers: Map<String, String>): String {
        val personalityAnswer = answers["personality"] ?: ""
        val weekendAnswer = answers["weekend"] ?: ""
        val passionAnswer = answers["passion"] ?: ""

        val energeticKeywords = listOf("활발", "운동", "야외", "사람", "파티", "여행", "적극", "열정")
        val calmKeywords = listOf("독서", "카페", "혼자", "집", "영화", "조용", "차분", "신중")
        val creativeKeywords = listOf("전시", "예술", "음악", "창작", "감성", "취미", "요리", "그림")
        val analyticalKeywords = listOf("공부", "분석", "계획", "논리", "효율", "목표", "성취", "전략")

        val combinedText = "$personalityAnswer $weekendAnswer $passionAnswer"

        val energeticScore = energeticKeywords.count { combinedText.contains(it) }
        val calmScore = calmKeywords.count { combinedText.contains(it) }
        val creativeScore = creativeKeywords.count { combinedText.contains(it) }
        val analyticalScore = analyticalKeywords.count { combinedText.contains(it) }

        return when (maxOf(energeticScore, calmScore, creativeScore, analyticalScore)) {
            energeticScore -> if (energeticScore > 0) "VIBRANT_RED" else "WARM_ORANGE"
            calmScore -> "CALM_BLUE"
            creativeScore -> "ELEGANT_PURPLE"
            else -> "SOPHISTICATED_GRAY"
        }.let {
            // Add more variety based on personality chips
            val positiveKeywords = listOf("다정한", "긍정적", "밝은", "유쾌한")
            val romanticKeywords = listOf("섬세한", "낭만적", "감성적", "따뜻한")
            val freshKeywords = listOf("자연스러운", "편안한", "자유로운")

            when {
                positiveKeywords.any { kw -> personalityAnswer.contains(kw) } -> "BRIGHT_YELLOW"
                romanticKeywords.any { kw -> personalityAnswer.contains(kw) } -> "SOFT_PINK"
                freshKeywords.any { kw -> weekendAnswer.contains(kw) } -> "FRESH_GREEN"
                else -> it
            }
        }
    }

    private fun generateIntroduction(answers: Map<String, String>, colorType: String): String {
        val job = answers["job"] ?: "직장인"
        val weekend = answers["weekend"] ?: ""
        val personality = answers["personality"] ?: ""
        val passion = answers["passion"] ?: ""
        val date = answers["date"] ?: ""

        return buildString {
            if (job.isNotBlank()) append("${job}으로 일하고 있어요. ")
            if (weekend.isNotBlank()) append("주말엔 ${weekend}. ")
            if (personality.isNotBlank()) append("친구들은 저를 ${personality} 사람이라고 해요. ")
            if (passion.isNotBlank()) append("요즘은 ${passion}에 푹 빠져있어요. ")
            if (date.isNotBlank()) append("함께하고 싶은 데이트는 ${date}이에요.")
        }.trim()
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
                chips = listOf("IT/개발", "금융/보험", "교육", "의료/보건", "미디어/엔터", "서비스/영업", "공무원", "전문직", "자영업", "기타")
            ),
            InterviewQuestion(
                id = "weekend",
                step = 2,
                category = "라이프스타일",
                question = "주말엔 주로 뭐 하시나요? 🌟",
                hint = "쉬는 날 즐기는 것들을 자유롭게 말씀해주세요",
                inputType = "text"
            ),
            InterviewQuestion(
                id = "personality",
                step = 3,
                category = "성격",
                question = "친구들이 당신을 어떻게 표현하나요? 💫",
                hint = "나를 잘 표현하는 단어들을 골라주세요",
                inputType = "chips",
                chips = listOf("다정한", "재밌는", "차분한", "열정적인", "4차원", "엉뚱한", "섬세한", "긍정적인", "유쾌한", "신중한", "활발한", "따뜻한")
            ),
            InterviewQuestion(
                id = "passion",
                step = 4,
                category = "관심사",
                question = "요즘 빠져있는 게 있나요? 🔥",
                hint = "요즘 관심 있는 것, 취미, 새로 시작한 것 등",
                inputType = "text"
            ),
            InterviewQuestion(
                id = "happiness",
                step = 5,
                category = "행복",
                question = "어떤 순간에 가장 행복하세요? ✨",
                hint = "소소하거나 특별한 행복의 순간들",
                inputType = "text"
            ),
            InterviewQuestion(
                id = "date",
                step = 6,
                category = "연애관",
                question = "이상적인 데이트가 있다면? 💑",
                hint = "같이 하고 싶은 것들을 편하게 말씀해주세요",
                inputType = "text"
            ),
            InterviewQuestion(
                id = "loveValue",
                step = 7,
                category = "연애관",
                question = "연애에서 가장 중요하게 생각하는 건? 💝",
                hint = "여러 개 선택 가능해요",
                inputType = "chips",
                chips = listOf("배려심", "대화", "유머", "공감", "신뢰", "솔직함", "취미 공유", "경제적 안정", "외모", "가치관")
            ),
            InterviewQuestion(
                id = "attractedTo",
                step = 8,
                category = "이상형",
                question = "어떤 사람에게 끌리시나요? 💘",
                hint = "외모, 성격, 분위기 뭐든 자유롭게",
                inputType = "text"
            ),
            InterviewQuestion(
                id = "dealBreaker",
                step = 9,
                category = "이상형",
                question = "절대 안 되는 것(Deal breaker)이 있나요? 🚫",
                hint = "없으면 '없어요'라고 하셔도 돼요",
                inputType = "text"
            ),
            InterviewQuestion(
                id = "motto",
                step = 10,
                category = "가치관",
                question = "나의 인생 좌우명이나 요즘 마음에 두는 말은? 🌈",
                hint = "짧은 문장이나 단어도 좋아요",
                inputType = "text"
            )
        )

        val COLOR_TYPE_INFO = mapOf(
            ColorTypeEnum.WARM_ORANGE to Triple("따뜻한 오렌지", "#FF8C42", "활발하고 다정한 당신은 주변을 밝게 만드는 에너지가 있어요"),
            ColorTypeEnum.CALM_BLUE to Triple("차분한 블루", "#4A90D9", "신중하고 깊이있는 당신은 믿음직한 존재감을 가지고 있어요"),
            ColorTypeEnum.VIBRANT_RED to Triple("생동감있는 레드", "#E74C3C", "열정적이고 적극적인 당신은 삶을 가득 채우는 에너지가 넘쳐요"),
            ColorTypeEnum.SOFT_PINK to Triple("부드러운 핑크", "#F48FB1", "섬세하고 낭만적인 당신은 감성이 풍부하고 따뜻한 마음을 가졌어요"),
            ColorTypeEnum.FRESH_GREEN to Triple("신선한 그린", "#4CAF50", "자연스럽고 편안한 당신은 함께 있으면 마음이 편안해지는 사람이에요"),
            ColorTypeEnum.ELEGANT_PURPLE to Triple("고급스러운 퍼플", "#9B59B6", "지적이고 감각적인 당신은 독특한 매력과 깊은 내면을 가지고 있어요"),
            ColorTypeEnum.BRIGHT_YELLOW to Triple("밝은 옐로우", "#F1C40F", "긍정적이고 유쾌한 당신은 어디서든 분위기를 밝게 만드는 존재예요"),
            ColorTypeEnum.SOPHISTICATED_GRAY to Triple("세련된 그레이", "#7F8C8D", "이성적이고 프로페셔널한 당신은 어떤 상황에도 신뢰를 주는 사람이에요")
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
    val chips: List<String> = emptyList()
)

data class InterviewQuestionsResponse(
    val questions: List<InterviewQuestion>
)

data class AnalyzeAnswersRequest(
    val answers: Map<String, String>
)

data class AnalyzeAnswersResponse(
    val colorType: String,
    val colorName: String = "",
    val colorHex: String = "",
    val colorDescription: String = "",
    val generatedIntroduction: String
)

data class CompleteInterviewRequest(
    val colorType: String,
    val answers: Map<String, String>
)
