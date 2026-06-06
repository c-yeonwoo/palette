package kr.ai.palette.persistence.safety

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface BlockJpaRepository : JpaRepository<BlockEntity, UUID> {
    fun findByBlockerUserIdOrBlockedUserId(blockerUserId: UUID, blockedUserId: UUID): List<BlockEntity>
    fun findByBlockerUserId(blockerUserId: UUID): List<BlockEntity>
    fun existsByBlockerUserIdAndBlockedUserId(blockerUserId: UUID, blockedUserId: UUID): Boolean
    fun deleteByBlockerUserIdAndBlockedUserId(blockerUserId: UUID, blockedUserId: UUID)
}
