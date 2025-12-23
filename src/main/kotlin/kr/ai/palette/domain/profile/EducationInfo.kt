package kr.ai.palette.domain.profile

data class EducationInfo(
    val level: EducationLevel?,
    val school: String?,
    val major: String?
)

enum class EducationLevel {
    HIGH_SCHOOL,
    ASSOCIATE,
    BACHELOR,
    MASTER,
    DOCTORATE
}
