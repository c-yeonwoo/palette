package kr.ai.palette.persistence.matchmaker

import org.springframework.data.jpa.repository.JpaRepository
import java.time.Instant
import java.util.UUID

interface WithdrawalRequestJpaRepository : JpaRepository<WithdrawalRequestEntity, UUID> {
    fun findByMatchmakerUserIdOrderByRequestedAtDesc(matchmakerUserId: UUID): List<WithdrawalRequestEntity>

    /** 일/월 한도 계산용 — 특정 시점 이후 요청한 건 (취소 제외) */
    fun findByMatchmakerUserIdAndRequestedAtAfter(matchmakerUserId: UUID, after: Instant): List<WithdrawalRequestEntity>

    /** holding 종료 후 자동 확정 대상 */
    fun findByStatusAndAvailableAtBefore(status: String, before: Instant): List<WithdrawalRequestEntity>

    /** 상태별 목록 (운영자 검토 큐) */
    fun findByStatusOrderByRequestedAtAsc(status: String): List<WithdrawalRequestEntity>
}
