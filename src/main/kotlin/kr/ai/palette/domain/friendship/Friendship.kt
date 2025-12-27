package kr.ai.palette.domain.friendship

import kr.ai.palette.domain.common.UserId
import java.time.Instant
import java.util.UUID

/**
 * 친구 관계 Aggregate
 * 쌍방향 관계로, 한 번 승인되면 양쪽 모두 친구가 됨
 */
data class Friendship(
    val id: FriendshipId,
    val user1Id: UserId,
    val user2Id: UserId,
    val status: FriendshipStatus,
    val createdAt: Instant,
    val acceptedAt: Instant?
) {
    init {
        require(user1Id != user2Id) { "Cannot create friendship with self" }
        if (status == FriendshipStatus.ACCEPTED) {
            requireNotNull(acceptedAt) { "Accepted friendship must have acceptedAt" }
        }
    }

    fun accept(acceptedAt: Instant): Friendship {
        require(status == FriendshipStatus.PENDING) { "Can only accept pending friendship" }
        return copy(
            status = FriendshipStatus.ACCEPTED,
            acceptedAt = acceptedAt
        )
    }

    fun isFriendWith(userId: UserId): Boolean {
        return status == FriendshipStatus.ACCEPTED &&
               (user1Id == userId || user2Id == userId)
    }

    fun getOtherUserId(userId: UserId): UserId {
        return when (userId) {
            user1Id -> user2Id
            user2Id -> user1Id
            else -> throw IllegalArgumentException("User is not part of this friendship")
        }
    }
}

@JvmInline
value class FriendshipId(val value: UUID) {
    companion object {
        fun generate() = FriendshipId(UUID.randomUUID())
    }
}

enum class FriendshipStatus {
    PENDING,   // 대기 중
    ACCEPTED   // 승인됨
}
