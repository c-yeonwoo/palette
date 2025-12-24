package kr.ai.palette.domain.profile

import kr.ai.palette.domain.common.UserId
import java.time.Instant

data class Profile(
    val id: ProfileId,
    val userId: UserId,
    val basicInfo: BasicInfo,
    val careerInfo: CareerInfo,
    val educationInfo: EducationInfo,
    val locationInfo: LocationInfo,
    val lifestyleInfo: LifestyleInfo,
    val introduction: Introduction,
    val idealType: IdealType,
    val photos: List<ProfilePhoto>,
    val videos: List<ProfileVideo>,
    val metadata: ProfileMetadata,
    val metrics: ProfileMetrics,
    val settings: ProfileSettings
) {
    fun updateBasicInfo(basicInfo: BasicInfo): Profile {
        return copy(
            basicInfo = basicInfo,
            metadata = metadata.update()
        )
    }

    fun updateCareerInfo(careerInfo: CareerInfo): Profile {
        return copy(
            careerInfo = careerInfo,
            metadata = metadata.update()
        )
    }

    fun updateEducationInfo(educationInfo: EducationInfo): Profile {
        return copy(
            educationInfo = educationInfo,
            metadata = metadata.update()
        )
    }

    fun updateLocationInfo(locationInfo: LocationInfo): Profile {
        return copy(
            locationInfo = locationInfo,
            metadata = metadata.update()
        )
    }

    fun updateLifestyleInfo(lifestyleInfo: LifestyleInfo): Profile {
        return copy(
            lifestyleInfo = lifestyleInfo,
            metadata = metadata.update()
        )
    }

    fun updateIntroduction(introduction: Introduction): Profile {
        return copy(
            introduction = introduction,
            metadata = metadata.update()
        )
    }

    fun updateIdealType(idealType: IdealType): Profile {
        return copy(
            idealType = idealType,
            metadata = metadata.update()
        )
    }

    fun addPhoto(photo: ProfilePhoto): Profile {
        return copy(
            photos = photos + photo,
            metadata = metadata.update()
        )
    }

    fun removePhoto(photoId: ProfilePhotoId): Profile {
        return copy(
            photos = photos.filterNot { it.id == photoId },
            metadata = metadata.update()
        )
    }

    fun addVideo(video: ProfileVideo): Profile {
        return copy(
            videos = videos + video,
            metadata = metadata.update()
        )
    }

    fun removeVideo(videoId: ProfileVideoId): Profile {
        return copy(
            videos = videos.filterNot { it.id == videoId },
            metadata = metadata.update()
        )
    }

    fun updateSettings(settings: ProfileSettings): Profile {
        return copy(
            settings = settings,
            metadata = metadata.update()
        )
    }

    fun access(): Profile {
        return copy(metadata = metadata.access())
    }

    fun delete(): Profile {
        return copy(metadata = metadata.delete())
    }

    companion object {
        fun create(
            userId: UserId,
            basicInfo: BasicInfo = BasicInfo(null, null),
            careerInfo: CareerInfo = CareerInfo(null, null, null),
            educationInfo: EducationInfo = EducationInfo(null, null, null),
            locationInfo: LocationInfo = LocationInfo(null, null, null, null),
            lifestyleInfo: LifestyleInfo = LifestyleInfo(null, null, null),
            introduction: Introduction = Introduction(null, emptyList()),
            idealType: IdealType = IdealType(null, null, emptyList(), emptyList(), null, null, null)
        ): Profile {
            val now = Instant.now()
            return Profile(
                id = ProfileId(java.util.UUID.randomUUID()),
                userId = userId,
                basicInfo = basicInfo,
                careerInfo = careerInfo,
                educationInfo = educationInfo,
                locationInfo = locationInfo,
                lifestyleInfo = lifestyleInfo,
                introduction = introduction,
                idealType = idealType,
                photos = emptyList(),
                videos = emptyList(),
                metadata = ProfileMetadata(
                    createdAt = now,
                    updatedAt = now,
                    lastAccessedAt = now,
                    deletedAt = null
                ),
                metrics = ProfileMetrics(
                    completionRate = 0,
                    trustScore = 0,
                    viewCount = 0
                ),
                settings = ProfileSettings.initial()
            )
        }
    }
}
