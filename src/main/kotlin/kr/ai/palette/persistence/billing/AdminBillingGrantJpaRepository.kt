package kr.ai.palette.persistence.billing

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

/**
 * 어드민 수동 충전 audit log 조회.
 *
 * 정렬: granted_at DESC (최신 우선).
 * 필터:
 *  · 전체 — findAllByOrderByGrantedAtDesc
 *  · 수신자별 — findByRecipientUserIdOrderByGrantedAtDesc
 */
interface AdminBillingGrantJpaRepository : JpaRepository<AdminBillingGrantEntity, UUID> {

    fun findAllByOrderByGrantedAtDesc(pageable: Pageable): Page<AdminBillingGrantEntity>

    fun findByRecipientUserIdOrderByGrantedAtDesc(
        recipientUserId: String,
        pageable: Pageable,
    ): Page<AdminBillingGrantEntity>
}
