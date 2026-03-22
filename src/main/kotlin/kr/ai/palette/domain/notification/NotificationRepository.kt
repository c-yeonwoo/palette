package kr.ai.palette.domain.notification

interface NotificationRepository {
    fun save(notification: Notification): Notification
    fun findByUserId(userId: String): List<Notification>
    fun findById(id: NotificationId): Notification?
    fun update(notification: Notification): Notification
    fun markAllAsRead(userId: String): Int
    fun countUnreadByUserId(userId: String): Int
}
