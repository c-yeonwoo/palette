package kr.ai.palette.persistence.safety

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * 유저간 차단 (어뷰징 방지 — ADR 0023). 단방향 레코드지만 노출은 양방향 격리.
 */
@Entity
@Table(
    name = "user_blocks",
    uniqueConstraints = [UniqueConstraint(columnNames = ["blocker_user_id", "blocked_user_id"])]
)
class BlockEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    @Column(name = "blocker_user_id", nullable = false, columnDefinition = "BINARY(16)")
    var blockerUserId: UUID,

    @Column(name = "blocked_user_id", nullable = false, columnDefinition = "BINARY(16)")
    var blockedUserId: UUID,

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),
) {
    protected constructor() : this(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID())
}
