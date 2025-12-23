package kr.ai.palette.domain.profile

import java.time.Instant
import java.util.UUID

data class ProfileVideo(
    val id: ProfileVideoId,
    val profileId: ProfileId,
    val s3Key: String,
    val url: String,
    val thumbnailUrl: String,
    val durationSeconds: Int,
    val createdAt: Instant
) {
    init {
        require(durationSeconds in 5..30) { "Video duration must be between 5 and 30 seconds" }
    }

    fun isValid(): Boolean {
        return durationSeconds in 5..30
    }
}

@JvmInline
value class ProfileVideoId(val value: UUID)
