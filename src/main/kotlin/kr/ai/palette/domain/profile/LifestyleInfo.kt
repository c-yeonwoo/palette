package kr.ai.palette.domain.profile

// ADR 0057 — smoking/drinking/religion 은 어드민 관리 옵션 코드 문자열
// (FieldOption set "smoking"/"drinking"/"religion"). 기존 enum 값과 호환.
data class LifestyleInfo(
    val smoking: String?,
    val drinking: String?,
    val religion: String?
)

enum class Frequency {
    NEVER,
    SOMETIMES,
    OFTEN
}

enum class Religion {
    NONE,
    CHRISTIANITY,
    CATHOLICISM,
    BUDDHISM,
    OTHER
}
