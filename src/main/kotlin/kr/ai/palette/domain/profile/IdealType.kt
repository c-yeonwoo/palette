package kr.ai.palette.domain.profile

data class IdealType(
    val ageRange: AgeRange?,
    val heightRange: HeightRange?,
    val bodyTypes: List<BodyType>,
    val personalities: List<String>,
    val dateStyle: DateStyle?,
    val purpose: DatingPurpose?,
    val dealBreakers: String?
)

data class AgeRange(
    val min: Int,
    val max: Int
) {
    init {
        require(min in 19..65) { "Minimum age must be between 19 and 65" }
        require(max in 19..65) { "Maximum age must be between 19 and 65" }
        require(min <= max) { "Minimum age must be less than or equal to maximum age" }
    }
}

data class HeightRange(
    val min: Int,
    val max: Int
) {
    init {
        require(min in 140..220) { "Minimum height must be between 140 and 220" }
        require(max in 140..220) { "Maximum height must be between 140 and 220" }
        require(min <= max) { "Minimum height must be less than or equal to maximum height" }
    }
}

enum class DateStyle {
    ACTIVE,
    INDOOR,
    CULTURAL,
    BALANCED
}

enum class DatingPurpose {
    SERIOUS_DATING,
    MARRIAGE_PREMISE,
    FRIENDS_FIRST
}
