package kr.ai.palette.domain.profile

import java.time.Instant
import java.util.UUID

data class ProfilePhoto(
    val id: ProfilePhotoId,
    val profileId: ProfileId,
    val s3Key: String,
    val url: String,
    val displayOrder: Int,
    val isPrimary: Boolean,
    val trustAnalysis: TrustAnalysis,
    val aiAnalysis: AIAnalysis?,
    val createdAt: Instant
) {
    fun markAsPrimary(): ProfilePhoto {
        return copy(isPrimary = true)
    }

    fun unmarkAsPrimary(): ProfilePhoto {
        return copy(isPrimary = false)
    }

    fun updateOrder(newOrder: Int): ProfilePhoto {
        require(newOrder >= 0) { "Display order must be non-negative" }
        return copy(displayOrder = newOrder)
    }
}

@JvmInline
value class ProfilePhotoId(val value: UUID)

data class TrustAnalysis(
    val trustFactor: TrustFactor,
    val trustScore: Int
) {
    init {
        require(trustScore in 0..50) { "Trust score must be between 0 and 50" }
    }
}

enum class TrustFactor {
    SELFIE,
    TAKEN_BY_OTHERS,
    UNCLEAR,
    UNKNOWN
}

data class AIAnalysis(
    val hasFace: Boolean?,
    val hasFullBody: Boolean?,
    val hasClearFace: Boolean?,
    val qualityScore: Int?,
    val isSelfie: Boolean?,
    val isTakenByOthers: Boolean?,
    val isOverProcessed: Boolean?,
    val rawData: Map<String, Any>
) {
    init {
        qualityScore?.let { require(it in 0..100) { "Quality score must be between 0 and 100" } }
    }
}
