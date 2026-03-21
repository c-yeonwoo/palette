package kr.ai.palette.presentation.notification

import kr.ai.palette.domain.auth.AuthUser
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

enum class NotificationType {
    MATCH_REQUEST,          // 주선 요청 도착
    MATCH_APPROVED,         // 주선 요청 승인됨 (주선자 승인)
    MATCH_REJECTED,         // 주선 요청 거절됨
    MATCH_COMPLETED,        // 매칭 성사!
    FRIEND_REQUEST,         // 친구 요청 도착
    FRIEND_ACCEPTED,        // 친구 요청 수락됨
    PROFILE_VIEW,           // 내 프로필 열람
    SYSTEM                  // 시스템 알림
}

data class Notification(
    val id: String,
    val userId: String,
    val type: NotificationType,
    val title: String,
    val body: String,
    val isRead: Boolean,
    val createdAt: Instant,
    val metadata: Map<String, String> = emptyMap()
)

data class NotificationListResponse(
    val notifications: List<Notification>,
    val unreadCount: Int,
    val totalCount: Int
)

@RestController
@RequestMapping("/api/v1/notifications")
class NotificationController {

    companion object {
        // userId -> list of notifications (sorted newest first)
        private val store = ConcurrentHashMap<String, MutableList<Notification>>()

        fun addNotification(
            userId: String,
            type: NotificationType,
            title: String,
            body: String,
            metadata: Map<String, String> = emptyMap()
        ) {
            val notification = Notification(
                id = UUID.randomUUID().toString(),
                userId = userId,
                type = type,
                title = title,
                body = body,
                isRead = false,
                createdAt = Instant.now(),
                metadata = metadata
            )
            store.getOrPut(userId) { mutableListOf() }.add(0, notification)
        }

        // Seed mock notifications for demo (called once per user on first access)
        private val seeded = mutableSetOf<String>()

        fun seedMockNotifications(userId: String) {
            if (seeded.contains(userId)) return
            seeded.add(userId)

            val now = Instant.now()
            val notifications = listOf(
                Notification(
                    id = UUID.randomUUID().toString(),
                    userId = userId,
                    type = NotificationType.SYSTEM,
                    title = "Palette에 오신 것을 환영합니다! 🎨",
                    body = "나만의 색을 찾아 조화로운 만남을 시작해보세요",
                    isRead = false,
                    createdAt = now.minusSeconds(3600)
                ),
                Notification(
                    id = UUID.randomUUID().toString(),
                    userId = userId,
                    type = NotificationType.PROFILE_VIEW,
                    title = "누군가 내 프로필을 열람했습니다",
                    body = "오늘 내 프로필을 3명이 확인했어요",
                    isRead = true,
                    createdAt = now.minusSeconds(7200)
                ),
                Notification(
                    id = UUID.randomUUID().toString(),
                    userId = userId,
                    type = NotificationType.FRIEND_REQUEST,
                    title = "새 친구 요청",
                    body = "김민준님이 친구 요청을 보냈습니다",
                    isRead = true,
                    createdAt = now.minusSeconds(86400)
                )
            )
            store.getOrPut(userId) { mutableListOf() }.addAll(notifications)
        }
    }

    /**
     * 알림 목록 조회
     */
    @GetMapping
    fun getNotifications(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<NotificationListResponse> {
        val userId = authUser.userId.value.toString()
        seedMockNotifications(userId)

        val notifications = store[userId] ?: emptyList()
        val unreadCount = notifications.count { !it.isRead }

        return ResponseEntity.ok(
            NotificationListResponse(
                notifications = notifications,
                unreadCount = unreadCount,
                totalCount = notifications.size
            )
        )
    }

    /**
     * 알림 읽음 처리
     */
    @PostMapping("/read/{notificationId}")
    fun markAsRead(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable notificationId: String
    ): ResponseEntity<Map<String, Any>> {
        val userId = authUser.userId.value.toString()
        val list = store[userId] ?: return ResponseEntity.notFound().build()

        val idx = list.indexOfFirst { it.id == notificationId }
        if (idx == -1) return ResponseEntity.notFound().build()

        list[idx] = list[idx].copy(isRead = true)
        return ResponseEntity.ok(mapOf("success" to true))
    }

    /**
     * 전체 읽음 처리
     */
    @PostMapping("/read-all")
    fun markAllAsRead(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<Map<String, Any>> {
        val userId = authUser.userId.value.toString()
        val list = store[userId] ?: return ResponseEntity.ok(mapOf("success" to true, "count" to 0))

        var count = 0
        for (i in list.indices) {
            if (!list[i].isRead) {
                list[i] = list[i].copy(isRead = true)
                count++
            }
        }
        return ResponseEntity.ok(mapOf("success" to true, "count" to count))
    }

    /**
     * 읽지 않은 알림 수 조회 (badge용)
     */
    @GetMapping("/unread-count")
    fun getUnreadCount(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<Map<String, Int>> {
        val userId = authUser.userId.value.toString()
        seedMockNotifications(userId)
        val unread = store[userId]?.count { !it.isRead } ?: 0
        return ResponseEntity.ok(mapOf("count" to unread))
    }
}
