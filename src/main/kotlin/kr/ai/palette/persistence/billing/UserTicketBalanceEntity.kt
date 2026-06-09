package kr.ai.palette.persistence.billing

import jakarta.persistence.*
import java.time.Instant

/**
 * 사용자별 잔액 (P 단위) — 단일 잔액 모델. ADR 0042 (구 0039 폐기).
 *
 * **단위**: 1P = 10원 (KRW). 모든 사용처가 동일 잔액에서 차감.
 *  · 친친 프로필 열람:   100P
 *  · 한 다리 더 건너:    200P
 *  · 소개 요청:          300P
 *  · 성의 표시(팁):      100~1,000P (자유)
 *
 * 잔액은 두 갈래:
 *  · paidPoints   — 유료 충전분 (만료 없음, 환불 가능 — POLICY §2)
 *  · bonusPoints  — 보너스/체험 (가입·친구 가입·마일스톤) — bonusExpiresAt 만료
 *
 * 소비 순서: bonus 먼저 → paid (사용자에 유리).
 * row 미존재 시 0 으로 간주 (BillingService 가 lazy 생성).
 *
 * 클래스/테이블명은 마이그레이션 부담↓ 위해 기존 명칭 유지하되,
 * 컬럼 의미는 "티켓 수" → "잔액 P" 로 전환됨.
 */
@Entity
@Table(name = "user_ticket_balances")
class UserTicketBalanceEntity(
    @Id
    @Column(name = "user_id", nullable = false)
    val userId: String,

    /** 유료 충전 잔액 (P). 만료 없음. */
    @Column(name = "paid_points", nullable = false)
    var paidPoints: Int = 0,

    /** 보너스 잔액 (P) — 가입 환영·친구 가입·마일스톤. bonusExpiresAt 만료. */
    @Column(name = "bonus_points", nullable = false)
    var bonusPoints: Int = 0,

    /** 보너스 만료 시각. null = 보너스 없음. 새 보너스 지급 시 더 늦은 만료로 갱신. */
    @Column(name = "bonus_expires_at")
    var bonusExpiresAt: Instant? = null,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
