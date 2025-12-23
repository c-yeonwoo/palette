package kr.ai.palette.persistence.profile

import kr.ai.palette.domain.profile.ProfileId
import kr.ai.palette.domain.profile.ProfileVideo
import kr.ai.palette.domain.profile.ProfileVideoId
import org.springframework.stereotype.Component

@Component
class ProfileVideoMapper {

    fun toDomain(entity: ProfileVideoEntity): ProfileVideo {
        return ProfileVideo(
            id = ProfileVideoId(entity.id),
            profileId = ProfileId(entity.profileId),
            s3Key = entity.s3Key,
            url = entity.url,
            thumbnailUrl = entity.thumbnailUrl,
            durationSeconds = entity.durationSeconds,
            createdAt = entity.createdAt
        )
    }

    fun toEntity(domain: ProfileVideo): ProfileVideoEntity {
        return ProfileVideoEntity(
            id = domain.id.value,
            profileId = domain.profileId.value,
            s3Key = domain.s3Key,
            url = domain.url,
            thumbnailUrl = domain.thumbnailUrl,
            durationSeconds = domain.durationSeconds,
            createdAt = domain.createdAt
        )
    }

    fun updateEntity(entity: ProfileVideoEntity, domain: ProfileVideo) {
        entity.profileId = domain.profileId.value
        entity.s3Key = domain.s3Key
        entity.url = domain.url
        entity.thumbnailUrl = domain.thumbnailUrl
        entity.durationSeconds = domain.durationSeconds
    }
}
