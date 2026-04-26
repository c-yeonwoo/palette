package kr.ai.palette.infrastructure.ai

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient

data class ProfileGenerationRequest(
    val introMethod: IntroMethod,
    val interviewAnswers: Map<String, String> = emptyMap(),
    val manualAnswers: Map<String, String> = emptyMap(),
    val idealType: IdealTypeContext? = null,
)

enum class IntroMethod { INTERVIEW, MANUAL }

data class IdealTypeContext(
    val personalities: List<String> = emptyList(),
    val datePreferences: List<String> = emptyList(),
    val importantValues: List<String> = emptyList(),
    val dealBreakers: List<String> = emptyList(),
)

data class ProfileGenerationResult(
    val colorType: String,
    val colorName: String,
    val colorHex: String,
    val colorDescription: String,
    val generatedIntroduction: String,
)

@Service
class OpenAIService(
    @Value("\${openai.api-key}")
    private val apiKey: String,
    @Value("\${openai.model:gpt-4o-mini}")
    private val model: String,
    restClientBuilder: RestClient.Builder,
    private val objectMapper: ObjectMapper,
) {

    val restClient: RestClient = restClientBuilder
        .baseUrl("https://api.openai.com")
        .defaultHeader("Authorization", "Bearer $apiKey")
        .build()

    fun generateProfile(request: ProfileGenerationRequest): ProfileGenerationResult {
        val userPrompt = buildUserPrompt(request)

        val body = mapOf(
            "model" to model,
            "messages" to listOf(
                mapOf("role" to "system", "content" to SYSTEM_PROMPT),
                mapOf("role" to "user", "content" to userPrompt),
            ),
            "response_format" to mapOf("type" to "json_object"),
            "max_tokens" to 600,
            "temperature" to 0.8,
        )

        val response = restClient.post()
            .uri("/v1/chat/completions")
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .body(Map::class.java)
            ?: throw IllegalStateException("No response from OpenAI")

        @Suppress("UNCHECKED_CAST")
        val content = (response["choices"] as List<Map<String, Any>>)
            .first()
            .let { it["message"] as Map<String, Any> }
            .let { it["content"] as String }

        return parseResult(content)
    }

    internal fun buildUserPrompt(request: ProfileGenerationRequest): String = buildString {
        when (request.introMethod) {
            IntroMethod.INTERVIEW -> {
                appendLine("【AI 인터뷰 답변】")
                request.interviewAnswers.forEach { (key, value) ->
                    val label = INTERVIEW_LABELS[key] ?: key
                    appendLine("- $label: $value")
                }
            }
            IntroMethod.MANUAL -> {
                appendLine("【직접 작성한 자기소개】")
                request.manualAnswers.forEach { (key, value) ->
                    val label = MANUAL_LABELS[key] ?: key
                    appendLine("- $label: $value")
                }
            }
        }

        request.idealType?.let { ideal ->
            appendLine()
            appendLine("【이상형 정보】")
            if (ideal.personalities.isNotEmpty()) appendLine("- 선호 성격: ${ideal.personalities.joinToString(", ")}")
            if (ideal.datePreferences.isNotEmpty()) appendLine("- 데이트 스타일: ${ideal.datePreferences.joinToString(", ")}")
            if (ideal.importantValues.isNotEmpty()) appendLine("- 중요하게 보는 것: ${ideal.importantValues.joinToString(", ")}")
            if (ideal.dealBreakers.isNotEmpty()) appendLine("- 절대 안 되는 것: ${ideal.dealBreakers.joinToString(", ")}")
        }
    }

    internal fun parseResult(content: String): ProfileGenerationResult {
        val map: Map<String, String> = objectMapper.readValue(content)
        val colorType = map["colorType"]?.trim() ?: "SOPHISTICATED_GRAY"
        val colorInfo = COLOR_TYPE_INFO[colorType] ?: COLOR_TYPE_INFO.values.last()
        return ProfileGenerationResult(
            colorType = colorType,
            colorName = colorInfo.name,
            colorHex = colorInfo.hex,
            colorDescription = colorInfo.description,
            generatedIntroduction = map["introduction"]?.trim() ?: "",
        )
    }

    companion object {
        private const val SYSTEM_PROMPT = """
당신은 데이팅 앱 "Palette"의 프로필 작성 AI입니다.
사용자의 자기소개와 이상형 정보를 분석하여 두 가지를 반환합니다.

[반환 형식] 반드시 아래 JSON 형식만 출력하세요. 다른 텍스트 없이:
{
  "colorType": "<색깔 타입>",
  "introduction": "<소개글>"
}

[colorType 선택 기준]
사용자의 성격, 라이프스타일, 가치관을 종합해서 가장 잘 맞는 색깔 하나를 고르세요:
- WARM_ORANGE: 활발하고 다정함, 사람을 좋아하고 에너지가 넘침
- CALM_BLUE: 신중하고 깊이 있음, 믿음직하고 안정적
- VIBRANT_RED: 열정적이고 적극적, 도전을 즐김
- SOFT_PINK: 섬세하고 낭만적, 감성이 풍부하고 따뜻함
- FRESH_GREEN: 자연스럽고 편안함, 함께 있으면 마음이 편해지는 타입
- ELEGANT_PURPLE: 지적이고 감각적, 독특한 매력과 깊은 내면
- BRIGHT_YELLOW: 긍정적이고 유쾌함, 어디서든 분위기를 밝게 만듦
- SOPHISTICATED_GRAY: 이성적이고 프로페셔널, 어떤 상황에도 신뢰를 줌

[introduction 작성 기준]
- 1인칭 시점
- 150-250자 (공백 포함)
- 카페에서 처음 만난 사람에게 자연스럽게 이야기하는 듯한 말투
- 구체적인 장면이나 가치관이 드러나도록 (단순 나열 금지)
- 겸손하되 자신감 있게
- 이모지 사용 금지
- "저는 ~~한 사람이에요" 나열, "함께라면 즐거울 것 같아요" 같은 클리셰 금지
"""

        internal data class ColorInfo(val name: String, val hex: String, val description: String)

        internal val COLOR_TYPE_INFO = mapOf(
            "WARM_ORANGE" to ColorInfo("따뜻한 오렌지", "#FF8C42", "활발하고 다정한 당신은 주변을 밝게 만드는 에너지가 있어요"),
            "CALM_BLUE" to ColorInfo("차분한 블루", "#4A90D9", "신중하고 깊이있는 당신은 믿음직한 존재감을 가지고 있어요"),
            "VIBRANT_RED" to ColorInfo("생동감있는 레드", "#E74C3C", "열정적이고 적극적인 당신은 삶을 가득 채우는 에너지가 넘쳐요"),
            "SOFT_PINK" to ColorInfo("부드러운 핑크", "#F48FB1", "섬세하고 낭만적인 당신은 감성이 풍부하고 따뜻한 마음을 가졌어요"),
            "FRESH_GREEN" to ColorInfo("신선한 그린", "#4CAF50", "자연스럽고 편안한 당신은 함께 있으면 마음이 편안해지는 사람이에요"),
            "ELEGANT_PURPLE" to ColorInfo("고급스러운 퍼플", "#9B59B6", "지적이고 감각적인 당신은 독특한 매력과 깊은 내면을 가지고 있어요"),
            "BRIGHT_YELLOW" to ColorInfo("밝은 옐로우", "#F1C40F", "긍정적이고 유쾌한 당신은 어디서든 분위기를 밝게 만드는 존재예요"),
            "SOPHISTICATED_GRAY" to ColorInfo("세련된 그레이", "#7F8C8D", "이성적이고 프로페셔널한 당신은 어떤 상황에도 신뢰를 주는 사람이에요"),
        )

        private val INTERVIEW_LABELS = mapOf(
            "job" to "직업",
            "weekend" to "주말 활동",
            "personality" to "성격",
            "passion" to "요즘 관심사",
            "happiness" to "행복한 순간",
            "date" to "이상적인 데이트",
            "loveValue" to "연애에서 중요한 것",
            "attractedTo" to "끌리는 타입",
            "dealBreaker" to "절대 안 되는 것",
            "motto" to "좌우명",
        )

        private val MANUAL_LABELS = mapOf(
            "hobby" to "쉬는 날 하는 것",
            "charm" to "나의 매력 포인트",
            "passion" to "요즘 빠져있는 것",
            "happiness" to "행복한 순간",
            "motto" to "인생 좌우명",
        )
    }
}
