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
    val datingStyle: Map<String, String> = emptyMap(), // questionKey -> optionKey
    val idealType: IdealTypeContext? = null,
)

enum class IntroMethod { INTERVIEW, MANUAL, DATING_STYLE }

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
    /** 왜 이 색깔로 분석했는지 — 사용자 답변에서 근거를 인용한 짧은 단락 */
    val colorReasoning: String = "",
    /** 답변에서 드러난 성격·연애 성향 요약 */
    val personalitySummary: String = "",
    /** 답변/이상형 정보로 유추한, 어울리는 상대상(원하는 이상형) */
    val idealTypeInsight: String = "",
    /** 답변에서 핵심으로 본 키워드들 (UI 칩으로 표시 가능) */
    val colorKeywords: List<String> = emptyList(),
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

    /** 로컬/개발에서 OpenAI 키가 없거나 placeholder 인 경우 stub 으로 빠짐 (회원가입 골든패스 진행용) */
    private val isStubMode: Boolean
        get() = apiKey.isBlank() || apiKey.startsWith("dummy") || apiKey.contains("placeholder")

    fun generateProfile(request: ProfileGenerationRequest): ProfileGenerationResult {
        if (isStubMode) return stubResult(request)
        val userPrompt = buildUserPrompt(request)

        val body = mapOf(
            "model" to model,
            "messages" to listOf(
                mapOf("role" to "system", "content" to SYSTEM_PROMPT),
                mapOf("role" to "user", "content" to userPrompt),
            ),
            "response_format" to mapOf("type" to "json_object"),
            "max_tokens" to 2000,  // 500자+ 소개글 + 근거/성향/이상형 3분석 + 키워드 수용
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
            IntroMethod.DATING_STYLE -> {
                appendLine("【연애 스타일】")
                request.datingStyle.forEach { (questionKey, optionKey) ->
                    val question = DATING_STYLE_LABELS[questionKey]
                    val option = question?.options?.get(optionKey)
                    if (question != null && option != null) {
                        appendLine("- ${question.label}: $option")
                    }
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
        val map: Map<String, Any?> = objectMapper.readValue(content)
        val colorType = (map["colorType"] as? String)?.trim() ?: "SOPHISTICATED_GRAY"
        val colorInfo = COLOR_TYPE_INFO[colorType] ?: COLOR_TYPE_INFO.values.last()
        @Suppress("UNCHECKED_CAST")
        val keywords = (map["colorKeywords"] as? List<String>)?.filter { it.isNotBlank() } ?: emptyList()
        return ProfileGenerationResult(
            colorType = colorType,
            colorName = colorInfo.name,
            colorHex = colorInfo.hex,
            colorDescription = colorInfo.description,
            generatedIntroduction = (map["introduction"] as? String)?.trim() ?: "",
            colorReasoning = (map["colorReasoning"] as? String)?.trim().orEmpty(),
            personalitySummary = (map["personalitySummary"] as? String)?.trim().orEmpty(),
            idealTypeInsight = (map["idealTypeInsight"] as? String)?.trim().orEmpty(),
            colorKeywords = keywords,
        )
    }

    /** OpenAI 키가 dummy/placeholder 일 때 사용 — 골든패스 통과용 stub.
     *  실제 AI는 아니지만, 답변 내용을 가능한 한 살려서 비슷한 형태로 만들어 줌. */
    private fun stubResult(request: ProfileGenerationRequest): ProfileGenerationResult {
        val answers = (request.interviewAnswers + request.manualAnswers)
            .filterValues { it.isNotBlank() }
        val color = COLOR_TYPE_INFO["WARM_ORANGE"]!!

        // 답변 길이 기준 가장 풍부한 3개를 골라 근거에 인용
        val cited = answers.entries
            .sortedByDescending { it.value.length }
            .take(3)
        val keywords = cited.map { (_, v) ->
            v.split(",", "·", ".", " ", "\n").filter { it.length in 2..8 }.take(1).firstOrNull().orEmpty()
        }.filter { it.isNotBlank() }.distinct().take(5)

        val reasoning = if (cited.isNotEmpty()) {
            val first = cited.first().value.take(40)
            "\"$first\" 라고 답하신 부분에서 사람과 일상을 가까이 두는 따뜻한 결이 느껴졌어요. " +
                "전반적으로 활발하면서도 다정한 톤이 일관되게 보여서 따뜻한 오렌지로 분석했습니다."
        } else {
            "충분한 답변이 모이면 더 정확하게 분석해 드릴게요. 지금은 가장 무난한 따뜻한 오렌지로 임시 분석했어요."
        }

        // 답변을 단락으로 자연스럽게 풀어쓴 stub 소개글 (실서비스에선 OpenAI가 대체)
        val paragraphs = mutableListOf<String>()
        paragraphs += "안녕하세요. 좋은 사람을 만나고 싶어서 이렇게 프로필을 정성껏 채워 봅니다. 화려한 표현보다는 평소의 저를 솔직히 보여드리고 싶어요."
        cited.getOrNull(0)?.let {
            paragraphs += "평소에는 ${it.value} 같은 시간을 좋아해요. 사소한 순간을 소중히 여기는 편이고, 그런 일상 속에서 진짜 저를 발견하곤 해요."
        }
        cited.getOrNull(1)?.let {
            paragraphs += "스스로 매력이라고 생각하는 부분은 — ${it.value} 정도가 있을 것 같아요. 거창한 건 아니지만 곁에 있는 사람을 편하게 만들어주는 데 진심을 다하려고 해요."
        }
        cited.getOrNull(2)?.let {
            paragraphs += "요즘에는 ${it.value} 에 마음이 가 있어요. 이런 이야기를 같이 나눌 수 있는 사람과 만나면 시간이 빠르게 흐를 것 같아요."
        }
        paragraphs += "급하게 결론을 내기보다 천천히 알아가며 마음의 결을 맞춰가고 싶어요. 같이 평범한 일상을 특별하게 만들 수 있는 분이라면 더없이 좋겠습니다."

        val intro = paragraphs.joinToString("\n\n").let {
            // 500자 미달이면 한 번 더 보강
            if (it.length < 500) "$it\n\n오늘 하루도 마음에 드는 무언가를 발견하셨길 바라요. 짧게라도 인사 나눌 수 있다면 기쁠 것 같습니다." else it
        }

        val ideal = request.idealType
        val personalitySummary = if (cited.isNotEmpty()) {
            "답변 전반에서 사람과 일상을 가까이 두는 따뜻하고 활발한 결이 보여요. " +
                "관계에선 솔직하게 마음을 표현하면서도 상대를 편하게 배려하는 타입으로 읽혀요."
        } else {
            "답변이 더 모이면 성향을 정확히 요약해 드릴게요."
        }
        val idealTypeInsight = buildString {
            append("대화가 편하고 일상의 작은 순간을 함께 즐길 수 있는 분과 잘 어울려요.")
            ideal?.personalities?.takeIf { it.isNotEmpty() }?.let {
                append(" 특히 ${it.joinToString(", ")} 같은 성향의 상대에게 끌리실 것 같아요.")
            }
        }

        return ProfileGenerationResult(
            colorType = "WARM_ORANGE",
            colorName = color.name,
            colorHex = color.hex,
            colorDescription = color.description,
            generatedIntroduction = intro,
            colorReasoning = reasoning,
            personalitySummary = personalitySummary,
            idealTypeInsight = idealTypeInsight,
            colorKeywords = keywords,
        )
    }

    companion object {
        private const val SYSTEM_PROMPT = """
당신은 데이팅 앱 "팔레트"의 프로필 작성 AI입니다.
사용자의 자기소개와 이상형 정보를 분석하여 아래 항목을 반환합니다.

[반환 형식] 반드시 아래 JSON 형식만 출력하세요. 다른 텍스트 없이:
{
  "colorType": "<색깔 타입 (영문 enum)>",
  "colorReasoning": "<왜 이 색깔로 분석했는지 — 사용자 답변에서 근거를 직접 인용하며 설명. 2-3문장, 150자 내외>",
  "personalitySummary": "<이 사람의 성격·연애 성향 요약 — 답변에서 드러난 특징. 2-3문장, 150자 내외>",
  "idealTypeInsight": "<어떤 이상형을 원하는지 유추 — 답변과 이상형 정보를 근거로 어울리는 상대상을 추론. 2-3문장, 150자 내외>",
  "colorKeywords": ["<핵심 키워드 3-5개>"],
  "introduction": "<자기소개글 (500자 이상)>"
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

[colorReasoning 작성 기준 — 이 색을 고른 "근거"]
- 사용자가 직접 쓴 표현을 따옴표로 인용해서 근거 제시 (예: "주말엔 친구들과 맛집을 다닌다" 라고 답하신 부분에서…)
- 어떤 답변 속 어떤 단어가 이 색깔의 어떤 특성과 닿아있는지 명확히
- "당신은 ~~한 사람이에요" 단정 금지, "~한 모습이 보여요" "~가 드러나요" 처럼 추론 형식
- 150자 내외 2-3문장

[personalitySummary 작성 기준 — "성향 요약"]
- 답변에서 읽히는 성격·연애 성향을 압축 요약 (예: 다가가는 방식, 대화 스타일, 관계에서 중요시하는 것)
- 색깔 특성과 일관되게, 답변 근거에 기반 (지어내지 말 것)
- "~한 편으로 보여요" 추론 형식, 150자 내외 2-3문장

[idealTypeInsight 작성 기준 — "원하는 이상형 유추"]
- 사용자의 답변 + 이상형 정보(선호 성격/데이트/가치/절대 안 되는 것)를 근거로 "어떤 상대와 잘 맞을지" 추론
- 이상형 정보가 있으면 그것을 우선 반영하고, 없으면 자기소개 답변에서 결을 추론
- 외모 조건보다 성향·관계 방식 위주로, 단정이 아닌 "~한 분과 잘 어울릴 것 같아요" 형식
- 150자 내외 2-3문장

[colorKeywords 작성 기준]
- 사용자 답변에서 뽑은 핵심 단어/구절 3-5개 (예: "주말 카페 책 읽기", "공감 능력", "차분한 대화")
- 추상 명사("긍정", "활발") 보다 구체 표현 선호

[introduction 작성 기준]
- 1인칭 시점, **공백 포함 500자 이상 700자 이하**
- 사용자의 답변 내용을 자연스럽게 연결하고 살을 붙여서 풍부하게 (단순 답변 나열 금지)
- 3-4개 단락으로 구성: 일상/취향 → 매력/가치관 → 만나고 싶은 사람 → 가볍게 한 마디
- 카페에서 처음 만난 사람에게 천천히 이야기하는 듯한 말투, 자연스러운 연결어 사용
- 구체적인 장면이나 일상 묘사가 들어가도록
- 겸손하되 자신감 있게, 진정성이 느껴지도록
- 이모지·과한 감탄사·"함께라면 즐거울 것 같아요" 같은 클리셰 금지
"""

        internal data class ColorInfo(val name: String, val hex: String, val description: String)

        internal val COLOR_TYPE_INFO = mapOf(
            "WARM_ORANGE" to ColorInfo("따뜻한 오렌지", "#F97316", "활발하고 다정한 당신은 주변을 밝게 만드는 에너지가 있어요"),
            "CALM_BLUE" to ColorInfo("차분한 블루", "#3B82F6", "신중하고 깊이있는 당신은 믿음직한 존재감을 가지고 있어요"),
            "VIBRANT_RED" to ColorInfo("생동감있는 레드", "#EF4444", "열정적이고 적극적인 당신은 삶을 가득 채우는 에너지가 넘쳐요"),
            "SOFT_PINK" to ColorInfo("부드러운 핑크", "#F9A8D4", "섬세하고 낭만적인 당신은 감성이 풍부하고 따뜻한 마음을 가졌어요"),
            "FRESH_GREEN" to ColorInfo("신선한 그린", "#22C55E", "자연스럽고 편안한 당신은 함께 있으면 마음이 편안해지는 사람이에요"),
            "ELEGANT_PURPLE" to ColorInfo("고급스러운 퍼플", "#A855F7", "지적이고 감각적인 당신은 독특한 매력과 깊은 내면을 가지고 있어요"),
            "BRIGHT_YELLOW" to ColorInfo("밝은 옐로우", "#EAB308", "긍정적이고 유쾌한 당신은 어디서든 분위기를 밝게 만드는 존재예요"),
            "SOPHISTICATED_GRAY" to ColorInfo("세련된 그레이", "#6B7280", "이성적이고 프로페셔널한 당신은 어떤 상황에도 신뢰를 주는 사람이에요"),
        )

        internal data class DatingStyleQuestion(val label: String, val options: Map<String, String>)

        internal val DATING_STYLE_LABELS = mapOf(
            "MEET_FREQUENCY"    to DatingStyleQuestion("만남 빈도", mapOf(
                "WEEKLY_1_2"         to "주 1~2회",
                "WEEKEND_TOGETHER"   to "주말은 같이 보내요",
                "WHENEVER_POSSIBLE"  to "시간 될 때마다"
            )),
            "CONTACT_STYLE"     to DatingStyleQuestion("연락 스타일", mapOf(
                "FREQUENT"       to "자주 연락해요",
                "DAILY_FEW"      to "하루 몇 번이면 충분",
                "WHENEVER"       to "생각날 때 연락"
            )),
            "DATE_STYLE"        to DatingStyleQuestion("데이트 스타일", mapOf(
                "OUTDOOR"  to "나들이·액티비티",
                "INDOOR"   to "집·카페 인도어",
                "MIX"      to "둘 다 좋아요"
            )),
            "DRINKING_DATE"     to DatingStyleQuestion("음주 스타일", mapOf(
                "ENJOY"      to "술자리 즐겨요",
                "SOMETIMES"  to "가끔 한 잔",
                "NO_NEED"    to "없어도 충분해요"
            )),
            "OPPOSITE_FRIENDS"  to DatingStyleQuestion("이성 친구", mapOf(
                "FREE"              to "자유롭게 OK",
                "SOME_BOUNDARY"     to "어느 정도 선은 있어요",
                "UNCOMFORTABLE"     to "적극적 연락은 불편해요"
            )),
            "LEAD_STYLE"        to DatingStyleQuestion("리드 스타일", mapOf(
                "LEAD"      to "내가 리드하는 편",
                "FOLLOW"    to "따라가는 편",
                "ALTERNATE" to "번갈아가며"
            )),
            "CONFLICT_STYLE"    to DatingStyleQuestion("갈등 해결", mapOf(
                "TALK_NOW"    to "바로 대화해요",
                "COOL_DOWN"   to "식히고 나서 얘기해요",
                "LET_GO"      to "웬만하면 넘겨요"
            )),
            "AFFECTION_STYLE"   to DatingStyleQuestion("애정 표현", mapOf(
                "PHYSICAL"  to "스킨십으로",
                "WORDS"     to "말·문자로",
                "ACTIONS"   to "챙겨주는 것으로"
            )),
            "MARRIAGE_PLAN"     to DatingStyleQuestion("결혼 계획", mapOf(
                "SERIOUS_FAST"   to "빠르게 진지하게",
                "SLOW_NATURAL"   to "천천히 자연스럽게",
                "NOT_YET"        to "아직 생각 중"
            )),
            "SNS_PUBLIC"        to DatingStyleQuestion("SNS 공개", mapOf(
                "LOVE_IT"        to "커플 인증 좋아요",
                "PRIVATE"        to "우리끼리만",
                "FOLLOW_PARTNER" to "상대 따라갈게요"
            )),
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
