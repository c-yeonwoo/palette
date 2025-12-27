package kr.ai.palette.persistence.matchmaking

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import org.springframework.stereotype.Component

@Component
class MatchmakingRequestMapper {
    fun toDomain(entity: MatchmakingRequestEntity): MatchmakingRequest {
        return MatchmakingRequest(
            id = MatchmakingRequestId(entity.id),
            requesterId = UserId(entity.requesterId),
            targetUserId = UserId(entity.targetUserId),
            matchmakerId = UserId(entity.matchmakerId),
            message = entity.message,
            status = MatchmakingRequestStatus.valueOf(entity.status),
            createdAt = entity.createdAt,
            updatedAt = entity.updatedAt
        )
    }

    fun toEntity(domain: MatchmakingRequest): MatchmakingRequestEntity {
        return MatchmakingRequestEntity(
            id = domain.id.value,
            requesterId = domain.requesterId.value,
            targetUserId = domain.targetUserId.value,
            matchmakerId = domain.matchmakerId.value,
            message = domain.message,
            status = domain.status.name,
            createdAt = domain.createdAt,
            updatedAt = domain.updatedAt
        )
    }
}
