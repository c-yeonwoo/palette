package kr.ai.palette.persistence.matchmaking

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.*
import org.springframework.stereotype.Component

@Component
class MatchmakingRequestMapper {
    fun toDomain(entity: MatchmakingRequestEntity): MatchmakingRequest {
        // Map matchmaker decision from entity fields
        val matchmakerDecidedAt = entity.matchmakerDecidedAt
        val matchmakerApproved = entity.matchmakerApproved
        val matchmakerDecision = if (matchmakerDecidedAt != null && matchmakerApproved != null) {
            MatchmakerDecision(
                decidedAt = matchmakerDecidedAt,
                message = entity.matchmakerMessage,
                approved = matchmakerApproved
            )
        } else null

        // Map target user decision from entity fields
        val targetDecidedAt = entity.targetDecidedAt
        val targetAccepted = entity.targetAccepted
        val targetUserDecision = if (targetDecidedAt != null && targetAccepted != null) {
            TargetUserDecision(
                decidedAt = targetDecidedAt,
                message = entity.targetMessage,
                accepted = targetAccepted
            )
        } else null

        return MatchmakingRequest(
            id = MatchmakingRequestId(entity.id),
            requesterId = UserId(entity.requesterId),
            targetUserId = UserId(entity.targetUserId),
            matchmakerId = UserId(entity.matchmakerId),
            requesterMessage = entity.requesterMessage,
            matchmakerDecision = matchmakerDecision,
            targetUserDecision = targetUserDecision,
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
            requesterMessage = domain.requesterMessage,
            // Matchmaker decision
            matchmakerDecidedAt = domain.matchmakerDecision?.decidedAt,
            matchmakerMessage = domain.matchmakerDecision?.message,
            matchmakerApproved = domain.matchmakerDecision?.approved,
            // Target user decision
            targetDecidedAt = domain.targetUserDecision?.decidedAt,
            targetMessage = domain.targetUserDecision?.message,
            targetAccepted = domain.targetUserDecision?.accepted,
            // Status and timestamps
            status = domain.status.name,
            createdAt = domain.createdAt,
            updatedAt = domain.updatedAt
        )
    }
}
