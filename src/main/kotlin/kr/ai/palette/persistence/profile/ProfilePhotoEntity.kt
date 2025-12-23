package kr.ai.palette.persistence.profile

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "profile_photos")
class ProfilePhotoEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    @Column(name = "profile_id", nullable = false, columnDefinition = "BINARY(16)")
    var profileId: UUID,

    @Column(name = "s3_key", nullable = false, columnDefinition = "TEXT")
    var s3Key: String,

    @Column(name = "url", nullable = false, columnDefinition = "TEXT")
    var url: String,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int,

    @Column(name = "is_primary", nullable = false)
    var isPrimary: Boolean = false,

    // Trust Analysis
    @Column(name = "trust_factor", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    var trustFactor: TrustFactorEntity = TrustFactorEntity.UNKNOWN,

    @Column(name = "trust_score", nullable = false)
    var trustScore: Int = 10,

    // AI Analysis
    @Column(name = "has_face")
    var hasFace: Boolean?,

    @Column(name = "has_full_body")
    var hasFullBody: Boolean?,

    @Column(name = "has_clear_face")
    var hasClearFace: Boolean?,

    @Column(name = "quality_score")
    var qualityScore: Int?,

    @Column(name = "is_selfie")
    var isSelfie: Boolean?,

    @Column(name = "is_taken_by_others")
    var isTakenByOthers: Boolean?,

    @Column(name = "is_over_processed")
    var isOverProcessed: Boolean?,

    @Column(name = "ai_analysis", columnDefinition = "JSON")
    var aiAnalysis: String?, // JSON object as String

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now()
) {
    protected constructor() : this(
        id = UUID.randomUUID(),
        profileId = UUID.randomUUID(),
        s3Key = "",
        url = "",
        displayOrder = 0,
        hasFace = null,
        hasFullBody = null,
        hasClearFace = null,
        qualityScore = null,
        isSelfie = null,
        isTakenByOthers = null,
        isOverProcessed = null,
        aiAnalysis = null
    )
}

enum class TrustFactorEntity {
    SELFIE,
    TAKEN_BY_OTHERS,
    UNCLEAR,
    UNKNOWN
}
