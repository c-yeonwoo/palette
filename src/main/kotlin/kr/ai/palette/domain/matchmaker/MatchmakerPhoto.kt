package kr.ai.palette.domain.matchmaker

import java.time.Instant

data class MatchmakerPhoto(
    val url: String,
    val uploadedAt: Instant
)
