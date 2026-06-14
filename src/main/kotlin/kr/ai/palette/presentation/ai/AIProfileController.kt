package kr.ai.palette.presentation.ai

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.ai.IdealTypeContext
import kr.ai.palette.infrastructure.ai.IntroMethod
import kr.ai.palette.infrastructure.ai.OpenAIService
import kr.ai.palette.infrastructure.ai.ProfileGenerationRequest
import kr.ai.palette.infrastructure.ai.ProfileGenerationResult
import kr.ai.palette.infrastructure.ai.SajuService
import kr.ai.palette.infrastructure.ratelimit.RateLimiter
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.time.Duration
import java.time.LocalDate

@RestController
@RequestMapping("/api/v1/ai-profile")
class AIProfileController(
    private val openAIService: OpenAIService,
    private val rateLimiter: RateLimiter,
    private val userRepository: UserRepository,
    private val sajuService: SajuService,
) {
    private val log = LoggerFactory.getLogger(AIProfileController::class.java)

    /**
     * LLM 프로필 생성. ADR 0047 안전바.
     *
     * **rate-limit** — `llm:profile-generate:{userId}` per-user 일 5회 (캐시 hit 가 대부분이라
     * 실제 LLM 호출은 더 적음). 클라이언트 cooldown 24h 와 별개로 백엔드 우회 차단.
     */
    @PostMapping("/generate")
    fun generate(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: GenerateRequest,
    ): ResponseEntity<GenerateResponse> {
        val userId = authUser.userId.value.toString()

        // 백엔드 rate limit — 같은 device 우회 시도 차단 (audit 로깅 포함)
        try {
            rateLimiter.enforce(
                key = "llm:profile-generate:$userId",
                limit = 5,
                window = Duration.ofDays(1),
                message = "프로필 분석 요청이 너무 잦습니다. 잠시 후 다시 시도해주세요",
            )
        } catch (e: RuntimeException) {
            openAIService.logRateLimited(userId)
            throw e
        }

        // ADR 0056 — MBTI + 사주(오행) 보강. 생년월일은 서버 User 값 우선(권위), 없으면 요청값.
        val mbti = request.mbti?.trim()?.uppercase()?.takeIf { it.length == 4 && it.all { c -> c.isLetter() } }
        val birthDate = userRepository.findById(authUser.userId)?.publicInfo?.birthDate
            ?: request.birthDate?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
        val sajuSummary = birthDate?.let {
            runCatching { sajuService.analyze(it).summary }
                .onFailure { e -> log.warn("사주 계산 실패 — 색 분석에서 생략. {}", e.message) }
                .getOrNull()
        }

        val result = openAIService.generateProfile(
            ProfileGenerationRequest(
                introMethod = when (request.introMethod) {
                    "MANUAL" -> IntroMethod.MANUAL
                    "TASTE_STACK" -> IntroMethod.DATING_STYLE
                    else -> IntroMethod.INTERVIEW
                },
                interviewAnswers = request.interviewAnswers,
                manualAnswers = request.manualAnswers,
                datingStyle = request.datingStyle,
                idealType = request.idealType?.let {
                    IdealTypeContext(
                        personalities = it.personalities,
                        datePreferences = it.datePreferences,
                        importantValues = it.importantValues,
                        dealBreakers = it.dealBreakers,
                    )
                },
                mbti = mbti,
                sajuSummary = sajuSummary,
            ),
            userId = userId,
        )
        return ResponseEntity.ok(result.toResponse())
    }
}

data class GenerateRequest(
    val introMethod: String = "INTERVIEW",
    val interviewAnswers: Map<String, String> = emptyMap(),
    val manualAnswers: Map<String, String> = emptyMap(),
    val datingStyle: Map<String, String> = emptyMap(),
    val idealType: IdealTypeRequest? = null,
    /** 온보딩 draft 의 MBTI (예: "ENFP"). 서버 미저장 시점이라 클라가 전달 (ADR 0056) */
    val mbti: String? = null,
    /** 온보딩 draft 의 생년월일(yyyy-MM-dd). 단, 서버 User.birthDate 가 있으면 그쪽 우선 */
    val birthDate: String? = null,
)

data class IdealTypeRequest(
    val personalities: List<String> = emptyList(),
    val datePreferences: List<String> = emptyList(),
    val importantValues: List<String> = emptyList(),
    val dealBreakers: List<String> = emptyList(),
)

data class GenerateResponse(
    val colorType: String,
    val colorName: String,
    val colorHex: String,
    val colorDescription: String,
    /** 하위호환·영속화용 — 섹션을 합친 단일 텍스트 */
    val generatedIntroduction: String,
    /** 소주제별로 나뉜 소개글 — 상대가 자연스러운 흐름으로 읽도록 (ADR 0059) */
    val introductionSections: List<IntroSectionDto> = emptyList(),
    /** 왜 이 색깔로 분석했는지 — 사용자 답변에서 근거를 인용한 짧은 단락 */
    val colorReasoning: String = "",
    /** 성격·연애 성향 요약 */
    val personalitySummary: String = "",
    /** 어울리는 이상형 유추 */
    val idealTypeInsight: String = "",
    /** 색깔 분석에 사용된 핵심 키워드 (UI 칩) */
    val colorKeywords: List<String> = emptyList(),
    /** 강점 태그 3~5개 — 인사이트 카드 노출 (ADR 0037) */
    val strengths: List<String> = emptyList(),
    /** ADR 0056 — 색 판별 근거 (답변/MBTI/사주). 빈 문자열이면 미사용 */
    val evidenceFromAnswers: String = "",
    val evidenceFromMbti: String = "",
    val evidenceFromSaju: String = "",
)

data class IntroSectionDto(
    val heading: String,
    val body: String,
)

private fun ProfileGenerationResult.toResponse() = GenerateResponse(
    colorType = colorType,
    colorName = colorName,
    colorHex = colorHex,
    colorDescription = colorDescription,
    generatedIntroduction = generatedIntroduction,
    introductionSections = introductionSections.map { IntroSectionDto(heading = it.heading, body = it.body) },
    colorReasoning = colorReasoning,
    personalitySummary = personalitySummary,
    idealTypeInsight = idealTypeInsight,
    colorKeywords = colorKeywords,
    strengths = strengths,
    evidenceFromAnswers = evidenceFromAnswers,
    evidenceFromMbti = evidenceFromMbti,
    evidenceFromSaju = evidenceFromSaju,
)
