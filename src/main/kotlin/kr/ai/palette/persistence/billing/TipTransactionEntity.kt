package kr.ai.palette.persistence.billing

import jakarta.persistence.*
import java.time.Instant

/**
 * 성의 표시 (옵셔널 tip) 송금 이력. ADR 0039 → ADR 0044 (90/10 분배).
 *
 * 사용자(from) → 주선자(to) 1회 송금. 매칭 알고리즘에 미반영.
 * 베타: 결제 미연동 → amountPoints 만큼 가상 차감/적립.
 *
 * 분배 (ADR 0044 §3):
 *   - matchmakerCredited = amountPoints × 0.9 (주선자 paidPoints 적립, 출금 가능)
 *   - platformFee        = amountPoints × 0.1 (플랫폼 수수료 매출 — 외부 송금 어뷰징 방어 인센티브)
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

    /** 송금 총액 (보내는 사람 차감 P). ADR 0044 — 10~500 물감 범위. */
    @Column(name = "amount_points", nullable = false)
    val amountPoints: Int,

    /** 주선자 실수령 P (= amountPoints × 0.9). ADR 0044 §3. */
    @Column(name = "matchmaker_credited", nullable = false, columnDefinition = "INT DEFAULT 0")
    val matchmakerCredited: Int = 0,

    /** 플랫폼 수수료 P (= amountPoints × 0.1). 정합성: amountPoints = matchmakerCredited + platformFee. */
    @Column(name = "platform_fee", nullable = false, columnDefinition = "INT DEFAULT 0")
    val platformFee: Int = 0,

    @Column(name = "reason", nullable = false, length = 64)
    val reason: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),
)
