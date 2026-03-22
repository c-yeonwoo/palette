package kr.ai.palette.persistence.notification

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface NotificationJpaRepository : JpaRepository<NotificationEntity, UUID> {
    fun findByUserIdOrderByCreatedAtDesc(userId: String): List<NotificationEntity>
    fun countByUserIdAndIsReadFalse(userId: String): Int

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    fun markAllAsReadByUserId(userId: String): Int

    @Modifying
    @Query("DELETE FROM NotificationEntity n WHERE n.userId = :userId")
    fun deleteByUserId(userId: String)
}
