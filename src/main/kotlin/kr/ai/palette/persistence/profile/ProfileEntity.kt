package kr.ai.palette.persistence.profile

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "profiles")
class ProfileEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    @Column(name = "user_id", nullable = false, unique = true, columnDefinition = "BINARY(16)")
    var userId: UUID,

    // Basic Info
    @Column(name = "height")
    var height: Int?,

    @Column(name = "body_type", length = 20)
    @Enumerated(EnumType.STRING)
    var bodyType: BodyTypeEntity?,

    // Career Info
    @Column(name = "career_category", length = 50)
    @Enumerated(EnumType.STRING)
    var careerCategory: CareerCategoryEntity?,

    @Column(name = "career_company", length = 100)
    var careerCompany: String?,

    @Column(name = "career_position", length = 50)
    var careerPosition: String?,

    // Education Info
    @Column(name = "education_level", length = 20)
    @Enumerated(EnumType.STRING)
    var educationLevel: EducationLevelEntity?,

    @Column(name = "education_school", length = 100)
    var educationSchool: String?,

    @Column(name = "education_major", length = 50)
    var educationMajor: String?,

    // Location Info
    @Column(name = "location_sido", length = 20)
    var locationSido: String?,

    @Column(name = "location_sigungu", length = 30)
    var locationSigungu: String?,

    @Column(name = "hometown_sido", length = 20)
    var hometownSido: String?,

    @Column(name = "hometown_sigungu", length = 30)
    var hometownSigungu: String?,

    // Introduction
    @Column(name = "introduction", columnDefinition = "TEXT")
    var introduction: String?,

    @Column(name = "interests", columnDefinition = "JSON")
    var interests: String?, // JSON array as String

    // Lifestyle Info
    @Column(name = "smoking", length = 20)
    @Enumerated(EnumType.STRING)
    var smoking: FrequencyEntity?,

    @Column(name = "drinking", length = 20)
    @Enumerated(EnumType.STRING)
    var drinking: FrequencyEntity?,

    @Column(name = "religion", length = 20)
    @Enumerated(EnumType.STRING)
    var religion: ReligionEntity?,

    // Ideal Type
    @Column(name = "ideal_age_min")
    var idealAgeMin: Int?,

    @Column(name = "ideal_age_max")
    var idealAgeMax: Int?,

    @Column(name = "ideal_height_min")
    var idealHeightMin: Int?,

    @Column(name = "ideal_height_max")
    var idealHeightMax: Int?,

    @Column(name = "ideal_body_types", columnDefinition = "JSON")
    var idealBodyTypes: String?, // JSON array as String

    @Column(name = "ideal_personalities", columnDefinition = "JSON")
    var idealPersonalities: String?, // JSON array as String

    @Column(name = "ideal_date_style", length = 50)
    @Enumerated(EnumType.STRING)
    var idealDateStyle: DateStyleEntity?,

    @Column(name = "ideal_purpose", length = 50)
    @Enumerated(EnumType.STRING)
    var idealPurpose: DatingPurposeEntity?,

    @Column(name = "ideal_deal_breakers", columnDefinition = "TEXT")
    var idealDealBreakers: String?,

    // Color Type
    @Column(name = "color_type", length = 50)
    @Enumerated(EnumType.STRING)
    var colorType: ColorTypeEntity?,

    @Column(name = "color_name", length = 50)
    var colorName: String?,

    @Column(name = "color_hex", length = 7)
    var colorHex: String?,

    @Column(name = "color_description", columnDefinition = "TEXT")
    var colorDescription: String?,

    // Metrics
    @Column(name = "completion_rate", nullable = false)
    var completionRate: Int = 0,

    @Column(name = "trust_score", nullable = false)
    var trustScore: Int = 0,

    @Column(name = "view_count", nullable = false)
    var viewCount: Int = 0,

    // Settings
    @Column(name = "is_accepting_matches", nullable = false)
    var isAcceptingMatches: Boolean = true,

    @Column(name = "hidden_at")
    var hiddenAt: Instant?,

    // Metadata
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Column(name = "last_accessed_at", nullable = false)
    var lastAccessedAt: Instant = Instant.now(),

    @Column(name = "deleted_at")
    var deletedAt: Instant? = null
) {
    protected constructor() : this(
        id = UUID.randomUUID(),
        userId = UUID.randomUUID(),
        height = null,
        bodyType = null,
        careerCategory = null,
        careerCompany = null,
        careerPosition = null,
        educationLevel = null,
        educationSchool = null,
        educationMajor = null,
        locationSido = null,
        locationSigungu = null,
        hometownSido = null,
        hometownSigungu = null,
        introduction = null,
        interests = null,
        smoking = null,
        drinking = null,
        religion = null,
        idealAgeMin = null,
        idealAgeMax = null,
        idealHeightMin = null,
        idealHeightMax = null,
        idealBodyTypes = null,
        idealPersonalities = null,
        idealDateStyle = null,
        idealPurpose = null,
        idealDealBreakers = null,
        colorType = null,
        colorName = null,
        colorHex = null,
        colorDescription = null,
        hiddenAt = null
    )

    @PreUpdate
    fun preUpdate() {
        updatedAt = Instant.now()
    }
}

enum class BodyTypeEntity {
    SLIM, AVERAGE, ATHLETIC, MUSCULAR, CURVY
}

enum class CareerCategoryEntity {
    IT_DEVELOPMENT, FINANCE, EDUCATION, MEDICAL, MEDIA,
    SERVICE, MANUFACTURING, PUBLIC_OFFICIAL, PROFESSIONAL, OTHER
}

enum class EducationLevelEntity {
    HIGH_SCHOOL, ASSOCIATE, BACHELOR, MASTER, DOCTORATE
}

enum class FrequencyEntity {
    NEVER, SOMETIMES, OFTEN
}

enum class ReligionEntity {
    NONE, CHRISTIANITY, CATHOLICISM, BUDDHISM, OTHER
}

enum class DateStyleEntity {
    ACTIVE, INDOOR, CULTURAL, BALANCED
}

enum class DatingPurposeEntity {
    SERIOUS_DATING, MARRIAGE_PREMISE, FRIENDS_FIRST
}

enum class ColorTypeEntity {
    WARM_ORANGE, CALM_BLUE, VIBRANT_RED, SOFT_PINK,
    FRESH_GREEN, ELEGANT_PURPLE, BRIGHT_YELLOW, SOPHISTICATED_GRAY
}
