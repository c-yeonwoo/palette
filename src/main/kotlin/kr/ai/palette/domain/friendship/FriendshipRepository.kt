package kr.ai.palette.domain.friendship

import kr.ai.palette.domain.common.UserId

interface FriendshipRepository {
    fun save(friendship: Friendship): Friendship
    fun findById(id: FriendshipId): Friendship?
    fun findByUserId(userId: UserId): List<Friendship>
    fun findAcceptedFriendshipsByUserId(userId: UserId): List<Friendship>
    fun findFriendIdsByUserId(userId: UserId): List<UserId>
    fun findSecondDegreeFriendIds(userId: UserId): List<UserId>
    fun existsBetweenUsers(user1Id: UserId, user2Id: UserId): Boolean
}
