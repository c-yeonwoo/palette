package kr.ai.palette.presentation.ai

import kr.ai.palette.infrastructure.ai.IdealTypeContext
import kr.ai.palette.infrastructure.ai.IntroMethod
import kr.ai.palette.infrastructure.ai.OpenAIService
import kr.ai.palette.infrastructure.ai.ProfileGenerationRequest
import kr.ai.palette.infrastructure.ai.ProfileGenerationResult
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/ai-profile")
class AIProfileController(
    private val openAIService: OpenAIService,
) {

    @PostMapping("/generate")
    fun generate(
        @RequestBody request: GenerateRequest,
    ): ResponseEntity<GenerateResponse> {
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
            )
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
    val generatedIntroduction: String,
    /** 왜 이 색깔로 분석했는지 — 사용자 답변에서 근거를 인용한 짧은 단락 */
    val colorReasoning: String = "",
    /** 성격·연애 성향 요약 */
    val personalitySummary: String = "",
    /** 어울리는 이상형 유추 */
    val idealTypeInsight: String = "",
    /** 색깔 분석에 사용된 핵심 키워드 (UI 칩) */
    val colorKeywords: List<String> = emptyList(),
)

private fun ProfileGenerationResult.toResponse() = GenerateResponse(
    colorType = colorType,
    colorName = colorName,
    colorHex = colorHex,
    colorDescription = colorDescription,
    generatedIntroduction = generatedIntroduction,
    colorReasoning = colorReasoning,
    personalitySummary = personalitySummary,
    idealTypeInsight = idealTypeInsight,
    colorKeywords = colorKeywords,
)
