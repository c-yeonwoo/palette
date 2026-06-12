package kr.ai.palette.persistence.relationship

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface MeetingFeedbackJpaRepository : JpaRepository<MeetingFeedbackEntity, UUID> {
    fun findByRequestIdAndUserId(requestId: UUID, userId: String): MeetingFeedbackEntity?
    fun findByRequestId(requestId: UUID): List<MeetingFeedbackEntity>
}
