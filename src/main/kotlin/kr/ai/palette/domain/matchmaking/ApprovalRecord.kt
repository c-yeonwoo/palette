package kr.ai.palette.domain.matchmaking

import java.time.LocalDateTime

/**
 * 주선자의 승인/거절 결정을 나타내는 Value Object
 */
data class MatchmakerDecision(
    val decidedAt: LocalDateTime,
    val message: String?,
    val approved: Boolean
) {
    companion object {
        fun approve(message: String?): MatchmakerDecision {
            return MatchmakerDecision(
                decidedAt = LocalDateTime.now(),
                message = message,
                approved = true
            )
        }

        fun reject(message: String?): MatchmakerDecision {
            return MatchmakerDecision(
                decidedAt = LocalDateTime.now(),
                message = message,
                approved = false
            )
        }
    }
}

/**
 * 피주선자(target user)의 수락/거절 결정을 나타내는 Value Object
 */
data class TargetUserDecision(
    val decidedAt: LocalDateTime,
    val message: String?,
    val accepted: Boolean
) {
    companion object {
        fun accept(message: String?): TargetUserDecision {
            return TargetUserDecision(
                decidedAt = LocalDateTime.now(),
                message = message,
                accepted = true
            )
        }

        fun reject(message: String?): TargetUserDecision {
            return TargetUserDecision(
                decidedAt = LocalDateTime.now(),
                message = message,
                accepted = false
            )
        }
    }
}
