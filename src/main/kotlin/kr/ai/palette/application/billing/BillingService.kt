package kr.ai.palette.application.billing

import kr.ai.palette.domain.billing.TicketKind
import kr.ai.palette.persistence.billing.TipTransactionEntity
import kr.ai.palette.persistence.billing.TipTransactionJpaRepository
import kr.ai.palette.persistence.billing.UserTicketBalanceEntity
import kr.ai.palette.persistence.billing.UserTicketBalanceJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

class InsufficientTicketException(val kind: TicketKind, val required: Int, val current: Int)
    : RuntimeException("티켓 부족: ${kind.name} required=$required current=$current")

/**
 * 티켓 잔액 관리 + 차감 + 옵셔널 팁 송금.
 *
 * 베타: 충전(grant)은 무료 stub. Phase 2 Toss 결제 연동 시 결제 검증 후 grant.
 *
 * SoT: domain/billing/Ticket.kt (가격·묶음 정의), POLICY §1.1·1.2b.
 */
@Service
@Transactional
class BillingService(
    private val ticketBalanceRepository: UserTicketBalanceJpaRepository,
    private val tipTransactionRepository: TipTransactionJpaRepository,
) {

    private val log = LoggerFactory.getLogger(BillingService::class.java)

    /**
     * 잔액 조회 (row 미존재 시 lazy 생성). 만료된 보너스는 0 으로 reset.
     */
    fun getOrCreateBalance(userId: String): UserTicketBalanceEntity {
        val balance = ticketBalanceRepository.findById(userId).orElseGet {
            ticketBalanceRepository.save(UserTicketBalanceEntity(userId = userId))
        }
        return expireBonusIfNeeded(balance)
    }

    /** 만료된 보너스는 조회·소비 시점에 0 으로 reset (lazy expire). */
    private fun expireBonusIfNeeded(balance: UserTicketBalanceEntity): UserTicketBalanceEntity {
        val expiresAt = balance.bonusExpiresAt ?: return balance
        if (Instant.now().isBefore(expiresAt)) return balance
        if (balance.bonusViewTicketCount == 0 && balance.bonusIntroRequestTicketCount == 0) return balance
        log.info(
            "보너스 티켓 만료 user={} view={} intro={}",
            balance.userId, balance.bonusViewTicketCount, balance.bonusIntroRequestTicketCount,
        )
        balance.bonusViewTicketCount = 0
        balance.bonusIntroRequestTicketCount = 0
        balance.bonusExpiresAt = null
        balance.updatedAt = Instant.now()
        return ticketBalanceRepository.save(balance)
    }

    /**
     * 보너스 티켓 지급 (가입 무료체험 / 친구 가입 보너스 등). ADR 0041.
     * 만료일은 기존 만료일과 새 만료일 중 늦은 쪽으로 갱신(연장 효과).
     */
    fun grantBonus(
        userId: String,
        viewTickets: Int = 0,
        introTickets: Int = 0,
        validDays: Int = 7,
        reason: String,
    ): UserTicketBalanceEntity {
        require(viewTickets >= 0 && introTickets >= 0) { "수량은 0 이상" }
        require(viewTickets + introTickets > 0) { "최소 1장 이상 지급" }
        val balance = getOrCreateBalance(userId)
        balance.bonusViewTicketCount += viewTickets
        balance.bonusIntroRequestTicketCount += introTickets
        val newExpiry = Instant.now().plusSeconds(validDays.toLong() * 86_400)
        balance.bonusExpiresAt = listOfNotNull(balance.bonusExpiresAt, newExpiry).max()
        balance.updatedAt = Instant.now()
        log.info(
            "보너스 지급 user={} +view={} +intro={} validDays={} reason={}",
            userId, viewTickets, introTickets, validDays, reason,
        )
        return ticketBalanceRepository.save(balance)
    }

    /**
     * 유료 결제 검증 통과 후 티켓 적립. PA-002.
     *
     * 멱등성: 동일 (provider, providerReceiptId) 는 PaymentTransactionEntity UNIQUE
     * constraint 로 차단 (PA-001). 호출 측이 try/catch 로 DataIntegrityViolation
     * 핸들링하면 안전.
     *
     * 결제 자체는 PaymentGateway.confirm() 가 끝낸 상태라고 가정.
     */
    fun grantPaidTickets(
        userId: String,
        kind: TicketKind,
        quantity: Int,
        provider: String,
        providerReceiptId: String,
    ): UserTicketBalanceEntity {
        require(quantity > 0) { "수량은 1 이상" }
        val balance = getOrCreateBalance(userId)
        when (kind) {
            TicketKind.VIEW -> balance.viewTicketCount += quantity
            TicketKind.INTRO_REQUEST -> balance.introRequestTicketCount += quantity
        }
        balance.updatedAt = Instant.now()
        log.info(
            "유료 티켓 적립 user={} kind={} +{} provider={} receipt={}",
            userId, kind, quantity, provider, providerReceiptId,
        )
        return ticketBalanceRepository.save(balance)
    }

    /**
     * 베타용 무료 충전 — 결제 검증 없이 잔액만 증가.
     * Phase 2: PaymentGateway 검증 통과 후에만 이 메서드 호출.
     */
    fun grantTickets(userId: String, kind: TicketKind, quantity: Int): UserTicketBalanceEntity {
        require(quantity > 0) { "충전 수량은 1 이상" }
        val balance = getOrCreateBalance(userId)
        when (kind) {
            TicketKind.VIEW -> balance.viewTicketCount += quantity
            TicketKind.INTRO_REQUEST -> balance.introRequestTicketCount += quantity
        }
        balance.updatedAt = Instant.now()
        log.info("티켓 충전(stub) user={} kind={} +{} (new total={})",
            userId, kind, quantity,
            if (kind == TicketKind.VIEW) balance.viewTicketCount else balance.introRequestTicketCount)
        return ticketBalanceRepository.save(balance)
    }

    /**
     * 티켓 차감. 보너스 → 유료 순서로 소비 (사용자에 유리).
     * 잔액 부족 시 [InsufficientTicketException] — 호출 측에서 결제 화면 유도.
     */
    fun consume(userId: String, kind: TicketKind, quantity: Int = 1) {
        require(quantity > 0) { "차감 수량은 1 이상" }
        val balance = getOrCreateBalance(userId)  // expireBonusIfNeeded 포함
        val bonus = when (kind) {
            TicketKind.VIEW -> balance.bonusViewTicketCount
            TicketKind.INTRO_REQUEST -> balance.bonusIntroRequestTicketCount
        }
        val paid = when (kind) {
            TicketKind.VIEW -> balance.viewTicketCount
            TicketKind.INTRO_REQUEST -> balance.introRequestTicketCount
        }
        val total = bonus + paid
        if (total < quantity) throw InsufficientTicketException(kind, quantity, total)

        val fromBonus = minOf(bonus, quantity)
        val fromPaid = quantity - fromBonus
        when (kind) {
            TicketKind.VIEW -> {
                balance.bonusViewTicketCount -= fromBonus
                balance.viewTicketCount -= fromPaid
            }
            TicketKind.INTRO_REQUEST -> {
                balance.bonusIntroRequestTicketCount -= fromBonus
                balance.introRequestTicketCount -= fromPaid
            }
        }
        balance.updatedAt = Instant.now()
        ticketBalanceRepository.save(balance)
        log.info("티켓 차감 user={} kind={} -{}(bonus={} paid={})", userId, kind, quantity, fromBonus, fromPaid)
    }

    /**
     * 티켓 환불(잔액 복귀). 주선자 거절 등 자동 환불 케이스 호출 지점.
     * POLICY §2.1·§2.2 참조.
     */
    fun refund(userId: String, kind: TicketKind, quantity: Int = 1) =
        grantTickets(userId, kind, quantity).also {
            log.info("티켓 환불 user={} kind={} +{}", userId, kind, quantity)
        }

    /**
     * 성의 표시(옵셔널 tip) 송금. 강제 아님 — 사용자가 자발적으로 호출.
     * 베타: 결제 미연동 — 거래 이력만 기록.
     */
    fun sendTip(fromUserId: String, toUserId: String, amountPoints: Int, reason: String): TipTransactionEntity {
        require(amountPoints in 1_000..10_000) { "팁은 1,000~10,000P 범위" }
        require(fromUserId != toUserId) { "자기 자신에게 팁 송금 불가" }
        val tx = tipTransactionRepository.save(
            TipTransactionEntity(
                fromUserId = fromUserId,
                toUserId = toUserId,
                amountPoints = amountPoints,
                reason = reason,
            )
        )
        log.info("팁 송금 from={} to={} amount={}P reason={}", fromUserId, toUserId, amountPoints, reason)
        return tx
    }
}
