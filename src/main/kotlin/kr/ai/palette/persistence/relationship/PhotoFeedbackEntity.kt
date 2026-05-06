package kr.ai.palette.persistence.relationship

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "photo_feedbacks",
    uniqueConstraints = [UniqueConstraint(columnNames = ["request_id", "user_id"])],
    indexes = [Index(name = "idx_photo_feedback_request_id", columnList = "request_id")]
)
class PhotoFeedbackEntity(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "request_id", nullable = false)
    val requestId: UUID,

    @Column(name = "user_id", nullable = false)
    val userId: String,

    @Column(nullable = false)
    val similarity: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)
