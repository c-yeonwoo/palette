package kr.ai.palette.domain.matchmaker

import kr.ai.palette.domain.billing.PointPrice
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

    /**
     * 매칭 성사 처리. ADR 0044 — 소개요청 분배 모델로 통합.
     *
     * 보상은 [PointPrice.INTRO_REQUEST] × **현재 등급의** [MatchmakerLevel.commissionRate] 로 계산:
     *   - Lv.1 (15%): 15 물감
     *   - Lv.5 (40%): 40 물감
     *
     * **등급 승급 시점**: 보상은 "현재 등급" 기준으로 먼저 적립한 뒤 등급 갱신.
     * (다이아 막 도달한 매칭은 Lv.4 보상으로 산정 — 다음 매칭부터 Lv.5)
     */
    fun recordMatchSuccess(): Matchmaker {
        val newStats = stats.incrementSuccess()
        val newLevel = MatchmakerLevel.calculateLevel(newStats)
        // 무현금 모델 (ADR 0064): 금전 분배 비활성 — 등급·명예(stats/level)만 반영.
        // earnings 도메인은 휴면 보존, 적립만 중단.
        return copy(
            stats = newStats,
            level = newLevel,
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
