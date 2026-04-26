package kr.ai.palette.persistence.payment

import org.springframework.data.jpa.repository.JpaRepository

interface PaidViewJpaRepository : JpaRepository<PaidViewEntity, Long> {
    fun existsByBuyerUserIdAndTargetUserId(buyerUserId: String, targetUserId: String): Boolean
}
