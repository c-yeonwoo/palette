package kr.ai.palette.persistence.feed

import org.springframework.data.jpa.repository.JpaRepository

interface FeedHideJpaRepository : JpaRepository<FeedHideEntity, Long> {
    fun existsByUserIdAndTargetUserId(userId: String, targetUserId: String): Boolean
    fun findAllByUserId(userId: String): List<FeedHideEntity>
    fun deleteByUserIdAndTargetUserId(userId: String, targetUserId: String)
}
