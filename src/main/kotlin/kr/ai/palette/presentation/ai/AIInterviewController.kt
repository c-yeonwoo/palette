package kr.ai.palette.presentation.ai

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.profile.ColorType
import kr.ai.palette.domain.profile.ColorTypeEnum
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.infrastructure.ai.AdaptiveInterviewContext
import kr.ai.palette.infrastructure.ai.OpenAIService
import kr.ai.palette.infrastructure.ratelimit.RateLimiter
import kr.ai.palette.persistence.interview.InterviewQuestionJpaRepository
import kr.ai.palette.persistence.option.FieldOptionJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Duration

@RestController
@RequestMapping("/api/v1/ai-interview")
class AIInterviewController(
    private val profileRepository: ProfileRepository,
    private val interviewQuestionRepository: InterviewQuestionJpaRepository,
    private val openAIService: OpenAIService,
    private val rateLimiter: RateLimiter,
    private val fieldOptionRepository: FieldOptionJpaRepository,
) {
    private val log = LoggerFactory.getLogger(AIInterviewController::class.java)

    @GetMapping("/questions")
    fun getQuestions(): ResponseEntity<InterviewQuestionsResponse> =
        ResponseEntity.ok(InterviewQuestionsResponse(questions = staticQuestions()))

    /**
     * 적응형 인터뷰 질문 (ADR 0068) — 앞 단계에서 받은 라이프스타일·이상형·MBTI 를 바탕으로
     * LLM 이 그 사람 맞춤 개방형 질문을 생성한다. 응답은 정적 /questions 와 **동일한 형태**라
     * 프론트는 단일 렌더 경로를 쓴다.
     *
     * graceful: 키 없음(stub)·LLM 실패·rate-limit 초과 시 정적 질문으로 폴백 (가입 골든패스 보호).
     * 입력은 전부 칩/enum 코드(자유서술 없음) → 인젝션 표면 없음. 코드→한글 라벨은 여기서 해석.
     */
    @PostMapping("/adaptive")
    fun getAdaptiveQuestions(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: AdaptiveInterviewRequest,
    ): ResponseEntity<InterviewQuestionsResponse> {
        val userId = authUser.userId.value.toString()
        val count = request.count.coerceIn(2, 4)

        // rate-limit — 인터뷰는 막지 않는다. 초과 시 LLM 호출만 생략하고 정적 폴백.
        val rateLimited = try {
            rateLimiter.enforce(
                key = "llm:interview-adaptive:$userId",
                limit = 10,
                window = Duration.ofDays(1),
                message = "적응형 인터뷰 요청이 너무 잦습니다",
            )
            false
        } catch (e: RuntimeException) {
            openAIService.logRateLimited(userId)
            log.info("적응형 인터뷰 rate-limit 초과 — 정적 질문 폴백 user={}", userId)
            true
        }

        if (!rateLimited) {
            val labelMap = optionLabelMap()
            val context = AdaptiveInterviewContext(
                mbti = request.mbti?.trim()?.uppercase()?.takeIf { it.length == 4 && it.all(Char::isLetter) },
                jobCategory = request.jobCategory?.trim()?.takeIf { it.isNotBlank() },
                interests = resolveLabels(labelMap, "interest", request.interests),
                smoking = request.smoking?.let { labelMap[("smoking" to it)] },
                drinking = request.drinking?.let { labelMap[("drinking" to it)] },
                datingStyle = request.datingStyle,
                idealPersonalities = resolveLabels(labelMap, "personality", request.idealPersonalities),
                idealDatePreferences = resolveLabels(labelMap, "datePreference", request.idealDatePreferences),
                idealImportantValues = resolveLabels(labelMap, "importantValue", request.idealImportantValues),
            )
            val generated = openAIService.generateAdaptiveQuestions(context, userId, count)
            if (!generated.isNullOrEmpty()) {
                val questions = generated.mapIndexed { idx, q ->
                    InterviewQuestion(
                        id = q.id,
                        step = idx + 1,
                        category = "맞춤",
                        question = q.question,
                        hint = q.hint,
                        inputType = "text",
                    )
                }
                return ResponseEntity.ok(InterviewQuestionsResponse(questions = questions))
            }
        }

        return ResponseEntity.ok(InterviewQuestionsResponse(questions = staticQuestions()))
    }

    /** ADR 0055 — 어드민이 관리하는 DB 질문(활성, 순서대로). 비어있으면 하드코딩 기본값으로 폴백. */
    private fun staticQuestions(): List<InterviewQuestion> {
        val rows = interviewQuestionRepository.findByActiveTrueOrderByDisplayOrderAsc()
        return if (rows.isEmpty()) {
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
    }

    /** (setKey, code) → 한글 라벨 맵 (활성 옵션). ADR 0057 field_options. */
    private fun optionLabelMap(): Map<Pair<String, String>, String> =
        fieldOptionRepository.findByActiveTrueOrderBySetKeyAscDisplayOrderAsc()
            .associate { (it.setKey to it.code) to it.label }

    /** 코드 리스트를 한글 라벨로 — 못 찾은 코드는 비우지 않고 원본 유지(드물게 미시드 대비). */
    private fun resolveLabels(map: Map<Pair<String, String>, String>, setKey: String, codes: List<String>): List<String> =
        codes.mapNotNull { code -> map[setKey to code] ?: code.takeIf { it.isNotBlank() } }

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
                question = "주말엔 주로 뭐 하시나요?",
                hint = "해당하는 걸 골라주세요 (여러 개 선택 가능)",
                inputType = "chips",
                chips = listOf("운동", "카페", "맛집", "여행", "넷플릭스", "전시·공연", "게임", "자기계발", "친구 만남", "드라이브"),
            ),
            InterviewQuestion(
                id = "personality",
                step = 2,
                category = "성격",
                question = "친구들이 당신을 어떻게 표현하나요?",
                hint = "나를 잘 표현하는 단어들을 골라주세요",
                inputType = "chips",
                chips = listOf("다정한", "유머있는", "차분한", "열정적인", "지적인", "섬세한", "긍정적인", "솔직한", "활발한", "신중한", "배려심많은", "자유로운"),
            ),
            InterviewQuestion(
                id = "passion",
                step = 3,
                category = "관심사",
                question = "요즘 빠져있는 게 있나요?",
                hint = "요즘 관심 있는 것, 취미, 새로 시작한 것 등",
                inputType = "text",
            ),
            InterviewQuestion(
                id = "happiness",
                step = 4,
                category = "행복",
                question = "어떤 순간에 가장 행복하세요?",
                hint = "소소하거나 특별한 행복의 순간들",
                inputType = "text",
            ),
            InterviewQuestion(
                id = "motto",
                step = 5,
                category = "가치관",
                question = "나의 인생 좌우명이나 요즘 마음에 두는 말은?",
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

/**
 * 적응형 인터뷰 요청 — 앞 단계에서 모은 구조화 정보를 **코드 그대로** 전달.
 * 코드→한글 라벨 해석은 컨트롤러가 field_options 로 처리하므로 프론트는 가공 불필요.
 */
data class AdaptiveInterviewRequest(
    val mbti: String? = null,
    val jobCategory: String? = null,
    val interests: List<String> = emptyList(),
    val smoking: String? = null,
    val drinking: String? = null,
    val datingStyle: Map<String, String> = emptyMap(),
    val idealPersonalities: List<String> = emptyList(),
    val idealDatePreferences: List<String> = emptyList(),
    val idealImportantValues: List<String> = emptyList(),
    val count: Int = 4,   // 자기 성향 ~2 + 이상형 심층 ~2 (ADR 0068 후속)
)

data class CompleteInterviewRequest(
    val colorType: String,
    val answers: Map<String, String> = emptyMap(),
    val colorReasoning: String? = null,
    val personalitySummary: String? = null,
    val idealTypeInsight: String? = null,
    val strengths: List<String>? = null,
)
