package kr.ai.palette.domain.matchmaker

import kr.ai.palette.domain.common.UserId
import java.time.Instant

data class Matchmaker(
    val id: MatchmakerId,
    val userId: UserId,
    val stats: MatchmakerStats,
    val level: MatchmakerLevel,
    val earnings: MatchmakerEarnings,
    val profilePhoto: MatchmakerPhoto?,
    val metadata: MatchmakerMetadata,
    val bio: String? = null,
    val specialties: List<String> = emptyList(),
    val isPublicProfile: Boolean = false,
    val averageRating: Double = 0.0,
    val totalReviews: Int = 0,
) {
    fun recordMatchRequest(): Matchmaker {
        return copy(
            stats = stats.incrementTotal(),
            metadata = metadata.copy(updatedAt = Instant.now())
        )
    }

    fun recordMatchApproval(): Matchmaker {
        return copy(
            stats = stats.incrementApproved(),
            metadata = metadata.copy(updatedAt = Instant.now())
        )
    }

    fun recordMatchRejection(): Matchmaker {
        return copy(
            stats = stats.incrementRejected(),
            metadata = metadata.copy(updatedAt = Instant.now())
        )
    }

    fun recordMatchSuccess(): Matchmaker {
        val newStats = stats.incrementSuccess()
        val newLevel = MatchmakerLevel.calculateLevel(newStats)
        // ADR 0042 — 매칭 1건 기준 보상 20 물감(= 2,000원). 등급별 커미션(ADR 0038)
        // 적용 후 실 적립은 MatchmakerLevel.commissionRate * 20 (Lv.1 3 / Lv.5 8 물감).
        // TODO: 실제 커미션 적용은 별도 sprint (현재 호출처에서 곱하기 X)
        val reward = 20
        val newEarnings = earnings.addReward(reward)

        return copy(
            stats = newStats,
            level = newLevel,
            earnings = newEarnings,
            metadata = metadata.copy(updatedAt = Instant.now())
        )
    }

    fun recordMatchFailure(): Matchmaker {
        return copy(
            stats = stats.incrementFailed(),
            metadata = metadata.copy(updatedAt = Instant.now())
        )
    }

    fun uploadPhoto(photoUrl: String, hasProfile: Boolean): Matchmaker {
        // Profile이 있으면 Profile 대표 사진 사용
        if (hasProfile) {
            return this
        }

        return copy(
            profilePhoto = MatchmakerPhoto(
                url = photoUrl,
                uploadedAt = Instant.now()
            ),
            metadata = metadata.copy(updatedAt = Instant.now())
        )
    }

    fun canEarnCommission(): Boolean {
        return level.commissionRate > 0
    }

    fun updatePublicProfile(bio: String?, specialties: List<String>, isPublicProfile: Boolean): Matchmaker {
        return copy(bio = bio, specialties = specialties, isPublicProfile = isPublicProfile)
    }

    fun addReview(rating: Int): Matchmaker {
        val newTotal = totalReviews + 1
        val newAvg = ((averageRating * totalReviews) + rating) / newTotal
        return copy(averageRating = newAvg, totalReviews = newTotal)
    }
}
