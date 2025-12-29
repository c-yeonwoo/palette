package kr.ai.palette.domain.matchmaking

import kr.ai.palette.domain.common.UserId

interface MatchmakingRequestRepository {
    fun save(request: MatchmakingRequest): MatchmakingRequest
    fun findById(id: MatchmakingRequestId): MatchmakingRequest?
    fun findByMatchmakerId(matchmakerId: UserId): List<MatchmakingRequest>
    fun findByTargetUserId(targetUserId: UserId): List<MatchmakingRequest>
    fun findByRequesterIdAndStatus(requesterId: UserId, status: MatchmakingRequestStatus): List<MatchmakingRequest>
    fun existsByRequesterIdAndTargetUserId(requesterId: UserId, targetUserId: UserId): Boolean
    fun findByRequesterIdAndTargetUserId(requesterId: UserId, targetUserId: UserId): MatchmakingRequest?
    fun findAll(): List<MatchmakingRequest>
}
