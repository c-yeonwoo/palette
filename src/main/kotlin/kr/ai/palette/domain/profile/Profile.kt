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

    fun calculateCompletionRate(): Int {
        var filledFields = 0
        var totalFields = 0

        // Basic Info (2 fields)
        totalFields += 2
        if (basicInfo.height != null) filledFields++
        if (basicInfo.bodyType != null) filledFields++

        // Career Info (3 fields)
        totalFields += 3
        if (careerInfo.category != null) filledFields++
        if (careerInfo.company != null) filledFields++
        if (careerInfo.position != null) filledFields++

        // Education Info (3 fields)
        totalFields += 3
        if (educationInfo.level != null) filledFields++
        if (educationInfo.school != null) filledFields++
        if (educationInfo.major != null) filledFields++

        // Location Info (2 fields minimum)
        totalFields += 2
        if (locationInfo.sido != null) filledFields++
        if (locationInfo.sigungu != null) filledFields++

        // Lifestyle Info (3 fields)
        totalFields += 3
        if (lifestyleInfo.smoking != null) filledFields++
        if (lifestyleInfo.drinking != null) filledFields++
        if (lifestyleInfo.religion != null) filledFields++

        // Introduction - Interview Answers (5 fields)
        totalFields += 5
        introduction.interviewAnswers?.let { answers ->
            if (answers.hobby != null) filledFields++
            if (answers.charm != null) filledFields++
            if (answers.passion != null) filledFields++
            if (answers.happiness != null) filledFields++
            if (answers.motto != null) filledFields++
        }

        // Ideal Type (3 minimum collections)
        totalFields += 3
        if (idealType.datePreferences.isNotEmpty()) filledFields++
        if (idealType.importantValues.isNotEmpty()) filledFields++
        if (idealType.personalities.isNotEmpty()) filledFields++

        // Photos (1 field - at least one photo)
        totalFields += 1
        if (photos.isNotEmpty()) filledFields++

        return if (totalFields > 0) {
            ((filledFields.toDouble() / totalFields.toDouble()) * 100).toInt()
        } else {
            0
        }
    }

    fun recalculateMetrics(): Profile {
        return copy(
            metrics = metrics.copy(completionRate = calculateCompletionRate())
        )
    }

    companion object {
        fun create(
            userId: UserId,
            basicInfo: BasicInfo = BasicInfo(null, null),
            careerInfo: CareerInfo = CareerInfo(null, null, null),
            educationInfo: EducationInfo = EducationInfo(null, null, null),
            locationInfo: LocationInfo = LocationInfo(null, null),
            lifestyleInfo: LifestyleInfo = LifestyleInfo(null, null, null),
            introduction: Introduction = Introduction(null, emptyList()),
            idealType: IdealType = IdealType(emptyList(), emptyList(), emptyList(), emptyList(), emptyList())
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
