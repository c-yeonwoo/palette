package kr.ai.palette.domain.profile

data class BasicInfo(
    val height: Int?,
    // ADR 0057 — 어드민 관리 옵션 코드 문자열 (FieldOption set "bodyType"). 기존 enum 값과 호환.
    val bodyType: String?,
    val mbti: MBTI? // MBTI 유형 (선택, 고정 enum)
)

// 보존: 기본 옵션 시드/참조용 (실제 저장은 String 코드 — ADR 0057)
enum class BodyType {
    SLIM,
    AVERAGE,
    ATHLETIC,
    MUSCULAR,
    CURVY
}
