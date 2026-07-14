package kr.ai.palette.persistence.relationship

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.util.UUID

interface ChatMessageJpaRepository : JpaRepository<ChatMessageEntity, UUID> {
    fun findByRequestIdOrderByCreatedAtAsc(requestId: UUID): List<ChatMessageEntity>

    fun findByRequestIdAndCreatedAtAfterOrderByCreatedAtAsc(
        requestId: UUID,
        createdAt: Instant,
    ): List<ChatMessageEntity>

    fun countByRequestIdAndSenderIdNotAndReadAtIsNull(requestId: UUID, senderId: String): Long

    @Modifying
    @Query(
        """
        UPDATE ChatMessageEntity m
        SET m.readAt = :now
        WHERE m.requestId = :requestId
          AND m.senderId <> :readerId
          AND m.readAt IS NULL
        """,
    )
    fun markAsRead(
        @Param("requestId") requestId: UUID,
        @Param("readerId") readerId: String,
        @Param("now") now: Instant,
    ): Int
}
