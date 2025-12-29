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

    // Requester's message to matchmaker
    @Column(name = "requester_message", columnDefinition = "TEXT")
    val requesterMessage: String?,

    // Matchmaker decision
    @Column(name = "matchmaker_decided_at")
    val matchmakerDecidedAt: LocalDateTime?,

    @Column(name = "matchmaker_message", columnDefinition = "TEXT")
    val matchmakerMessage: String?,

    @Column(name = "matchmaker_approved")
    val matchmakerApproved: Boolean?,

    // Target user decision
    @Column(name = "target_decided_at")
    val targetDecidedAt: LocalDateTime?,

    @Column(name = "target_message", columnDefinition = "TEXT")
    val targetMessage: String?,

    @Column(name = "target_accepted")
    val targetAccepted: Boolean?,

    // Status tracking
    @Column(name = "status", nullable = false, length = 30)
    val status: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime,

    @Column(name = "updated_at", nullable = false)
    val updatedAt: LocalDateTime
)
