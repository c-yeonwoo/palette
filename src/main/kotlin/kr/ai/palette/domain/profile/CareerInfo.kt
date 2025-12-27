package kr.ai.palette.domain.profile

data class CareerInfo(
    val category: CareerCategory?,
    val company: String?,
    val incomeRange: IncomeRange?
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

enum class IncomeRange {
    INCOME_RANGE_1, // 5000만원 이하
    INCOME_RANGE_2, // 5000~7500만원
    INCOME_RANGE_3, // 7500~9000만원
    INCOME_RANGE_4, // 9000~11000만원
    INCOME_RANGE_5  // 11000만원 이상
}
