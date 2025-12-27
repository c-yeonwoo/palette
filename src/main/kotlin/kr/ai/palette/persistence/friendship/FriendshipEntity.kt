package kr.ai.palette.persistence.friendship

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(
    name = "friendships",
    indexes = [
        Index(name = "idx_friendship_user1", columnList = "user1_id"),
        Index(name = "idx_friendship_user2", columnList = "user2_id"),
        Index(name = "idx_friendship_status", columnList = "status")
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_friendship_users", columnNames = ["user1_id", "user2_id"])
    ]
)
class FriendshipEntity(
    @Id
    @Column(name = "id")
    val id: UUID,

    @Column(name = "user1_id", nullable = false)
    val user1Id: UUID,

    @Column(name = "user2_id", nullable = false)
    val user2Id: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    val status: FriendshipStatusEntity,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant,

    @Column(name = "accepted_at")
    val acceptedAt: Instant?
)

enum class FriendshipStatusEntity {
    PENDING,
    ACCEPTED
}
