package kr.ai.palette.persistence.user

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(
    name = "users",
    indexes = [
        Index(name = "idx_users_oauth", columnList = "oauth_provider, oauth_id", unique = true),
        Index(name = "idx_users_email", columnList = "email"),
        Index(name = "idx_users_phone", columnList = "phone_number"),
    ]
)
class UserEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    // OAuth Info (nullable for email-based users)
    @Column(name = "oauth_provider", length = 20)
    @Enumerated(EnumType.STRING)
    var oauthProvider: OAuthProviderEntity?,

    @Column(name = "oauth_id", length = 255)
    var oauthId: String?,

    // Password (nullable for OAuth users, BCrypt hashed for email users)
    @Column(name = "password", length = 255)
    var password: String?,

    // Private Info
    @Column(name = "real_name", nullable = false, length = 50)
    var realName: String,

    @Column(name = "email", length = 255)
    var email: String?,

    @Column(name = "phone_number", length = 20)
    var phoneNumber: String?,

    @Column(name = "is_phone_verified", nullable = false)
    var isPhoneVerified: Boolean = false,

    // Contact Info
    @Column(name = "kakao_talk_id", length = 100)
    var kakaoTalkId: String?,

    @Column(name = "preferred_contact_method", length = 20)
    @Enumerated(EnumType.STRING)
    var preferredContactMethod: ContactMethodEntity?,

    // Public Info
    @Column(name = "nickname", nullable = false, unique = true, length = 20)
    var nickname: String,

    @Column(name = "birth_date", nullable = false)
    var birthDate: LocalDate,

    @Column(name = "gender", nullable = false, length = 10)
    @Enumerated(EnumType.STRING)
    var gender: GenderEntity,

    // Account Type
    @Column(name = "account_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    var accountType: AccountTypeEntity = AccountTypeEntity.REGULAR,

    // Profile Status
    @Column(name = "is_profile_completed", nullable = false)
    var isProfileCompleted: Boolean = false,

    // Terms Agreement
    @Column(name = "agreed_terms_service", nullable = false)
    var agreedTermsService: Boolean,

    @Column(name = "agreed_terms_privacy", nullable = false)
    var agreedTermsPrivacy: Boolean,

    @Column(name = "agreed_marketing", nullable = false)
    var agreedMarketing: Boolean = false,

    @Column(name = "agreed_at", nullable = false)
    var agreedAt: Instant,

    // Metadata
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),

    @Column(name = "last_login_at", nullable = false)
    var lastLoginAt: Instant = Instant.now(),

    @Column(name = "deleted_at")
    var deletedAt: Instant? = null
) {
    protected constructor() : this(
        id = UUID.randomUUID(),
        oauthProvider = null,
        oauthId = null,
        password = null,
        realName = "",
        email = null,
        phoneNumber = null,
        isPhoneVerified = false,
        kakaoTalkId = null,
        preferredContactMethod = null,
        nickname = "",
        birthDate = LocalDate.now(),
        gender = GenderEntity.MALE,
        agreedTermsService = false,
        agreedTermsPrivacy = false,
        agreedAt = Instant.now()
    )

    @PreUpdate
    fun preUpdate() {
        updatedAt = Instant.now()
    }
}

enum class OAuthProviderEntity {
    KAKAO,
    NAVER,
    GOOGLE,
    APPLE
}

enum class GenderEntity {
    MALE,
    FEMALE
}

enum class AccountTypeEntity {
    REGULAR,
    MATCHMAKER_ONLY
}

enum class ContactMethodEntity {
    KAKAOTALK,
    PHONE
}
