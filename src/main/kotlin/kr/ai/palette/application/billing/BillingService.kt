package kr.ai.palette.application.billing

import kr.ai.palette.domain.billing.PointPrice
import kr.ai.palette.domain.billing.TipDistribution
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
}
