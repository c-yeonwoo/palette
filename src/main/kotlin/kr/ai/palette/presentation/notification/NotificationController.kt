package kr.ai.palette.presentation.notification

import kr.ai.palette.application.notification.NotificationService
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.notification.Notification
import kr.ai.palette.domain.notification.NotificationId
import kr.ai.palette.domain.notification.NotificationType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

// ── Response DTOs ──────────────────────────────────────────────────────────────

data class NotificationResponse(
    val id: String,
    val userId: String,
    val type: NotificationType,
    val title: String,
    val body: String,
    val isRead: Boolean,
    val createdAt: String,
    val metadata: Map<String, String>
) {
    companion object {
        fun from(n: Notification) = NotificationResponse(
            id = n.id.value.toString(),
            userId = n.userId,
            type = n.type,
            title = n.title,
            body = n.body,
            isRead = n.isRead,
            createdAt = n.createdAt.toString(),
            metadata = n.metadata
        )
    }
}

data class NotificationListResponse(
    val notifications: List<NotificationResponse>,
    val unreadCount: Int,
    val totalCount: Int
)

// ── Controller ─────────────────────────────────────────────────────────────────

@RestController
@RequestMapping("/api/v1/notifications")
class NotificationController(
    private val notificationService: NotificationService
) {

    @GetMapping
    fun getNotifications(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<NotificationListResponse> {
        val userId = authUser.userId.value.toString()
        val notifications = notificationService.getByUserId(userId)
        val unread = notifications.count { !it.isRead }

        return ResponseEntity.ok(
            NotificationListResponse(
                notifications = notifications.map { NotificationResponse.from(it) },
                unreadCount = unread,
                totalCount = notifications.size
            )
        )
    }

    @PostMapping("/read/{notificationId}")
    fun markAsRead(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable notificationId: String
    ): ResponseEntity<Map<String, Any>> {
        val userId = authUser.userId.value.toString()
        val success = notificationService.markAsRead(userId, NotificationId(UUID.fromString(notificationId)))
        return if (success) ResponseEntity.ok(mapOf("success" to true))
        else ResponseEntity.notFound().build()
    }

    @PostMapping("/read-all")
    fun markAllAsRead(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<Map<String, Any>> {
        val userId = authUser.userId.value.toString()
        val count = notificationService.markAllAsRead(userId)
        return ResponseEntity.ok(mapOf("success" to true, "count" to count))
    }

    @GetMapping("/unread-count")
    fun getUnreadCount(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<Map<String, Int>> {
        val userId = authUser.userId.value.toString()
        val count = notificationService.getUnreadCount(userId)
        return ResponseEntity.ok(mapOf("count" to count))
    }
}
