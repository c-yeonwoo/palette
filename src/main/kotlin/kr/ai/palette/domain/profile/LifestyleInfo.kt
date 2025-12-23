package kr.ai.palette.domain.profile

data class LifestyleInfo(
    val smoking: Frequency?,
    val drinking: Frequency?,
    val religion: Religion?
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
