package kr.ai.palette.persistence.relationship

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface RelationshipStageJpaRepository : JpaRepository<RelationshipStageEntity, UUID> {
    fun findByRequestId(requestId: UUID): RelationshipStageEntity?

    @Modifying
    @Query("DELETE FROM RelationshipStageEntity r WHERE r.requestId = :requestId")
    fun deleteByRequestId(requestId: UUID)
}
