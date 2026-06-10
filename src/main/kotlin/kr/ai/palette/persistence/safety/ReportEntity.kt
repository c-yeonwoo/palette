package kr.ai.palette.persistence.safety

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * 유저 신고 (어뷰징 방지 — ADR 0023 + ADR 0046). 운영자가 검토.
 *
 * reason 카테고리 (varchar 보관):
 *  · FAKE_PROFILE — 허위 프로필
 *  · HARASSMENT — 괴롭힘·성희롱
 *  · SPAM — 도배·스팸
 *  · MINOR — 미성년자
 *  · EXTERNAL_PAYMENT_INDUCEMENT — 주선자가 외부 송금 유도 (ADR 0046, 확정 시 신고자 +50 물감 보상)
 *  · OTHER — 기타
 *
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
