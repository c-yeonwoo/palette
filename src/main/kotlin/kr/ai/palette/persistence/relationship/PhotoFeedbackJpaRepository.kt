package kr.ai.palette.persistence.relationship

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface PhotoFeedbackJpaRepository : JpaRepository<PhotoFeedbackEntity, UUID> {
    fun findByRequestId(requestId: UUID): List<PhotoFeedbackEntity>
    fun findByRequestIdAndUserId(requestId: UUID, userId: String): PhotoFeedbackEntity?

    @Modifying
    @Query("DELETE FROM PhotoFeedbackEntity p WHERE p.requestId = :requestId")
    fun deleteByRequestId(requestId: UUID)
}
