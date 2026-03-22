package kr.ai.palette.persistence.matchmaking

import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface MatchmakingRequestJpaRepository : JpaRepository<MatchmakingRequestEntity, UUID> {
    fun findByMatchmakerId(matchmakerId: UUID): List<MatchmakingRequestEntity>
    fun findByTargetUserId(targetUserId: UUID): List<MatchmakingRequestEntity>
    fun findByRequesterIdAndStatus(requesterId: UUID, status: String): List<MatchmakingRequestEntity>
    fun existsByRequesterIdAndTargetUserId(requesterId: UUID, targetUserId: UUID): Boolean
    fun findByRequesterIdAndTargetUserId(requesterId: UUID, targetUserId: UUID): MatchmakingRequestEntity?
    fun findByStatus(status: String): List<MatchmakingRequestEntity>
}
