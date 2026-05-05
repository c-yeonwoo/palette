package kr.ai.palette.domain.matchmaking

import kr.ai.palette.domain.common.UserId

interface MatchmakingRequestRepository {
    fun save(request: MatchmakingRequest): MatchmakingRequest
    fun findById(id: MatchmakingRequestId): MatchmakingRequest?
    fun findByMatchmakerId(matchmakerId: UserId): List<MatchmakingRequest>
    fun findByTargetUserId(targetUserId: UserId): List<MatchmakingRequest>
    fun findByRequesterId(requesterId: UserId): List<MatchmakingRequest>
    fun findByRequesterIdAndStatus(requesterId: UserId, status: MatchmakingRequestStatus): List<MatchmakingRequest>
    fun existsByRequesterIdAndTargetUserId(requesterId: UserId, targetUserId: UserId): Boolean
    fun findByRequesterIdAndTargetUserId(requesterId: UserId, targetUserId: UserId): MatchmakingRequest?
    /** Returns all requests where userId is either the requester or the target. */
    fun findByRequesterOrTarget(userId: UserId): List<MatchmakingRequest>
    /** Returns the most recent COMPLETED request by this requester (for cooltime check). */
    fun findLatestCompletedByRequesterId(requesterId: UserId): MatchmakingRequest?
    fun findAll(): List<MatchmakingRequest>
    fun findByStatus(status: MatchmakingRequestStatus): List<MatchmakingRequest>
}
