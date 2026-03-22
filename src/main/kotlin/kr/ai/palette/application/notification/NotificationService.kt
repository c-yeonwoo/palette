package kr.ai.palette.application.notification

import kr.ai.palette.domain.notification.Notification
import kr.ai.palette.domain.notification.NotificationId
import kr.ai.palette.domain.notification.NotificationRepository
import kr.ai.palette.domain.notification.NotificationType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional
class NotificationService(
    private val notificationRepository: NotificationRepository
) {

    fun create(
        userId: String,
        type: NotificationType,
        title: String,
        body: String,
        metadata: Map<String, String> = emptyMap()
    ): Notification {
        val notification = Notification(
            id = NotificationId(),
            userId = userId,
            type = type,
            title = title,
            body = body,
            metadata = metadata
        )
        return notificationRepository.save(notification)
    }

    @Transactional(readOnly = true)
    fun getByUserId(userId: String): List<Notification> =
        notificationRepository.findByUserId(userId)

    @Transactional(readOnly = true)
    fun getUnreadCount(userId: String): Int =
        notificationRepository.countUnreadByUserId(userId)

    fun markAsRead(userId: String, notificationId: NotificationId): Boolean {
        val notification = notificationRepository.findById(notificationId) ?: return false
        if (notification.userId != userId) return false
        notificationRepository.update(notification.markAsRead())
        return true
    }

    fun markAllAsRead(userId: String): Int =
        notificationRepository.markAllAsRead(userId)
}
