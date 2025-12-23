package kr.ai.palette.domain.matchmaker

import java.time.Instant

data class MatchmakerMetadata(
    val createdAt: Instant,
    val updatedAt: Instant = createdAt
)
