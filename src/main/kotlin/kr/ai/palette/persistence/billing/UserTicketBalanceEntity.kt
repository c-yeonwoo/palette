package kr.ai.palette.persistence.billing

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate

/**
 * 사용자별 잔액 (물감 단위) — 단일 잔액 모델. ADR 0042 + ADR 0044 + ADR 0045 (트라이얼).
 *
 * **단위**: 1 물감 = 100원 (KRW). 모든 사용처가 동일 잔액에서 차감.
 *  · 친친 프로필 열람:   20 물감 (커피 한잔값)
 *  · 한 다리 더 건너:    30 물감 (셀프 풀 확장 인센티브)
 *  · 소개 요청:         100 물감 (등급별 분배 15~40%)
 *  · 성의 표시(팁):     10~500 물감 (주선자 90 / 플랫폼 10 분배)
 *
 * 잔액은 두 갈래:
 *  · paidPoints   — 유료 충전분 (만료 없음, 환불 가능 — POLICY §2)
 *  · bonusPoints  — 보너스/체험 (가입·친구 가입·마일스톤) — bonusExpiresAt 만료
 *
 * 소비 순서: bonus 먼저 → paid (사용자에 유리).
 * row 미존재 시 0 으로 간주 (BillingService 가 lazy 생성).
 *
 * **트라이얼 필드 (ADR 0045)** — 신규 가입자 어뷰징 방지 + 빠른 온보딩.
 * 모든 트라이얼 혜택은 paidPoints 안 거침 → 출금 경로 차단.
 *
 * 클래스/테이블명은 마이그레이션 부담↓ 위해 기존 명칭 유지하되,
 * 컬럼 의미는 "티켓 수" → "잔액 물감" 으로 전환됨.
 */
@Entity
@Table(name = "user_ticket_balances")
class UserTicketBalanceEntity(
    @Id
    @Column(name = "user_id", nullable = false)
    val userId: String,

    /** 유료 충전 잔액 (물감). 만료 없음. */
    @Column(name = "paid_points", nullable = false)
    var paidPoints: Int = 0,

    /** 보너스 잔액 (물감) — 가입 환영·친구 가입·마일스톤. bonusExpiresAt 만료. */
    @Column(name = "bonus_points", nullable = false)
    var bonusPoints: Int = 0,

    /** 보너스 만료 시각. null = 보너스 없음. 새 보너스 지급 시 더 늦은 만료로 갱신. */
    @Column(name = "bonus_expires_at")
    var bonusExpiresAt: Instant? = null,

    // ─── 트라이얼 필드 (ADR 0045) ───────────────────────────

    /** 프로필 열람 트라이얼 만료. null = 비활성. 기본 가입 + 3일. */
    @Column(name = "views_trial_until")
    var viewsTrialUntil: Instant? = null,

    /** 트라이얼 기간 오늘 사용한 열람 수 (일 5명 캡). */
    @Column(name = "views_used_today", nullable = false, columnDefinition = "INT DEFAULT 0")
    var viewsUsedToday: Int = 0,

    /** 일일 카운터 리셋 기준일. 다른 날짜면 viewsUsedToday=0 으로 리셋. */
    @Column(name = "views_today_reset_date")
    var viewsTodayResetDate: LocalDate? = null,

    /** 반값 묶음 트라이얼 만료. null = 비활성. 기본 가입 + 3일. */
    @Column(name = "half_price_package_until")
    var halfPricePackageUntil: Instant? = null,

    /** 반값 묶음 1회 사용 여부. true 면 트라이얼 종료. 재가입해도 효력 X. */
    @Column(name = "half_price_package_used", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    var halfPricePackageUsed: Boolean = false,

    /** 무료 소개 요청 잔여 횟수. 0 이면 정상 소비(100 물감 차감). */
    @Column(name = "free_intro_remaining", nullable = false, columnDefinition = "INT DEFAULT 0")
    var freeIntroRemaining: Int = 0,

    /** 무료 소개 요청 만료. 만료 후 잔여 회수 자동 0. */
    @Column(name = "free_intro_expires_at")
    var freeIntroExpiresAt: Instant? = null,

    /** 팔레트픽 첫달 무료 만료. null = 비활성. */
    @Column(name = "palette_pick_trial_until")
    var palettePickTrialUntil: Instant? = null,

    /** 팔레트픽 첫달 무료 사용 여부. 계정당 1회. */
    @Column(name = "palette_pick_first_used", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    var palettePickFirstUsed: Boolean = false,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
