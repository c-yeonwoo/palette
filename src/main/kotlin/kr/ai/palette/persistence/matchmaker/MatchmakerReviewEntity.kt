package kr.ai.palette.persistence.matchmaker

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "matchmaker_reviews")
class MatchmakerReviewEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    @Column(name = "matchmaker_id", nullable = false, columnDefinition = "BINARY(16)")
    var matchmakerId: UUID,

    @Column(name = "reviewer_user_id", nullable = false, columnDefinition = "BINARY(16)")
    var reviewerUserId: UUID,

    @Column(name = "rating", nullable = false)
    var rating: Int,

    @Column(name = "comment", columnDefinition = "TEXT")
    var comment: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),
) {
    protected constructor() : this(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), 5, "")
}
