package kr.ai.palette.persistence.billing

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface TipTransactionJpaRepository : JpaRepository<TipTransactionEntity, Long> {
    fun findByFromUserIdOrderByCreatedAtDesc(fromUserId: String): List<TipTransactionEntity>
    fun findByToUserIdOrderByCreatedAtDesc(toUserId: String): List<TipTransactionEntity>
}
