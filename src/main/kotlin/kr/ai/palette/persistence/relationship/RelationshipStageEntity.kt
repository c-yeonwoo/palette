package kr.ai.palette.persistence.relationship

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "relationship_stages",
    indexes = [Index(name = "idx_rel_stage_request_id", columnList = "request_id")]
)
class RelationshipStageEntity(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "request_id", nullable = false, unique = true)
    val requestId: UUID,

    @Column(name = "user_id", nullable = false)
    val userId: String,

    @Column(nullable = false)
    val stage: String,

    @Column(length = 500)
    val message: String? = null,

    @Column(name = "updated_at", nullable = false)
    val updatedAt: Instant = Instant.now()
)
