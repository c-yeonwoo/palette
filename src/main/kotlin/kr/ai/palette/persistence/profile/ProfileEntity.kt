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

    @Column(name = "mbti", length = 4, nullable = false)
    @Enumerated(EnumType.STRING)
    var mbti: MBTIEntity,

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
    @Column(name = "interests", columnDefinition = "TEXT")
    var interests: String?, // Comma-separated list

    // Introduction - Interview Answers
    @Column(name = "introduction_hobby", columnDefinition = "TEXT")
    var introductionHobby: String?,

    @Column(name = "introduction_charm", columnDefinition = "TEXT")
    var introductionCharm: String?,

    @Column(name = "introduction_passion", columnDefinition = "TEXT")
    var introductionPassion: String?,

    @Column(name = "introduction_happiness", columnDefinition = "TEXT")
    var introductionHappiness: String?,

    @Column(name = "introduction_motto", columnDefinition = "TEXT")
    var introductionMotto: String?,

    // IdealType
    @Column(name = "ideal_date_preferences", columnDefinition = "TEXT")
    var idealDatePreferences: String?, // Comma-separated list: ACTIVE, INDOOR, CULTURE, NATURE

    @Column(name = "ideal_important_values", columnDefinition = "TEXT")
    var idealImportantValues: String?, // Comma-separated list: max 3

    @Column(name = "ideal_personalities", columnDefinition = "TEXT")
    var idealPersonalities: String?, // Comma-separated list: max 5

    @Column(name = "ideal_appearance_styles", columnDefinition = "TEXT")
    var idealAppearanceStyles: String?, // Comma-separated enum values (Male/Female based on user gender)

    @Column(name = "ideal_deal_breakers", columnDefinition = "TEXT")
    var idealDealBreakers: String?, // Comma-separated list: max 3

    // PersonalityTests - stored as JSON
    @Column(name = "personality_tests", columnDefinition = "TEXT")
    var personalityTests: String?, // JSON array of personality test results

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

enum class MBTIEntity {
    ISTJ, ISFJ, INFJ, INTJ,
    ISTP, ISFP, INFP, INTP,
    ESTP, ESFP, ENFP, ENTP,
    ESTJ, ESFJ, ENFJ, ENTJ
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

// 남자 외모 스타일 (여자 유저가 선택)
enum class MaleAppearanceStyleEntity {
    PUPPY,           // 강아지상
    CAT,             // 고양이상
    STUDENT_COUNCIL, // 전교회장상
    ATHLETIC,        // 체대상
    NERD,            // 너드상
    TOFU,            // 두부상
    ARAB,            // 아랍상
    DINOSAUR         // 공룡상
}

// 여자 외모 스타일 (남자 유저가 선택)
enum class FemaleAppearanceStyleEntity {
    PUPPY,           // 강아지상
    CAT,             // 고양이상
    RABBIT,          // 토끼상
    FOX,             // 여우상
    DEER,            // 사슴상
    TOFU,            // 두부상
    SOFT_TOFU,       // 순두부상
    ARAB,            // 아랍상
    BOSS,            // 일진상
    MOTHER_IN_LAW_APPROVED // 상견례입구컷상
}
