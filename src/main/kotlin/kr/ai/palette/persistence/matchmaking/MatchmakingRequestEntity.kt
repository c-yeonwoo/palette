package kr.ai.palette.persistence.matchmaking

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "matchmaking_requests")
class MatchmakingRequestEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID,

    @Column(name = "requester_id", columnDefinition = "BINARY(16)", nullable = false)
    val requesterId: UUID,

    @Column(name = "target_user_id", columnDefinition = "BINARY(16)", nullable = false)
    val targetUserId: UUID,

    @Column(name = "matchmaker_id", columnDefinition = "BINARY(16)", nullable = false)
    val matchmakerId: UUID,

    @Column(name = "message", columnDefinition = "TEXT")
    val message: String?,

    @Column(name = "status", nullable = false, length = 20)
    val status: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime,

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime
)
