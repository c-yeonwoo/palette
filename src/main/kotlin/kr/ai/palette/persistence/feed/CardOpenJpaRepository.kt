package kr.ai.palette.persistence.feed

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface CardOpenJpaRepository : JpaRepository<CardOpenEntity, UUID> {
    fun existsByViewerIdAndTargetUserId(viewerId: UUID, targetUserId: UUID): Boolean
    fun findByViewerId(viewerId: UUID): List<CardOpenEntity>
    fun deleteByViewerId(viewerId: UUID)
    fun deleteByTargetUserId(targetUserId: UUID)
}
