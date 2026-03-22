package kr.ai.palette.persistence.friendship

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface FriendshipJpaRepository : JpaRepository<FriendshipEntity, UUID> {
    @Query("""
        SELECT f FROM FriendshipEntity f
        WHERE (f.user1Id = :userId OR f.user2Id = :userId)
    """)
    fun findByUserId(@Param("userId") userId: UUID): List<FriendshipEntity>

    @Query("""
        SELECT f FROM FriendshipEntity f
        WHERE (f.user1Id = :userId OR f.user2Id = :userId)
        AND f.status = 'ACCEPTED'
    """)
    fun findAcceptedFriendshipsByUserId(@Param("userId") userId: UUID): List<FriendshipEntity>

    @Query("""
        SELECT CASE
            WHEN f.user1Id = :userId THEN f.user2Id
            ELSE f.user1Id
        END
        FROM FriendshipEntity f
        WHERE (f.user1Id = :userId OR f.user2Id = :userId)
        AND f.status = 'ACCEPTED'
    """)
    fun findFriendIdsByUserId(@Param("userId") userId: UUID): List<UUID>

    @Query("""
        SELECT EXISTS(
            SELECT 1 FROM FriendshipEntity f
            WHERE ((f.user1Id = :user1Id AND f.user2Id = :user2Id)
                OR (f.user1Id = :user2Id AND f.user2Id = :user1Id))
        )
    """)
    fun existsBetweenUsers(@Param("user1Id") user1Id: UUID, @Param("user2Id") user2Id: UUID): Boolean

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM FriendshipEntity f WHERE f.user1Id = :userId OR f.user2Id = :userId")
    fun deleteByUserId(@Param("userId") userId: UUID)
}
