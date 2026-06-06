package kr.ai.palette.infrastructure.config

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaker.MatchmakerRepository
import kr.ai.palette.persistence.matchmaker.WithdrawalRequestJpaRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

/**
 * 출금 holding period 종료 시 자동 확정 (ADR 0023).
 * HOLD 상태 + availableAt 경과 → pending → withdrawn 확정(PAID).
 * holding 기간 동안 운영자가 거절(REJECTED)하면 예약 해제되어 여기서 제외됨.
 * (실제 계좌 이체는 외부/수동 — 본 스케줄러는 포인트 회계 확정만 담당)
 */
@Component
class WithdrawalSettlementScheduler(
    private val withdrawalRequestJpaRepository: WithdrawalRequestJpaRepository,
    private val matchmakerRepository: MatchmakerRepository,
) {
    private val logger = LoggerFactory.getLogger(WithdrawalSettlementScheduler::class.java)

    /** 매시간 — holding 종료된 출금 확정 */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    fun settleMaturedWithdrawals() {
        val matured = withdrawalRequestJpaRepository
            .findByStatusAndAvailableAtBefore("HOLD", Instant.now())
        var settled = 0

        matured.forEach { wr ->
            val matchmaker = matchmakerRepository.findByUserId(UserId(wr.matchmakerUserId)) ?: return@forEach
            if (matchmaker.earnings.pendingPoints < wr.amount) return@forEach // 정합성 가드
            matchmakerRepository.save(
                matchmaker.copy(earnings = matchmaker.earnings.confirmWithdrawal(wr.amount))
            )
            wr.status = "PAID"
            wr.processedAt = Instant.now()
            withdrawalRequestJpaRepository.save(wr)
            settled++
        }

        if (settled > 0) logger.info("Settled $settled matured withdrawal(s)")
    }
}
