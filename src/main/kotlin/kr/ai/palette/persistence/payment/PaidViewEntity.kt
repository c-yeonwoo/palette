package kr.ai.palette.persistence.payment

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(
    name = "paid_views",
    uniqueConstraints = [UniqueConstraint(columnNames = ["buyer_user_id", "target_user_id"])]
)
class PaidViewEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "buyer_user_id", nullable = false)
    val buyerUserId: String,

    @Column(name = "target_user_id", nullable = false)
    val targetUserId: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
)
