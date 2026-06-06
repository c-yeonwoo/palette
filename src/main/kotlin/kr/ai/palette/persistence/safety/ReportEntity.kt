package kr.ai.palette.persistence.safety

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * 유저 신고 (어뷰징 방지 — ADR 0023). 운영자가 검토.
 * reason: FAKE_PROFILE / HARASSMENT / SPAM / MINOR / OTHER (varchar 보관).
 * status: PENDING / REVIEWED.
 */
@Entity
@Table(name = "user_reports")
class ReportEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    @Column(name = "reporter_user_id", nullable = false, columnDefinition = "BINARY(16)")
    var reporterUserId: UUID,

    @Column(name = "reported_user_id", nullable = false, columnDefinition = "BINARY(16)")
    var reportedUserId: UUID,

    @Column(name = "reason", nullable = false, length = 32)
    var reason: String,

    @Column(name = "detail", columnDefinition = "TEXT")
    var detail: String? = null,

    @Column(name = "status", nullable = false, length = 16)
    var status: String = "PENDING",

    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),
) {
    protected constructor() : this(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "OTHER")
}
