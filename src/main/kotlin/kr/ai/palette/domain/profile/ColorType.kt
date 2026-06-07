package kr.ai.palette.domain.profile

data class ColorType(
    val type: ColorTypeEnum?,
    val name: String?,
    val hex: String?,
    val description: String?,
    /** AI 분석 — 이 색을 고른 근거 (답변 인용) */
    val reasoning: String? = null,
    /** AI 분석 — 성격·연애 성향 요약 */
    val personalitySummary: String? = null,
    /** AI 분석 — 어울리는 이상형 유추 */
    val idealTypeInsight: String? = null,
    /** AI 분석 — 강점 태그 3~5개 ("감수성 깊은 사색가" 등) — 인사이트 카드 노출 (ADR 0037) */
    val strengths: List<String>? = null,
)

enum class ColorTypeEnum {
    WARM_ORANGE,
    CALM_BLUE,
    VIBRANT_RED,
    SOFT_PINK,
    FRESH_GREEN,
    ELEGANT_PURPLE,
    BRIGHT_YELLOW,
    SOPHISTICATED_GRAY
}
