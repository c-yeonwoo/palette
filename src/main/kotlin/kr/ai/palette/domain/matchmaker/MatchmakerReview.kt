package kr.ai.palette.domain.matchmaker

import java.time.Instant
import java.util.UUID

data class MatchmakerReview(
    val id: UUID = UUID.randomUUID(),
    val matchmakerId: UUID,
    val reviewerUserId: UUID,
    val rating: Int,  // 1-5
    val comment: String,
    val createdAt: Instant = Instant.now(),
)
