package kr.ai.palette.persistence.subscription

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface AiPassSubscriptionJpaRepository : JpaRepository<AiPassSubscriptionEntity, UUID> {
    fun findByUserId(userId: UUID): AiPassSubscriptionEntity?
    fun deleteByUserId(userId: UUID)
}
