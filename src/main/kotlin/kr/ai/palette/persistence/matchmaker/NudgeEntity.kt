package kr.ai.palette.persistence.matchmaker

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * 연결 제안 (Nudge) — 주선자가 자신의 두 지인을 매칭시켜보자고 제안하는 행위.
 * GLOSSARY: 연결 제안 / Nudge. 건당 포인트 소모(기본 50P).
 *
 * 경량 영속 엔티티 (MatchmakerReviewEntity 와 동일 패턴).
 * ddl-auto=update 로 테이블 자동 생성.
 */
@Entity
@Table(name = "matchmaker_nudges")
class NudgeEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    @Column(name = "matchmaker_user_id", nullable = false, columnDefinition = "BINARY(16)")
    var matchmakerUserId: UUID,

    @Column(name = "from_user_id", nullable = false, columnDefinition = "BINARY(16)")
    var fromUserId: UUID,

    @Column(name = "to_user_id", nullable = false, columnDefinition = "BINARY(16)")
    var toUserId: UUID,

    @Column(name = "message", columnDefinition = "TEXT")
    var message: String? = null,

    @Column(name = "points_spent", nullable = false)
    var pointsSpent: Int = 50,

    @Column(name = "status", nullable = false, length = 32)
    var status: String = "PENDING",

    @Column(name = "proposed_at", nullable = false, updatable = false)
    var proposedAt: Instant = Instant.now(),
) {
    protected constructor() : this(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID()
    )
}
