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

    // BasicInfo
    @Column(name = "height")
    var height: Int?,

    @Column(name = "body_type", length = 20)
    @Enumerated(EnumType.STRING)
    var bodyType: BodyTypeEntity?,

    // CareerInfo
    @Column(name = "career_category", length = 30)
    @Enumerated(EnumType.STRING)
    var careerCategory: CareerCategoryEntity?,

    @Column(name = "company", length = 100)
    var company: String?,

    @Column(name = "position", length = 100)
    var position: String?,

    // EducationInfo
    @Column(name = "education_level", length = 20)
    @Enumerated(EnumType.STRING)
    var educationLevel: EducationLevelEntity?,

    @Column(name = "school", length = 100)
    var school: String?,

    @Column(name = "major", length = 100)
    var major: String?,

    // LocationInfo
    @Column(name = "sido", length = 50)
    var sido: String?,

    @Column(name = "sigungu", length = 50)
    var sigungu: String?,

    @Column(name = "hometown_sido", length = 50)
    var hometownSido: String?,

    @Column(name = "hometown_sigungu", length = 50)
    var hometownSigungu: String?,

    // LifestyleInfo
    @Column(name = "smoking", length = 20)
    @Enumerated(EnumType.STRING)
    var smoking: FrequencyEntity?,

    @Column(name = "drinking", length = 20)
    @Enumerated(EnumType.STRING)
    var drinking: FrequencyEntity?,

    @Column(name = "religion", length = 20)
    @Enumerated(EnumType.STRING)
    var religion: ReligionEntity?,

    // Introduction
    @Column(name = "introduction_text", columnDefinition = "TEXT")
    var introductionText: String?,

    @Column(name = "interests", columnDefinition = "TEXT")
    var interests: String?, // Comma-separated list

    // IdealType
    @Column(name = "ideal_age_min")
    var idealAgeMin: Int?,

    @Column(name = "ideal_age_max")
    var idealAgeMax: Int?,

    @Column(name = "ideal_height_min")
    var idealHeightMin: Int?,

    @Column(name = "ideal_height_max")
    var idealHeightMax: Int?,

    @Column(name = "ideal_body_types", columnDefinition = "TEXT")
    var idealBodyTypes: String?, // Comma-separated list

    @Column(name = "ideal_personalities", columnDefinition = "TEXT")
    var idealPersonalities: String?, // Comma-separated list

    @Column(name = "ideal_date_style", length = 30)
    @Enumerated(EnumType.STRING)
    var idealDateStyle: DateStyleEntity?,

    @Column(name = "ideal_purpose", length = 30)
    @Enumerated(EnumType.STRING)
    var idealPurpose: DatingPurposeEntity?,

    @Column(name = "ideal_deal_breakers", columnDefinition = "TEXT")
    var idealDealBreakers: String?,

    // ProfileMetadata
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant,

    @Column(name = "last_accessed_at", nullable = false)
    var lastAccessedAt: Instant,

    @Column(name = "deleted_at")
    var deletedAt: Instant?,

    // ProfileMetrics
    @Column(name = "completion_rate", nullable = false)
    var completionRate: Int,

    @Column(name = "trust_score", nullable = false)
    var trustScore: Int,

    @Column(name = "view_count", nullable = false)
    var viewCount: Int,

    // ProfileSettings
    @Column(name = "is_accepting_matches", nullable = false)
    var isAcceptingMatches: Boolean,

    @Column(name = "hidden_at")
    var hiddenAt: Instant?
)

// Enums for ProfileEntity
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
