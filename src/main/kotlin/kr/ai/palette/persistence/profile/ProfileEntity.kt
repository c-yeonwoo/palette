package kr.ai.palette.persistence.profile

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "profiles",
    indexes = [
        Index(name = "idx_profiles_user_id", columnList = "user_id", unique = true),
    ]
)
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

    @Column(name = "mbti", length = 4)
    @Enumerated(EnumType.STRING)
    var mbti: MBTIEntity?,

    // CareerInfo
    @Column(name = "career_category", length = 30)
    @Enumerated(EnumType.STRING)
    var careerCategory: CareerCategoryEntity?,

    @Column(name = "company", length = 100)
    var company: String?,

    /** 직책·직급 (DA-002). 자유 텍스트 */
    @Column(name = "position", length = 80)
    var position: String? = null,

    @Column(name = "income_range", length = 20)
    @Enumerated(EnumType.STRING)
    var incomeRange: IncomeRangeEntity?,

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

    // DA-001 — 이상형 나이/키 범위. nullable: 제한 없음.
    @Column(name = "ideal_age_min")
    var idealAgeMin: Int? = null,
    @Column(name = "ideal_age_max")
    var idealAgeMax: Int? = null,
    @Column(name = "ideal_height_min")
    var idealHeightMin: Int? = null,
    @Column(name = "ideal_height_max")
    var idealHeightMax: Int? = null,

    // TasteStack - stored as JSON map
    @Column(name = "taste_stack", columnDefinition = "TEXT")
    var tasteStack: String?, // JSON: {"COFFEE": 30, "INDOOR": 70, ...}

    // BucketList - stored as JSON array
    @Column(name = "bucket_list", columnDefinition = "TEXT")
    var bucketList: String?, // JSON: ["JEJU_MONTH", "custom:새벽 드라이브", ...]

    // PersonalityTests - stored as JSON
    @Column(name = "personality_tests", columnDefinition = "TEXT")
    var personalityTests: String?, // JSON array of personality test results

    // ColorType
    @Column(name = "color_type", length = 30)
    var colorType: String?,

    // ColorType AI 분석 (ADR 0023 후속 — 근거/성향/이상형)
    @Column(name = "color_reasoning", columnDefinition = "TEXT")
    var colorReasoning: String? = null,

    @Column(name = "color_personality_summary", columnDefinition = "TEXT")
    var colorPersonalitySummary: String? = null,

    @Column(name = "color_ideal_type_insight", columnDefinition = "TEXT")
    var colorIdealTypeInsight: String? = null,

    /** AI 분석 — 강점 태그 CSV ("감수성 깊은 사색가, ...") — ADR 0037 */
    @Column(name = "color_strengths", columnDefinition = "TEXT")
    var colorStrengths: String? = null,

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
    var hiddenAt: Instant?,

    @Column(name = "details_visible_to_friends")
    var detailsVisibleToFriends: Boolean? = false,

    // LocationInfo - hometown
    @Column(name = "hometown_sido", length = 50)
    var hometownSido: String? = null,

    @Column(name = "hometown_sigungu", length = 50)
    var hometownSigungu: String? = null,

    // Introduction text (AI generated or manual)
    @Column(name = "introduction_text", columnDefinition = "TEXT")
    var introductionText: String? = null,

    // AttachmentProfile
    @Column(name = "attachment_contact_anxiety")
    var attachmentContactAnxiety: Int? = null,

    @Column(name = "attachment_intimacy_avoidance")
    var attachmentIntimacyAvoidance: Int? = null,

    @Column(name = "attachment_conflict_style")
    var attachmentConflictStyle: Int? = null,

    @Column(name = "attachment_emotion_expression")
    var attachmentEmotionExpression: Int? = null,

    @Column(name = "attachment_independence_level")
    var attachmentIndependenceLevel: Int? = null,
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
    // 초기 10 — 호환 보존
    IT_DEVELOPMENT, FINANCE, EDUCATION, MEDICAL, MEDIA,
    SERVICE, MANUFACTURING, PUBLIC_OFFICIAL, PROFESSIONAL, OTHER,
    // 확장 풀 (ADR 0036) — 도메인 enum CareerCategory 와 1:1
    DESIGN, PLANNING_STRATEGY, MARKETING, LAW, ACCOUNTING_TAX,
    RESEARCH, MILITARY_POLICE, SALES, CONSTRUCTION_REALESTATE,
    TRADE_LOGISTICS, ART_CULTURE, STARTUP_BUSINESS, FREELANCE, STUDENT
}

enum class IncomeRangeEntity {
    INCOME_RANGE_1, // 5000만원 이하
    INCOME_RANGE_2, // 5000~7500만원
    INCOME_RANGE_3, // 7500~9000만원
    INCOME_RANGE_4, // 9000~11000만원
    INCOME_RANGE_5  // 11000만원 이상
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
