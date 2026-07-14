package kr.ai.palette.persistence.relationship

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * 인앱 1:1 채팅 메시지 (ADR 0066).
 * COMPLETED 매칭 관계의 당사자(requester/target) 간 텍스트 메시지.
 */
@Entity
@Table(
    name = "chat_messages",
    indexes = [
        Index(name = "idx_chat_msg_request", columnList = "request_id, created_at"),
        Index(name = "idx_chat_msg_request_sender", columnList = "request_id, sender_id"),
    ],
)
class ChatMessageEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "request_id", nullable = false, columnDefinition = "BINARY(16)")
    val requestId: UUID,

    @Column(name = "sender_id", nullable = false, length = 36)
    val senderId: String,

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    val body: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "read_at")
    val readAt: Instant? = null,
)
