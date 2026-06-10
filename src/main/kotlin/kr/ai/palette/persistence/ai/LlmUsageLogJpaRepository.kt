package kr.ai.palette.persistence.ai

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.util.UUID

interface LlmUsageLogJpaRepository : JpaRepository<LlmUsageLogEntity, UUID> {

    fun findByUserIdOrderByCreatedAtDesc(userId: String): List<LlmUsageLogEntity>

    @Query("SELECT COUNT(l) FROM LlmUsageLogEntity l WHERE l.userId = :userId AND l.outcome = 'OK' AND l.createdAt > :after")
    fun countSuccessfulSince(@Param("userId") userId: String, @Param("after") after: Instant): Long
}
