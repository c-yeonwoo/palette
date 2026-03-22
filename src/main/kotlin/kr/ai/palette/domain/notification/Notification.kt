package kr.ai.palette.domain.notification

import java.time.Instant
import java.util.UUID

data class NotificationId(val value: UUID = UUID.randomUUID())

data class Notification(
    val id: NotificationId,
    val userId: String,
    val type: NotificationType,
    val title: String,
    val body: String,
    val isRead: Boolean = false,
    val metadata: Map<String, String> = emptyMap(),
    val createdAt: Instant = Instant.now()
) {
    fun markAsRead(): Notification = copy(isRead = true)
}
