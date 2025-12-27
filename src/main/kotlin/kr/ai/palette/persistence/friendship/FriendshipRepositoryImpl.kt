package kr.ai.palette.persistence.friendship

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.Friendship
import kr.ai.palette.domain.friendship.FriendshipId
import kr.ai.palette.domain.friendship.FriendshipRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Repository

@Repository
class FriendshipRepositoryImpl(
    private val jpaRepository: FriendshipJpaRepository,
    private val mapper: FriendshipMapper
) : FriendshipRepository {

    override fun save(friendship: Friendship): Friendship {
        val entity = mapper.toEntity(friendship)
        val saved = jpaRepository.save(entity)
        return mapper.toDomain(saved)
    }

    override fun findById(id: FriendshipId): Friendship? {
        return jpaRepository.findByIdOrNull(id.value)?.let { mapper.toDomain(it) }
    }

    override fun findByUserId(userId: UserId): List<Friendship> {
        return jpaRepository.findByUserId(userId.value)
            .map { mapper.toDomain(it) }
    }

    override fun findAcceptedFriendshipsByUserId(userId: UserId): List<Friendship> {
        return jpaRepository.findAcceptedFriendshipsByUserId(userId.value)
            .map { mapper.toDomain(it) }
    }

    override fun findFriendIdsByUserId(userId: UserId): List<UserId> {
        return jpaRepository.findFriendIdsByUserId(userId.value)
            .map { UserId(it) }
    }

    override fun findSecondDegreeFriendIds(userId: UserId): List<UserId> {
        // 1촌 친구들의 ID 가져오기
        val firstDegreeFriendIds = findFriendIdsByUserId(userId)

        if (firstDegreeFriendIds.isEmpty()) {
            return emptyList()
        }

        // 각 1촌 친구들의 친구들(2촌) 가져오기
        val secondDegreeFriendIds = firstDegreeFriendIds
            .flatMap { friendId -> findFriendIdsByUserId(friendId) }
            .distinct()
            .filter { it != userId }  // 자기 자신 제외
            .filterNot { it in firstDegreeFriendIds }  // 1촌 제외

        return secondDegreeFriendIds
    }

    override fun existsBetweenUsers(user1Id: UserId, user2Id: UserId): Boolean {
        return jpaRepository.existsBetweenUsers(user1Id.value, user2Id.value)
    }
}
