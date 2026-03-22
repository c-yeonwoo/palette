package kr.ai.palette.persistence.notification

import jakarta.persistence.*
import kr.ai.palette.domain.notification.Notification
import kr.ai.palette.domain.notification.NotificationId
import kr.ai.palette.domain.notification.NotificationType
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "notifications", indexes = [
    Index(name = "idx_notification_user_id", columnList = "user_id"),
    Index(name = "idx_notification_is_read", columnList = "is_read")
])
class NotificationEntity(
    @Id
    val id: UUID,

    @Column(name = "user_id", nullable = false)
    val userId: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: NotificationType,

    @Column(nullable = false)
    val title: String,

    @Column(nullable = false, length = 500)
    val body: String,

    @Column(name = "is_read", nullable = false)
    val isRead: Boolean = false,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    // JSON 형태로 저장: {"key":"value",...}
    @Column(name = "metadata_json", nullable = false, columnDefinition = "TEXT")
    val metadataJson: String = "{}"
) {
    fun toDomain(): Notification = Notification(
        id = NotificationId(id),
        userId = userId,
        type = type,
        title = title,
        body = body,
        isRead = isRead,
        createdAt = createdAt,
        metadata = parseMetadata(metadataJson)
    )

    companion object {
        fun fromDomain(n: Notification): NotificationEntity = NotificationEntity(
            id = n.id.value,
            userId = n.userId,
            type = n.type,
            title = n.title,
            body = n.body,
            isRead = n.isRead,
            createdAt = n.createdAt,
            metadataJson = serializeMetadata(n.metadata)
        )

        private fun serializeMetadata(map: Map<String, String>): String {
            if (map.isEmpty()) return "{}"
            return map.entries.joinToString(",", "{", "}") { (k, v) ->
                "\"${k.replace("\"", "\\\"")}\":\"${v.replace("\"", "\\\"")}\""
            }
        }

        private fun parseMetadata(json: String): Map<String, String> {
            if (json.isBlank() || json == "{}") return emptyMap()
            return try {
                json.trim().removeSurrounding("{", "}")
                    .split(",")
                    .associate { pair ->
                        val (k, v) = pair.split(":", limit = 2)
                        k.trim().removeSurrounding("\"") to v.trim().removeSurrounding("\"")
                    }
            } catch (_: Exception) {
                emptyMap()
            }
        }
    }
}
