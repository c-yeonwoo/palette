package kr.ai.palette.persistence.recommendation

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * 운영자가 특정 viewer 의 추천에서 특정 target 을 차단 (BLOCK).
 *
 * - `AiSignalController` 의 후보 필터 단계에서 이 테이블 조회 후 제외
 * - 영구 차단 (`expiresAt = null`) 또는 N일 후 만료
 *
 * ADR: docs/DECISIONS/0011-ai-matching-override.md
 */
@Entity
@Table(
    name = "admin_blocked_targets",
    indexes = [
        Index(name = "idx_abt_viewer", columnList = "viewer_user_id"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_abt_viewer_target",
            columnNames = ["viewer_user_id", "target_user_id"]),
    ],
)
class AdminBlockedTargetEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "viewer_user_id", columnDefinition = "BINARY(16)", nullable = false)
    var viewerUserId: UUID,

    @Column(name = "target_user_id", columnDefinition = "BINARY(16)", nullable = false)
    var targetUserId: UUID,

    @Column(name = "reason", length = 500, nullable = false)
    var reason: String,

    @Column(name = "created_by", columnDefinition = "BINARY(16)", nullable = false)
    var createdBy: UUID,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    /** null = 영구 차단 */
    @Column(name = "expires_at")
    var expiresAt: LocalDate? = null,
) {
    protected constructor() : this(
        viewerUserId = UUID.randomUUID(),
        targetUserId = UUID.randomUUID(),
        reason = "",
        createdBy = UUID.randomUUID(),
    )
}
