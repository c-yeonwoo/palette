package kr.ai.palette.domain.profile

data class CareerInfo(
    val category: CareerCategory?,
    val company: String?,
    val position: String?
)

enum class CareerCategory {
    IT_DEVELOPMENT,
    FINANCE,
    EDUCATION,
    MEDICAL,
    MEDIA,
    SERVICE,
    MANUFACTURING,
    PUBLIC_OFFICIAL,
    PROFESSIONAL,
    OTHER
}
