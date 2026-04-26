package kr.ai.palette.persistence.payment

import org.springframework.data.jpa.repository.JpaRepository

interface PaymentTransactionJpaRepository : JpaRepository<PaymentTransactionEntity, String> {
    fun findByBuyerUserIdOrderByCreatedAtDesc(buyerUserId: String): List<PaymentTransactionEntity>
}
