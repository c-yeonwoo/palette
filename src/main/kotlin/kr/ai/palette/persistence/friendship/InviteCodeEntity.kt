package kr.ai.palette.persistence.friendship

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "invite_codes",
    indexes = [
        Index(name = "idx_invite_codes_code", columnList = "code", unique = true),
        Index(name = "idx_invite_codes_user_id", columnList = "user_id"),
    ]
)
class InviteCodeEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false, columnDefinition = "BINARY(16)")
    val userId: UUID,

    @Column(name = "code", nullable = false, length = 10, unique = true)
    val code: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "expires_at", nullable = false)
    val expiresAt: Instant,
)
