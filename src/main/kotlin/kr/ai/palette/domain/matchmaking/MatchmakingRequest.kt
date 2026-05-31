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
    val requesterMessage: String?,              // 요청자가 주선자에게 보내는 메시지
    val matchmakerDecision: MatchmakerDecision?, // 주선자의 승인/거절 결정
    val targetUserDecision: TargetUserDecision?, // 피주선자의 수락/거절 결정
    val status: MatchmakingRequestStatus,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
    /** 운영자 메모 — 분쟁 대응 / 강제 변경 사유 기록 (ADR 0012) */
    val adminNote: String? = null,
    val adminLastUpdatedAt: LocalDateTime? = null,
    val adminLastUpdatedBy: UserId? = null,
) {
    companion object {
        fun create(
            requesterId: UserId,
            targetUserId: UserId,
            matchmakerId: UserId,
            requesterMessage: String?
        ): MatchmakingRequest {
            val now = LocalDateTime.now()
            return MatchmakingRequest(
                id = MatchmakingRequestId(),
                requesterId = requesterId,
                targetUserId = targetUserId,
                matchmakerId = matchmakerId,
                requesterMessage = requesterMessage,
                matchmakerDecision = null,
                targetUserDecision = null,
                status = MatchmakingRequestStatus.PENDING,
                createdAt = now,
                updatedAt = now
            )
        }
    }

    /**
     * 주선자가 주선 요청을 승인합니다.
     * 승인 후 상태는 MATCHMAKER_APPROVED로 변경되며, 피주선자의 응답을 대기합니다.
     */
    fun approveByMatchmaker(message: String?): MatchmakingRequest {
        require(status == MatchmakingRequestStatus.PENDING) {
            "주선 요청은 대기 중 상태일 때만 승인할 수 있습니다"
        }
        return copy(
            matchmakerDecision = MatchmakerDecision.approve(message),
            status = MatchmakingRequestStatus.MATCHMAKER_APPROVED,
            updatedAt = LocalDateTime.now()
        )
    }

    /**
     * 주선자가 주선 요청을 거절합니다.
     * 거절 시 매칭 플로우가 종료됩니다.
     */
    fun rejectByMatchmaker(message: String?): MatchmakingRequest {
        require(status == MatchmakingRequestStatus.PENDING) {
            "주선 요청은 대기 중 상태일 때만 거절할 수 있습니다"
        }
        return copy(
            matchmakerDecision = MatchmakerDecision.reject(message),
            status = MatchmakingRequestStatus.REJECTED_BY_MATCHMAKER,
            updatedAt = LocalDateTime.now()
        )
    }

    /**
     * 피주선자(target user)가 주선을 수락합니다.
     * 수락 시 매칭이 성사되며, 연락처 교환이 이루어집니다.
     */
    fun acceptByTarget(message: String?): MatchmakingRequest {
        require(status == MatchmakingRequestStatus.MATCHMAKER_APPROVED) {
            "피주선자는 주선자가 승인한 요청만 수락할 수 있습니다"
        }
        return copy(
            targetUserDecision = TargetUserDecision.accept(message),
            status = MatchmakingRequestStatus.COMPLETED,
            updatedAt = LocalDateTime.now()
        )
    }

    /**
     * 피주선자(target user)가 주선을 거절합니다.
     * 거절 시 매칭 플로우가 종료됩니다.
     */
    fun rejectByTarget(message: String?): MatchmakingRequest {
        require(status == MatchmakingRequestStatus.MATCHMAKER_APPROVED) {
            "피주선자는 주선자가 승인한 요청만 거절할 수 있습니다"
        }
        return copy(
            targetUserDecision = TargetUserDecision.reject(message),
            status = MatchmakingRequestStatus.REJECTED_BY_TARGET,
            updatedAt = LocalDateTime.now()
        )
    }

    fun isTerminal(): Boolean = status in setOf(
        MatchmakingRequestStatus.COMPLETED,
        MatchmakingRequestStatus.REJECTED_BY_MATCHMAKER,
        MatchmakingRequestStatus.REJECTED_BY_TARGET,
        MatchmakingRequestStatus.CANCELLED_BY_ADMIN,
    )

    /**
     * 운영자가 매칭 요청을 강제 변경 — 분쟁 대응 / 정책 위반 시 사용.
     * note 는 필수 (audit 단서).
     * ADR: docs/DECISIONS/0012-admin-matching-pool.md
     */
    fun adminOverride(
        newStatus: MatchmakingRequestStatus,
        note: String,
        operatorId: UserId,
    ): MatchmakingRequest {
        require(note.isNotBlank()) { "운영자 변경 사유(note)는 필수입니다" }
        val now = LocalDateTime.now()
        return copy(
            status = newStatus,
            updatedAt = now,
            adminNote = note.take(1000),
            adminLastUpdatedAt = now,
            adminLastUpdatedBy = operatorId,
        )
    }

    /** 운영자 메모만 갱신 (status 변경 없음) */
    fun adminAttachNote(note: String, operatorId: UserId): MatchmakingRequest {
        require(note.isNotBlank()) { "메모는 비워둘 수 없습니다" }
        val now = LocalDateTime.now()
        return copy(
            adminNote = note.take(1000),
            adminLastUpdatedAt = now,
            adminLastUpdatedBy = operatorId,
            updatedAt = now,
        )
    }
}

enum class MatchmakingRequestStatus {
    PENDING,                    // 주선자 승인 대기
    MATCHMAKER_APPROVED,        // 주선자 승인 완료, 피주선자 응답 대기
    REJECTED_BY_MATCHMAKER,     // 주선자 거절 (종료)
    COMPLETED,                  // 매칭 성사 (피주선자 수락)
    REJECTED_BY_TARGET,         // 피주선자 거절 (종료)
    CANCELLED_BY_ADMIN          // 운영자 강제 취소 (분쟁/정책 위반 — ADR 0012)
}
