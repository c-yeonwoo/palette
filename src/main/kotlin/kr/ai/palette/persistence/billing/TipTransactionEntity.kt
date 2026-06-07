package kr.ai.palette.persistence.billing

import jakarta.persistence.*
import java.time.Instant

/**
 * 성의 표시 (옵셔널 tip) 송금 이력. ADR 0039.
 *
 * 사용자(from) → 주선자(to) 1회 송금. 매칭 알고리즘에 미반영.
 * 베타: 결제 미연동 → amountPoints 만큼 가상 차감/적립.
 *
 * reason 예: "match_request_optional_tip", "after_match_success_tip".
 */
@Entity
@Table(
    name = "tip_transactions",
    indexes = [
        Index(name = "idx_tip_from", columnList = "from_user_id"),
        Index(name = "idx_tip_to", columnList = "to_user_id"),
    ],
)
class TipTransactionEntity(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "from_user_id", nullable = false)
    val fromUserId: String,

    @Column(name = "to_user_id", nullable = false)
    val toUserId: String,

    @Column(name = "amount_points", nullable = false)
    val amountPoints: Int,

    @Column(name = "reason", nullable = false, length = 64)
    val reason: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
)
