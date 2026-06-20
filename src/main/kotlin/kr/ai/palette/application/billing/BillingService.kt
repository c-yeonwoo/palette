package kr.ai.palette.application.billing

import kr.ai.palette.domain.billing.PointPrice
import kr.ai.palette.domain.billing.TipDistribution
import java.time.LocalDate
import java.time.ZoneId
import kr.ai.palette.persistence.billing.TipTransactionEntity
import kr.ai.palette.persistence.billing.TipTransactionJpaRepository
import kr.ai.palette.persistence.billing.UserTicketBalanceEntity
import kr.ai.palette.persistence.billing.UserTicketBalanceJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

/**
 * 잔액 부족 — 호출 측에서 결제 화면 유도 분기에 사용. ADR 0042.
 *
 * @param required 필요 P, @param current 현재 보유 P (보너스 + 유료 합산)
 */
class InsufficientBalanceException(val required: Int, val current: Int)
    : RuntimeException("물감 부족: required=${required} current=${current}")

/**
 * 트라이얼 정책 상수 SoT. ADR 0045 (신규 트라이얼 시스템).
 *
 * 단위는 일(day). 모든 정책값은 application.yml 로 override 가능 (운영 튜닝).
 */
object TrialPolicy {
    /** 프로필 열람 트라이얼 기간 (일) */
    const val VIEWS_TRIAL_DAYS: Long = 3

    /** 프로필 열람 트라이얼 일일 캡 (명) */
    const val VIEWS_PER_DAY_CAP: Int = 5

    /** 반값 묶음 트라이얼 기간 (일) */
    const val HALF_PRICE_TRIAL_DAYS: Long = 3

    /** 무료 소개 요청 횟수 */
    const val FREE_INTRO_REQUESTS: Int = 1

    /** 무료 소개 요청 만료 (일) */
    const val FREE_INTRO_EXPIRES_DAYS: Long = 7

    /** 팔레트픽 첫달 무료 기간 (일) */
    const val PALETTE_PICK_TRIAL_DAYS: Long = 30

    /** 출금 자격 — 가입 후 최소 일수 (ADR 0033 강화) */
    const val WITHDRAWAL_MIN_AGE_DAYS: Long = 30

    /** 한국 타임존 (일일 카운터 리셋 기준) */
    val KST: ZoneId = ZoneId.of("Asia/Seoul")
}

/**
 * 잔액 (P) 관리 + 차감 + 충전 + 옵셔널 팁. ADR 0042 (단일 잔액 모델).
 *
 * 모든 결제는 단일 잔액에서 처리. 1P = 10원.
 * 소비 순서: bonus → paid (사용자에 유리).
 *
 * SoT: domain/billing/Ticket.kt (PointPrice·PointBundleCatalog).
 */
@Service
@Transactional
class BillingService(
    private val balanceRepository: UserTicketBalanceJpaRepository,
    private val tipTransactionRepository: TipTransactionJpaRepository,
) {

    private val log = LoggerFactory.getLogger(BillingService::class.java)

    /**
     * 잔액 조회 (row 미존재 시 lazy 생성). 만료된 보너스는 0 으로 reset.
     */
    fun getOrCreateBalance(userId: String): UserTicketBalanceEntity {
        val balance = balanceRepository.findById(userId).orElseGet {
            balanceRepository.save(UserTicketBalanceEntity(userId = userId))
        }
        return expireBonusIfNeeded(balance)
    }

    /** 만료된 보너스는 조회·소비 시점에 0 으로 reset (lazy expire). */
    private fun expireBonusIfNeeded(balance: UserTicketBalanceEntity): UserTicketBalanceEntity {
        val expiresAt = balance.bonusExpiresAt ?: return balance
        if (Instant.now().isBefore(expiresAt)) return balance
        if (balance.bonusPoints == 0) return balance
        log.info("보너스 만료 user={} expired={}P", balance.userId, balance.bonusPoints)
        balance.bonusPoints = 0
        balance.bonusExpiresAt = null
        balance.updatedAt = Instant.now()
        return balanceRepository.save(balance)
    }

    /** 총 잔액 (보너스 + 유료). */
    fun totalPoints(balance: UserTicketBalanceEntity): Int =
        balance.bonusPoints + balance.paidPoints

    // ─── 충전 / 적립 ─────────────────────────────────────────

    /**
     * 보너스 잔액 지급 (가입 환영 / 친구 가입 / 마일스톤 등). ADR 0042.
     * 만료일은 기존 vs 새 만료일 중 늦은 쪽으로 갱신.
     *
     * @param points  지급 P (1P = 10원)
     * @param validDays 만료까지 일수. null = 무기한 (마일스톤 등)
     */
    fun grantBonus(
        userId: String,
        points: Int,
        validDays: Int? = null,
        reason: String,
    ): UserTicketBalanceEntity {
        require(points > 0) { "지급 P 는 1 이상" }
        val balance = getOrCreateBalance(userId)
        balance.bonusPoints += points
        if (validDays != null) {
            val newExpiry = Instant.now().plusSeconds(validDays.toLong() * 86_400)
            balance.bonusExpiresAt = listOfNotNull(balance.bonusExpiresAt, newExpiry).max()
        }
        balance.updatedAt = Instant.now()
        log.info("보너스 지급 user={} +{}P validDays={} reason={}", userId, points, validDays, reason)
        return balanceRepository.save(balance)
    }

    /**
     * 유료 결제 검증 통과 후 잔액 적립. PA-002.
     * 멱등성은 PaymentTransaction UNIQUE constraint 가 차단 (PA-001).
     */
    fun creditPaidPoints(
        userId: String,
        points: Int,
        provider: String,
        providerReceiptId: String,
    ): UserTicketBalanceEntity {
        require(points > 0) { "충전 P 는 1 이상" }
        val balance = getOrCreateBalance(userId)
        balance.paidPoints += points
        balance.updatedAt = Instant.now()
        log.info("유료 잔액 적립 user={} +{}P provider={} receipt={}", userId, points, provider, providerReceiptId)
        return balanceRepository.save(balance)
    }

    // ─── 소비 / 환불 ─────────────────────────────────────────

    /**
     * 잔액 차감. 보너스 → 유료 순서 (사용자에 유리).
     * 잔액 부족 시 [InsufficientBalanceException] — 호출 측에서 결제 유도.
     *
     * @param reason 소비 사유 (감사 로그용) — 예: "view_friend_of_friend", "intro_request"
     */
    fun consume(userId: String, points: Int, reason: String) {
        require(points > 0) { "차감 P 는 1 이상" }
        val balance = getOrCreateBalance(userId)
        val total = totalPoints(balance)
        if (total < points) throw InsufficientBalanceException(required = points, current = total)

        val fromBonus = minOf(balance.bonusPoints, points)
        val fromPaid = points - fromBonus
        balance.bonusPoints -= fromBonus
        balance.paidPoints -= fromPaid
        balance.updatedAt = Instant.now()
        balanceRepository.save(balance)
        log.info(
            "잔액 차감 user={} -{}P (bonus={} paid={}) reason={}",
            userId, points, fromBonus, fromPaid, reason,
        )
    }

    /**
     * 환불 (잔액 복귀). 주선자 거절 등 자동 환불 케이스. POLICY §2 참조.
     * 환불은 항상 paidPoints 로 복귀 (보너스→유료 소비 순서의 역으로).
     * 베타 단계엔 정확한 출처 추적 X — 정식엔 PaymentTransaction 참조해 정확히.
     */
    fun refund(userId: String, points: Int, reason: String): UserTicketBalanceEntity {
        require(points > 0) { "환불 P 는 1 이상" }
        val balance = getOrCreateBalance(userId)
        balance.paidPoints += points
        balance.updatedAt = Instant.now()
        log.info("환불 user={} +{}P reason={}", userId, points, reason)
        return balanceRepository.save(balance)
    }

    /**
     * 결제 환불 — 충전됐던 물감을 잔액에서 차감 (반대 방향). ADR 0044 + POLICY §2.
     *
     * 차감 순서: paidPoints 우선 → 부족분은 bonusPoints (소비 후 환불 케이스 보호).
     * 결과 lock: 음수로 떨어지지 않도록 0 으로 클램프.
     *
     * @return 차감 결과 (paid·bonus 실차감액 + 새 잔액)
     */
    fun refundCharge(userId: String, points: Int, reason: String): RefundChargeResult {
        require(points > 0) { "환불 차감 P 는 1 이상" }
        val balance = getOrCreateBalance(userId)
        val fromPaid = minOf(balance.paidPoints, points)
        val fromBonus = minOf(balance.bonusPoints, points - fromPaid)
        balance.paidPoints -= fromPaid
        balance.bonusPoints -= fromBonus
        balance.updatedAt = Instant.now()
        balanceRepository.save(balance)
        log.info(
            "결제 환불 차감 user={} -{}P (paid={}, bonus={}) reason={}",
            userId, points, fromPaid, fromBonus, reason,
        )
        return RefundChargeResult(
            deductedFromPaid = fromPaid,
            deductedFromBonus = fromBonus,
            newPaidBalance = balance.paidPoints,
            newBonusBalance = balance.bonusPoints,
        )
    }

    data class RefundChargeResult(
        val deductedFromPaid: Int,
        val deductedFromBonus: Int,
        val newPaidBalance: Int,
        val newBonusBalance: Int,
    )

    // ─── 내 색 리포트 잠금 해제 (ADR 0069) ──────────────────

    /** 내 심층 리포트 잠금 해제 여부. */
    fun isReportUnlocked(userId: String): Boolean = getOrCreateBalance(userId).reportUnlocked

    /**
     * 내 색 심층 리포트 잠금 해제. 물감 [cost] 차감 후 영구 해제 마킹.
     * 이미 해제 상태면 **재차감 없이** 통과(멱등). 잔액 부족 시 [InsufficientBalanceException].
     */
    fun unlockColorReport(userId: String, cost: Int): UserTicketBalanceEntity {
        val balance = getOrCreateBalance(userId)
        if (balance.reportUnlocked) return balance
        consume(userId, cost, reason = "color_report_unlock")   // 잔액 부족 시 throw
        balance.reportUnlocked = true
        balance.updatedAt = Instant.now()
        return balanceRepository.save(balance)
    }

    // ─── 팁 (옵셔널 송금) ────────────────────────────────────

    /**
     * 성의 표시(옵셔널 tip) 송금. ADR 0044 §3 — 90/10 분배.
     *
     * fromUser 에서 amount 전액 차감 → toUser 에 90% 적립 → 플랫폼 10% 수수료 (감사 로그만).
     * 플랫폼 수수료가 있어야 외부 송금 어뷰징 인센티브 ↓ (ADR 0046).
     */
    fun sendTip(fromUserId: String, toUserId: String, amountPoints: Int, reason: String): TipTransactionEntity {
        require(amountPoints in PointPrice.TIP_MIN..PointPrice.TIP_MAX) {
            "팁은 ${PointPrice.TIP_MIN}~${PointPrice.TIP_MAX} 물감 범위"
        }
        require(fromUserId != toUserId) { "자기 자신에게 팁 송금 불가" }

        val matchmakerShare = TipDistribution.matchmakerShare(amountPoints)
        val platformFee = TipDistribution.platformFee(amountPoints)

        // 1) 보내는 사람 차감 (전액)
        consume(fromUserId, amountPoints, reason = "tip_to:$toUserId")

        // 2) 받는 사람 적립 — 90% 만 (paidPoints, 출금 가능)
        val receiver = getOrCreateBalance(toUserId)
        receiver.paidPoints += matchmakerShare
        receiver.updatedAt = Instant.now()
        balanceRepository.save(receiver)

        // 3) 거래 이력 — 분배 정합성 (matchmaker + platform == amount) 보장
        val tx = tipTransactionRepository.save(
            TipTransactionEntity(
                fromUserId = fromUserId,
                toUserId = toUserId,
                amountPoints = amountPoints,
                matchmakerCredited = matchmakerShare,
                platformFee = platformFee,
                reason = reason,
            )
        )
        log.info(
            "팁 송금 from={} to={} amount={}P (주선자 {}P / 플랫폼 {}P) reason={}",
            fromUserId, toUserId, amountPoints, matchmakerShare, platformFee, reason,
        )
        return tx
    }

    // ─── 트라이얼 시스템 (ADR 0045) ──────────────────────────

    /**
     * 신규 가입자 트라이얼 상태 초기화. ADR 0045.
     * 가입 hook 에서 1회 호출 (WelcomeBonusService.grantSignupBonus 와 함께).
     */
    fun initializeTrial(userId: String, now: Instant = Instant.now()) {
        val balance = getOrCreateBalance(userId)
        balance.viewsTrialUntil = now.plusSeconds(TrialPolicy.VIEWS_TRIAL_DAYS * 86_400)
        balance.viewsUsedToday = 0
        balance.viewsTodayResetDate = LocalDate.now(TrialPolicy.KST)
        balance.halfPricePackageUntil = now.plusSeconds(TrialPolicy.HALF_PRICE_TRIAL_DAYS * 86_400)
        balance.halfPricePackageUsed = false
        balance.freeIntroRemaining = TrialPolicy.FREE_INTRO_REQUESTS
        balance.freeIntroExpiresAt = now.plusSeconds(TrialPolicy.FREE_INTRO_EXPIRES_DAYS * 86_400)
        balance.palettePickTrialUntil = now.plusSeconds(TrialPolicy.PALETTE_PICK_TRIAL_DAYS * 86_400)
        balance.palettePickFirstUsed = false
        balance.updatedAt = now
        balanceRepository.save(balance)
        log.info("트라이얼 초기화 user={} viewsTrialUntil={} freeIntro={}건 palettePickTrialUntil={}",
            userId, balance.viewsTrialUntil, balance.freeIntroRemaining, balance.palettePickTrialUntil)
    }

    /**
     * 프로필 열람 트라이얼 사용 가능 여부 (3일 + 일 [TrialPolicy.VIEWS_PER_DAY_CAP] 명). ADR 0045.
     *
     * 호출 측에서 [tryConsumeFreeView] 로 실제 사용 처리.
     * @return true 면 무료 열람 가능
     */
    fun canUseFreeView(userId: String): Boolean {
        val balance = getOrCreateBalance(userId)
        val until = balance.viewsTrialUntil ?: return false
        if (Instant.now().isAfter(until)) return false
        val today = LocalDate.now(TrialPolicy.KST)
        val usedToday = if (balance.viewsTodayResetDate == today) balance.viewsUsedToday else 0
        return usedToday < TrialPolicy.VIEWS_PER_DAY_CAP
    }

    /**
     * 무료 열람 1회 차감 시도. ADR 0045. 잔액 자체는 건드리지 않음 (트라이얼 외 상황은 호출 측 결정).
     * @return true 면 트라이얼로 처리 (호출 측에서 잔액 consume 스킵)
     */
    fun tryConsumeFreeView(userId: String): Boolean {
        val balance = getOrCreateBalance(userId)
        val until = balance.viewsTrialUntil ?: return false
        if (Instant.now().isAfter(until)) return false
        val today = LocalDate.now(TrialPolicy.KST)
        if (balance.viewsTodayResetDate != today) {
            balance.viewsUsedToday = 0
            balance.viewsTodayResetDate = today
        }
        if (balance.viewsUsedToday >= TrialPolicy.VIEWS_PER_DAY_CAP) return false
        balance.viewsUsedToday += 1
        balance.updatedAt = Instant.now()
        balanceRepository.save(balance)
        log.info("무료 열람 사용 user={} usedToday={}/{}", userId, balance.viewsUsedToday, TrialPolicy.VIEWS_PER_DAY_CAP)
        return true
    }

    /** 반값 묶음 트라이얼 자격 여부 (3일 + 미사용 + 110물감 묶음). ADR 0045. */
    fun canUseHalfPriceBundle(userId: String, pointsCredited: Int): Boolean {
        if (pointsCredited != kr.ai.palette.domain.billing.PointBundleCatalog.TRIAL_HALF_PRICE_BUNDLE_POINTS) return false
        val balance = getOrCreateBalance(userId)
        if (balance.halfPricePackageUsed) return false
        val until = balance.halfPricePackageUntil ?: return false
        return !Instant.now().isAfter(until)
    }

    /** 반값 묶음 사용 마킹 — confirmCheckout 성공 시 호출. */
    fun markHalfPriceBundleUsed(userId: String) {
        val balance = getOrCreateBalance(userId)
        balance.halfPricePackageUsed = true
        balance.updatedAt = Instant.now()
        balanceRepository.save(balance)
        log.info("반값 묶음 사용 완료 user={}", userId)
    }

    /** 무료 소개 요청 자격 여부 (잔여 회수 + 미만료). ADR 0045. */
    fun canUseFreeIntroRequest(userId: String): Boolean {
        val balance = getOrCreateBalance(userId)
        if (balance.freeIntroRemaining <= 0) return false
        val until = balance.freeIntroExpiresAt ?: return false
        return !Instant.now().isAfter(until)
    }

    /**
     * 무료 소개 요청 1회 차감. 호출 측에서 동일 주선자 1회 가드는 별도 처리.
     * @return true 면 트라이얼로 처리 (잔액 consume 스킵)
     */
    fun tryConsumeFreeIntroRequest(userId: String): Boolean {
        val balance = getOrCreateBalance(userId)
        if (balance.freeIntroRemaining <= 0) return false
        val until = balance.freeIntroExpiresAt ?: return false
        if (Instant.now().isAfter(until)) return false
        balance.freeIntroRemaining -= 1
        balance.updatedAt = Instant.now()
        balanceRepository.save(balance)
        log.info("무료 소개 요청 사용 user={} remaining={}", userId, balance.freeIntroRemaining)
        return true
    }

    /** 팔레트픽 첫달 무료 활성 여부 (계정당 1회). ADR 0045. */
    fun isPalettePickTrialActive(userId: String): Boolean {
        val balance = getOrCreateBalance(userId)
        val until = balance.palettePickTrialUntil ?: return false
        return !Instant.now().isAfter(until)
    }

    /** 팔레트픽 첫달 무료 사용 완료 마킹 — 결제 진입 시 호출. */
    fun markPalettePickFirstUsed(userId: String) {
        val balance = getOrCreateBalance(userId)
        balance.palettePickFirstUsed = true
        balance.updatedAt = Instant.now()
        balanceRepository.save(balance)
    }
}
