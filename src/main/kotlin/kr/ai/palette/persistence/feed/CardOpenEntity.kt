package kr.ai.palette.persistence.feed

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(
    name = "card_opens",
    uniqueConstraints = [UniqueConstraint(columnNames = ["viewer_id", "target_user_id"])]
)
class CardOpenEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "viewer_id", columnDefinition = "BINARY(16)", nullable = false)
    val viewerId: UUID,

    @Column(name = "target_user_id", columnDefinition = "BINARY(16)", nullable = false)
    val targetUserId: UUID,

    @Column(name = "opened_at", nullable = false)
    val openedAt: LocalDateTime = LocalDateTime.now()
)
