package kr.ai.palette.domain.profile

data class BasicInfo(
    val height: Int?,
    val bodyType: BodyType?,
    val mbti: MBTI? // MBTI 유형 (선택)
)

enum class BodyType {
    SLIM,
    AVERAGE,
    ATHLETIC,
    MUSCULAR,
    CURVY
}
