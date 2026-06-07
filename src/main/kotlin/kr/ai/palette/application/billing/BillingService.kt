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

    /** 잔액 조회 (row 미존재 시 0/0 으로 lazy 생성 후 반환). */
    fun getOrCreateBalance(userId: String): UserTicketBalanceEntity =
        ticketBalanceRepository.findById(userId).orElseGet {
            ticketBalanceRepository.save(UserTicketBalanceEntity(userId = userId))
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
     * 티켓 차감. 잔액 부족 시 [InsufficientTicketException].
     * 호출 측에서 try/catch 로 결제 화면 유도 분기.
     */
    fun consume(userId: String, kind: TicketKind, quantity: Int = 1) {
        require(quantity > 0) { "차감 수량은 1 이상" }
        val balance = getOrCreateBalance(userId)
        val current = when (kind) {
            TicketKind.VIEW -> balance.viewTicketCount
            TicketKind.INTRO_REQUEST -> balance.introRequestTicketCount
        }
        if (current < quantity) throw InsufficientTicketException(kind, quantity, current)
        when (kind) {
            TicketKind.VIEW -> balance.viewTicketCount -= quantity
            TicketKind.INTRO_REQUEST -> balance.introRequestTicketCount -= quantity
        }
        balance.updatedAt = Instant.now()
        ticketBalanceRepository.save(balance)
        log.info("티켓 차감 user={} kind={} -{}", userId, kind, quantity)
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
