package kr.ai.palette.domain.matchmaking

import kr.ai.palette.domain.common.UserId
import java.time.LocalDateTime
import java.util.*

data class MatchmakingRequestId(val value: UUID = UUID.randomUUID())

data class MatchmakingRequest(
    val id: MatchmakingRequestId,
    val requesterId: UserId,
    val targetUserId: UserId,
    val matchmakerId: UserId,
    val message: String?,
    val status: MatchmakingRequestStatus,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime
) {
    companion object {
        fun create(
            requesterId: UserId,
            targetUserId: UserId,
            matchmakerId: UserId,
            message: String?
        ): MatchmakingRequest {
            val now = LocalDateTime.now()
            return MatchmakingRequest(
                id = MatchmakingRequestId(),
                requesterId = requesterId,
                targetUserId = targetUserId,
                matchmakerId = matchmakerId,
                message = message,
                status = MatchmakingRequestStatus.PENDING,
                createdAt = now,
                updatedAt = now
            )
        }
    }

    fun approve(): MatchmakingRequest {
        require(status == MatchmakingRequestStatus.PENDING) {
            "주선 요청은 대기 중 상태일 때만 승인할 수 있습니다"
        }
        return copy(
            status = MatchmakingRequestStatus.APPROVED,
            updatedAt = LocalDateTime.now()
        )
    }

    fun reject(): MatchmakingRequest {
        require(status == MatchmakingRequestStatus.PENDING) {
            "주선 요청은 대기 중 상태일 때만 거절할 수 있습니다"
        }
        return copy(
            status = MatchmakingRequestStatus.REJECTED,
            updatedAt = LocalDateTime.now()
        )
    }
}

enum class MatchmakingRequestStatus {
    PENDING,    // 대기 중
    APPROVED,   // 승인됨
    REJECTED    // 거절됨
}
