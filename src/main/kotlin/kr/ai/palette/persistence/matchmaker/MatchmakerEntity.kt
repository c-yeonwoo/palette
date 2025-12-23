package kr.ai.palette.persistence.matchmaker

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "matchmakers")
class MatchmakerEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    @Column(name = "user_id", nullable = false, columnDefinition = "BINARY(16)")
    var userId: UUID,

    // Stats fields
    @Column(name = "total_match_requests", nullable = false)
    var totalMatchRequests: Int = 0,

    @Column(name = "approved_requests", nullable = false)
    var approvedRequests: Int = 0,

    @Column(name = "rejected_requests", nullable = false)
    var rejectedRequests: Int = 0,

    @Column(name = "successful_matches", nullable = false)
    var successfulMatches: Int = 0,

    @Column(name = "failed_matches", nullable = false)
    var failedMatches: Int = 0,

    // Level fields
    @Column(name = "level", nullable = false)
    var level: Int = 1,

    @Column(name = "commission_rate", nullable = false)
    var commissionRate: Double = 0.30,

    // Earnings fields
    @Column(name = "total_points", nullable = false)
    var totalPoints: Int = 0,

    @Column(name = "withdrawn_points", nullable = false)
    var withdrawnPoints: Int = 0,

    @Column(name = "pending_points", nullable = false)
    var pendingPoints: Int = 0,

    // Photo fields
    @Column(name = "profile_photo_url", columnDefinition = "TEXT")
    var profilePhotoUrl: String? = null,

    @Column(name = "profile_photo_uploaded_at")
    var profilePhotoUploadedAt: Instant? = null,

    // Metadata fields
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
) {
    // JPA requires no-arg constructor
    protected constructor() : this(
        id = UUID.randomUUID(),
        userId = UUID.randomUUID()
    )

    @PreUpdate
    fun preUpdate() {
        updatedAt = Instant.now()
    }
}
