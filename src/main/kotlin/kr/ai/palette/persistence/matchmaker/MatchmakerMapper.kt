package kr.ai.palette.persistence.matchmaker

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaker.*
import org.springframework.stereotype.Component

@Component
class MatchmakerMapper(
    private val objectMapper: ObjectMapper
) {

    fun toDomain(entity: MatchmakerEntity): Matchmaker {
        return Matchmaker(
            id = MatchmakerId(entity.id),
            userId = UserId(entity.userId),
            stats = MatchmakerStats(
                totalMatchRequests = entity.totalMatchRequests,
                approvedRequests = entity.approvedRequests,
                rejectedRequests = entity.rejectedRequests,
                successfulMatches = entity.successfulMatches,
                failedMatches = entity.failedMatches
            ),
            level = MatchmakerLevel(
                level = entity.level,
                commissionRate = entity.commissionRate
            ),
            earnings = MatchmakerEarnings(
                totalPoints = entity.totalPoints,
                withdrawnPoints = entity.withdrawnPoints,
                pendingPoints = entity.pendingPoints
            ),
            profilePhoto = if (entity.profilePhotoUrl != null && entity.profilePhotoUploadedAt != null) {
                MatchmakerPhoto(
                    url = entity.profilePhotoUrl!!,
                    uploadedAt = entity.profilePhotoUploadedAt!!
                )
            } else null,
            metadata = MatchmakerMetadata(
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt
            ),
            bio = entity.bio,
            specialties = parseSpecialties(entity.specialties),
            isPublicProfile = entity.isPublicProfile,
            averageRating = entity.averageRating,
            totalReviews = entity.totalReviews,
        )
    }

    fun toEntity(domain: Matchmaker): MatchmakerEntity {
        return MatchmakerEntity(
            id = domain.id.value,
            userId = domain.userId.value,
            totalMatchRequests = domain.stats.totalMatchRequests,
            approvedRequests = domain.stats.approvedRequests,
            rejectedRequests = domain.stats.rejectedRequests,
            successfulMatches = domain.stats.successfulMatches,
            failedMatches = domain.stats.failedMatches,
            level = domain.level.level,
            commissionRate = domain.level.commissionRate,
            totalPoints = domain.earnings.totalPoints,
            withdrawnPoints = domain.earnings.withdrawnPoints,
            pendingPoints = domain.earnings.pendingPoints,
            profilePhotoUrl = domain.profilePhoto?.url,
            profilePhotoUploadedAt = domain.profilePhoto?.uploadedAt,
            createdAt = domain.metadata.createdAt,
            updatedAt = domain.metadata.updatedAt,
            bio = domain.bio,
            specialties = serializeSpecialties(domain.specialties),
            isPublicProfile = domain.isPublicProfile,
            averageRating = domain.averageRating,
            totalReviews = domain.totalReviews,
        )
    }

    fun updateEntity(entity: MatchmakerEntity, domain: Matchmaker) {
        entity.userId = domain.userId.value
        entity.totalMatchRequests = domain.stats.totalMatchRequests
        entity.approvedRequests = domain.stats.approvedRequests
        entity.rejectedRequests = domain.stats.rejectedRequests
        entity.successfulMatches = domain.stats.successfulMatches
        entity.failedMatches = domain.stats.failedMatches
        entity.level = domain.level.level
        entity.commissionRate = domain.level.commissionRate
        entity.totalPoints = domain.earnings.totalPoints
        entity.withdrawnPoints = domain.earnings.withdrawnPoints
        entity.pendingPoints = domain.earnings.pendingPoints
        entity.profilePhotoUrl = domain.profilePhoto?.url
        entity.profilePhotoUploadedAt = domain.profilePhoto?.uploadedAt
        entity.updatedAt = domain.metadata.updatedAt
        entity.bio = domain.bio
        entity.specialties = serializeSpecialties(domain.specialties)
        entity.isPublicProfile = domain.isPublicProfile
        entity.averageRating = domain.averageRating
        entity.totalReviews = domain.totalReviews
    }

    @Suppress("UNCHECKED_CAST")
    private fun parseSpecialties(json: String?): List<String> {
        if (json.isNullOrBlank()) return emptyList()
        return try {
            objectMapper.readValue(json, List::class.java) as List<String>
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun serializeSpecialties(list: List<String>): String? {
        if (list.isEmpty()) return null
        return try { objectMapper.writeValueAsString(list) } catch (e: Exception) { null }
    }
}
