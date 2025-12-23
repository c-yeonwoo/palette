package kr.ai.palette.domain.profile

data class BasicInfo(
    val height: Int?,
    val bodyType: BodyType?
)

enum class BodyType {
    SLIM,
    AVERAGE,
    ATHLETIC,
    MUSCULAR,
    CURVY
}
