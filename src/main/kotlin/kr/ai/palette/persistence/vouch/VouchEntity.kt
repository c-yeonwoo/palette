package kr.ai.palette.persistence.vouch

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "vouches",
    uniqueConstraints = [UniqueConstraint(columnNames = ["target_user_id", "voucher_id"])],
    indexes = [Index(name = "idx_vouch_target_user_id", columnList = "target_user_id")]
)
class VouchEntity(
    @Id
    val id: UUID = UUID.randomUUID(),

    @Column(name = "target_user_id", nullable = false)
    val targetUserId: String,

    @Column(name = "voucher_id", nullable = false)
    val voucherId: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)
