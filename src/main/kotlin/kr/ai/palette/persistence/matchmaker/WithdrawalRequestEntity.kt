package kr.ai.palette.persistence.matchmaker

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * 출금 요청 라이프사이클 (어뷰징 방지 — ADR 0023).
 * HOLD: 예약됨(holding period 대기) → PAID: 확정/지급 / REJECTED: 거절(예약 해제).
 * 경량 영속 엔티티 (ddl-auto=update 자동 생성).
 */
@Entity
@Table(name = "withdrawal_requests")
class WithdrawalRequestEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    var id: UUID,

    @Column(name = "matchmaker_user_id", nullable = false, columnDefinition = "BINARY(16)")
    var matchmakerUserId: UUID,

    @Column(name = "amount", nullable = false)
    var amount: Int,

    @Column(name = "status", nullable = false, length = 16)
    var status: String = "HOLD",

    @Column(name = "requested_at", nullable = false, updatable = false)
    var requestedAt: Instant = Instant.now(),

    @Column(name = "available_at", nullable = false)
    var availableAt: Instant = Instant.now(),

    @Column(name = "processed_at")
    var processedAt: Instant? = null,

    @Column(name = "note", columnDefinition = "TEXT")
    var note: String? = null,
) {
    protected constructor() : this(UUID.randomUUID(), UUID.randomUUID(), 0)
}
