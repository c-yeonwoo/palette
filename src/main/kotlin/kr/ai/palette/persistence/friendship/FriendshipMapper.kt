package kr.ai.palette.persistence.friendship

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.Friendship
import kr.ai.palette.domain.friendship.FriendshipId
import kr.ai.palette.domain.friendship.FriendshipStatus
import org.springframework.stereotype.Component

@Component
class FriendshipMapper {
    fun toDomain(entity: FriendshipEntity): Friendship {
        return Friendship(
            id = FriendshipId(entity.id),
            user1Id = UserId(entity.user1Id),
            user2Id = UserId(entity.user2Id),
            status = entity.status.toDomain(),
            createdAt = entity.createdAt,
            acceptedAt = entity.acceptedAt
        )
    }

    fun toEntity(friendship: Friendship): FriendshipEntity {
        return FriendshipEntity(
            id = friendship.id.value,
            user1Id = friendship.user1Id.value,
            user2Id = friendship.user2Id.value,
            status = friendship.status.toEntity(),
            createdAt = friendship.createdAt,
            acceptedAt = friendship.acceptedAt
        )
    }

    private fun FriendshipStatusEntity.toDomain(): FriendshipStatus {
        return FriendshipStatus.valueOf(this.name)
    }

    private fun FriendshipStatus.toEntity(): FriendshipStatusEntity {
        return FriendshipStatusEntity.valueOf(this.name)
    }
}
