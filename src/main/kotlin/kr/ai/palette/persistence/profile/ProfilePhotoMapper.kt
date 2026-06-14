package kr.ai.palette.persistence.profile

import kr.ai.palette.domain.profile.*
import org.springframework.stereotype.Component

@Component
class ProfilePhotoMapper {

    fun toDomain(entity: ProfilePhotoEntity): ProfilePhoto {
        return ProfilePhoto(
            id = ProfilePhotoId(entity.id),
            profileId = ProfileId(entity.profileId),
            s3Key = entity.s3Key,
            url = entity.url,
            displayOrder = entity.displayOrder,
            isPrimary = entity.isPrimary,
            trustAnalysis = TrustAnalysis(
                trustFactor = entity.trustFactor.toDomain(),
                trustScore = entity.trustScore
            ),
            aiAnalysis = if (entity.aiHasFace != null || entity.aiQualityScore != null) {
                AIAnalysis(
                    hasFace = entity.aiHasFace,
                    hasFullBody = entity.aiHasFullBody,
                    hasClearFace = entity.aiHasClearFace,
                    qualityScore = entity.aiQualityScore,
                    isSelfie = entity.aiIsSelfie,
                    isTakenByOthers = entity.aiIsTakenByOthers,
                    isOverProcessed = entity.aiIsOverProcessed,
                    rawData = emptyMap() // Simplified: JSON parsing removed for now
                )
            } else null,
            createdAt = entity.createdAt,
            rejected = entity.rejected
        )
    }

    fun toEntity(photo: ProfilePhoto): ProfilePhotoEntity {
        return ProfilePhotoEntity(
            id = photo.id.value,
            profileId = photo.profileId.value,
            s3Key = photo.s3Key,
            url = photo.url,
            displayOrder = photo.displayOrder,
            isPrimary = photo.isPrimary,
            trustFactor = photo.trustAnalysis.trustFactor.toEntity(),
            trustScore = photo.trustAnalysis.trustScore,
            aiHasFace = photo.aiAnalysis?.hasFace,
            aiHasFullBody = photo.aiAnalysis?.hasFullBody,
            aiHasClearFace = photo.aiAnalysis?.hasClearFace,
            aiQualityScore = photo.aiAnalysis?.qualityScore,
            aiIsSelfie = photo.aiAnalysis?.isSelfie,
            aiIsTakenByOthers = photo.aiAnalysis?.isTakenByOthers,
            aiIsOverProcessed = photo.aiAnalysis?.isOverProcessed,
            aiRawData = null, // Simplified: JSON serialization removed for now
            createdAt = photo.createdAt,
            rejected = photo.rejected
        )
    }

    private fun TrustFactorEntity.toDomain(): TrustFactor {
        return when (this) {
            TrustFactorEntity.SELFIE -> TrustFactor.SELFIE
            TrustFactorEntity.TAKEN_BY_OTHERS -> TrustFactor.TAKEN_BY_OTHERS
            TrustFactorEntity.UNCLEAR -> TrustFactor.UNCLEAR
            TrustFactorEntity.UNKNOWN -> TrustFactor.UNKNOWN
        }
    }

    private fun TrustFactor.toEntity(): TrustFactorEntity {
        return when (this) {
            TrustFactor.SELFIE -> TrustFactorEntity.SELFIE
            TrustFactor.TAKEN_BY_OTHERS -> TrustFactorEntity.TAKEN_BY_OTHERS
            TrustFactor.UNCLEAR -> TrustFactorEntity.UNCLEAR
            TrustFactor.UNKNOWN -> TrustFactorEntity.UNKNOWN
        }
    }
}
