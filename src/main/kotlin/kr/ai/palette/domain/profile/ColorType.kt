package kr.ai.palette.domain.profile

data class ColorType(
    val type: ColorTypeEnum?,
    val name: String?,
    val hex: String?,
    val description: String?
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
