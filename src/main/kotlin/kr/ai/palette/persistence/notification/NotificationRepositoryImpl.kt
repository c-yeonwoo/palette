package kr.ai.palette.persistence.notification

import kr.ai.palette.domain.notification.Notification
import kr.ai.palette.domain.notification.NotificationId
import kr.ai.palette.domain.notification.NotificationRepository
import org.springframework.stereotype.Repository

@Repository
class NotificationRepositoryImpl(
    private val jpa: NotificationJpaRepository
) : NotificationRepository {

    override fun save(notification: Notification): Notification {
        val entity = NotificationEntity.fromDomain(notification)
        return jpa.save(entity).toDomain()
    }

    override fun findByUserId(userId: String): List<Notification> =
        jpa.findByUserIdOrderByCreatedAtDesc(userId).map { it.toDomain() }

    override fun findById(id: NotificationId): Notification? =
        jpa.findById(id.value).map { it.toDomain() }.orElse(null)

    override fun update(notification: Notification): Notification {
        val entity = NotificationEntity.fromDomain(notification)
        return jpa.save(entity).toDomain()
    }

    override fun markAllAsRead(userId: String): Int =
        jpa.markAllAsReadByUserId(userId)

    override fun countUnreadByUserId(userId: String): Int =
        jpa.countByUserIdAndIsReadFalse(userId)
}
