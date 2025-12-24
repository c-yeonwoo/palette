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

    @Column(name = "s3_key", nullable = false, length = 500)
    var s3Key: String,

    @Column(name = "url", nullable = false, length = 1000)
    var url: String,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int,

    @Column(name = "is_primary", nullable = false)
    var isPrimary: Boolean,

    // Trust Analysis
    @Column(name = "trust_factor", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    var trustFactor: TrustFactorEntity,

    @Column(name = "trust_score", nullable = false)
    var trustScore: Int,

    // AI Analysis
    @Column(name = "ai_has_face")
    var aiHasFace: Boolean?,

    @Column(name = "ai_has_full_body")
    var aiHasFullBody: Boolean?,

    @Column(name = "ai_has_clear_face")
    var aiHasClearFace: Boolean?,

    @Column(name = "ai_quality_score")
    var aiQualityScore: Int?,

    @Column(name = "ai_is_selfie")
    var aiIsSelfie: Boolean?,

    @Column(name = "ai_is_taken_by_others")
    var aiIsTakenByOthers: Boolean?,

    @Column(name = "ai_is_over_processed")
    var aiIsOverProcessed: Boolean?,

    @Column(name = "ai_raw_data", columnDefinition = "TEXT")
    var aiRawData: String?, // JSON string

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant
)

enum class TrustFactorEntity {
    SELFIE, TAKEN_BY_OTHERS, UNCLEAR, UNKNOWN
}
