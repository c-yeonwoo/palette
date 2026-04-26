package kr.ai.palette.persistence.feed

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(
    name = "feed_hides",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "target_user_id"])]
)
class FeedHideEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "user_id", nullable = false)
    val userId: String,

    @Column(name = "target_user_id", nullable = false)
    val targetUserId: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
)
