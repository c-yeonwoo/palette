package kr.ai.palette.persistence.billing

import jakarta.persistence.*
import java.time.Instant

/**
 * 사용자별 티켓 잔액 (프로필 열람 + 소개 요청). ADR 0039 / 0041.
 *
 * 잔액은 두 갈래:
 *  · paid (유료 충전분)  — 만료 없음, 환불 가능 (POLICY §2)
 *  · bonus (보너스/체험권) — bonusExpiresAt 만료 후 자동 소멸
 *
 * 소비 순서: bonus 먼저 → paid (사용자에 유리하게).
 * row 미존재 시 0 으로 간주(BillingService 가 lazy 생성).
 */
@Entity
@Table(name = "user_ticket_balances")
class UserTicketBalanceEntity(
    @Id
    @Column(name = "user_id", nullable = false)
    val userId: String,

    /** 유료 충전된 프로필 열람 티켓 잔액 — 만료 없음 */
    @Column(name = "view_ticket_count", nullable = false)
    var viewTicketCount: Int = 0,

    /** 유료 충전된 소개 요청 티켓 잔액 — 만료 없음 */
    @Column(name = "intro_request_ticket_count", nullable = false)
    var introRequestTicketCount: Int = 0,

    /** 보너스/체험권 프로필 열람 티켓 (가입·친구 가입 보너스 등) — bonusExpiresAt 만료 */
    @Column(name = "bonus_view_ticket_count", nullable = false)
    var bonusViewTicketCount: Int = 0,

    /** 보너스/체험권 소개 요청 티켓 — bonusExpiresAt 만료 */
    @Column(name = "bonus_intro_request_ticket_count", nullable = false)
    var bonusIntroRequestTicketCount: Int = 0,

    /** 보너스 만료 시각 — 새 보너스 지급 시 갱신(연장), 만료 후 첫 조회시 0 reset */
    @Column(name = "bonus_expires_at")
    var bonusExpiresAt: Instant? = null,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
