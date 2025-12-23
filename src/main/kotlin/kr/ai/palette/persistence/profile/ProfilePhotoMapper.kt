package kr.ai.palette.persistence.profile

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.jacksonObjectMapper
import tools.jackson.module.kotlin.readValue
import kr.ai.palette.domain.profile.*
import org.springframework.stereotype.Component

@Component
class ProfilePhotoMapper {

    private val objectMapper: ObjectMapper = jacksonObjectMapper()

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
            aiAnalysis = if (entity.aiAnalysis != null) {
                try {
                    val rawData = objectMapper.readValue<Map<String, Any>>(entity.aiAnalysis!!)
                    AIAnalysis(
                        hasFace = entity.hasFace,
                        hasFullBody = entity.hasFullBody,
                        hasClearFace = entity.hasClearFace,
                        qualityScore = entity.qualityScore,
                        isSelfie = entity.isSelfie,
                        isTakenByOthers = entity.isTakenByOthers,
                        isOverProcessed = entity.isOverProcessed,
                        rawData = rawData
                    )
                } catch (e: Exception) {
                    null
                }
            } else null,
            createdAt = entity.createdAt
        )
    }

    fun toEntity(domain: ProfilePhoto): ProfilePhotoEntity {
        return ProfilePhotoEntity(
            id = domain.id.value,
            profileId = domain.profileId.value,
            s3Key = domain.s3Key,
            url = domain.url,
            displayOrder = domain.displayOrder,
            isPrimary = domain.isPrimary,
            trustFactor = domain.trustAnalysis.trustFactor.toEntity(),
            trustScore = domain.trustAnalysis.trustScore,
            hasFace = domain.aiAnalysis?.hasFace,
            hasFullBody = domain.aiAnalysis?.hasFullBody,
            hasClearFace = domain.aiAnalysis?.hasClearFace,
            qualityScore = domain.aiAnalysis?.qualityScore,
            isSelfie = domain.aiAnalysis?.isSelfie,
            isTakenByOthers = domain.aiAnalysis?.isTakenByOthers,
            isOverProcessed = domain.aiAnalysis?.isOverProcessed,
            aiAnalysis = domain.aiAnalysis?.let {
                try {
                    objectMapper.writeValueAsString(it.rawData)
                } catch (e: Exception) {
                    null
                }
            },
            createdAt = domain.createdAt
        )
    }

    fun updateEntity(entity: ProfilePhotoEntity, domain: ProfilePhoto) {
        entity.profileId = domain.profileId.value
        entity.s3Key = domain.s3Key
        entity.url = domain.url
        entity.displayOrder = domain.displayOrder
        entity.isPrimary = domain.isPrimary
        entity.trustFactor = domain.trustAnalysis.trustFactor.toEntity()
        entity.trustScore = domain.trustAnalysis.trustScore
        entity.hasFace = domain.aiAnalysis?.hasFace
        entity.hasFullBody = domain.aiAnalysis?.hasFullBody
        entity.hasClearFace = domain.aiAnalysis?.hasClearFace
        entity.qualityScore = domain.aiAnalysis?.qualityScore
        entity.isSelfie = domain.aiAnalysis?.isSelfie
        entity.isTakenByOthers = domain.aiAnalysis?.isTakenByOthers
        entity.isOverProcessed = domain.aiAnalysis?.isOverProcessed
        entity.aiAnalysis = domain.aiAnalysis?.let {
            try {
                objectMapper.writeValueAsString(it.rawData)
            } catch (e: Exception) {
                null
            }
        }
    }
}

private fun TrustFactorEntity.toDomain(): TrustFactor = TrustFactor.valueOf(this.name)
private fun TrustFactor.toEntity(): TrustFactorEntity = TrustFactorEntity.valueOf(this.name)
