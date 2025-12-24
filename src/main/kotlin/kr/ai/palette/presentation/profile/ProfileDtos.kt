package kr.ai.palette.presentation.profile

import kr.ai.palette.domain.profile.*
import java.time.Instant

// Response DTOs
data class ProfileResponse(
    val id: String,
    val userId: String,
    val basicInfo: BasicInfoDto,
    val careerInfo: CareerInfoDto,
    val educationInfo: EducationInfoDto,
    val locationInfo: LocationInfoDto,
    val lifestyleInfo: LifestyleInfoDto,
    val introduction: IntroductionDto,
    val idealType: IdealTypeDto,
    val primaryPhotoUrl: String?,
    val metadata: ProfileMetadataDto,
    val metrics: ProfileMetricsDto,
    val settings: ProfileSettingsDto
) {
    companion object {
        fun from(profile: Profile): ProfileResponse {
            return ProfileResponse(
                id = profile.id.value.toString(),
                userId = profile.userId.value.toString(),
                basicInfo = BasicInfoDto.from(profile.basicInfo),
                careerInfo = CareerInfoDto.from(profile.careerInfo),
                educationInfo = EducationInfoDto.from(profile.educationInfo),
                locationInfo = LocationInfoDto.from(profile.locationInfo),
                lifestyleInfo = LifestyleInfoDto.from(profile.lifestyleInfo),
                introduction = IntroductionDto.from(profile.introduction),
                idealType = IdealTypeDto.from(profile.idealType),
                primaryPhotoUrl = profile.photos.firstOrNull { it.isPrimary }?.url,
                metadata = ProfileMetadataDto.from(profile.metadata),
                metrics = ProfileMetricsDto.from(profile.metrics),
                settings = ProfileSettingsDto.from(profile.settings)
            )
        }
    }
}

// Request DTOs
data class UpdateProfileRequest(
    val basicInfo: BasicInfoDto?,
    val careerInfo: CareerInfoDto?,
    val educationInfo: EducationInfoDto?,
    val locationInfo: LocationInfoDto?,
    val lifestyleInfo: LifestyleInfoDto?,
    val introduction: IntroductionDto?,
    val idealType: IdealTypeDto?,
    val settings: ProfileSettingsDto?
)

data class BasicInfoDto(
    val height: Int?,
    val bodyType: String?
) {
    fun toDomain(): BasicInfo {
        return BasicInfo(
            height = height,
            bodyType = bodyType?.let { BodyType.valueOf(it) }
        )
    }

    companion object {
        fun from(basicInfo: BasicInfo): BasicInfoDto {
            return BasicInfoDto(
                height = basicInfo.height,
                bodyType = basicInfo.bodyType?.name
            )
        }
    }
}

data class CareerInfoDto(
    val category: String?,
    val company: String?,
    val position: String?
) {
    fun toDomain(): CareerInfo {
        return CareerInfo(
            category = category?.let { CareerCategory.valueOf(it) },
            company = company,
            position = position
        )
    }

    companion object {
        fun from(careerInfo: CareerInfo): CareerInfoDto {
            return CareerInfoDto(
                category = careerInfo.category?.name,
                company = careerInfo.company,
                position = careerInfo.position
            )
        }
    }
}

data class EducationInfoDto(
    val level: String?,
    val school: String?,
    val major: String?
) {
    fun toDomain(): EducationInfo {
        return EducationInfo(
            level = level?.let { EducationLevel.valueOf(it) },
            school = school,
            major = major
        )
    }

    companion object {
        fun from(educationInfo: EducationInfo): EducationInfoDto {
            return EducationInfoDto(
                level = educationInfo.level?.name,
                school = educationInfo.school,
                major = educationInfo.major
            )
        }
    }
}

data class LocationInfoDto(
    val sido: String?,
    val sigungu: String?,
    val hometownSido: String?,
    val hometownSigungu: String?
) {
    fun toDomain(): LocationInfo {
        return LocationInfo(
            sido = sido,
            sigungu = sigungu,
            hometownSido = hometownSido,
            hometownSigungu = hometownSigungu
        )
    }

    companion object {
        fun from(locationInfo: LocationInfo): LocationInfoDto {
            return LocationInfoDto(
                sido = locationInfo.sido,
                sigungu = locationInfo.sigungu,
                hometownSido = locationInfo.hometownSido,
                hometownSigungu = locationInfo.hometownSigungu
            )
        }
    }
}

data class LifestyleInfoDto(
    val smoking: String?,
    val drinking: String?,
    val religion: String?
) {
    fun toDomain(): LifestyleInfo {
        return LifestyleInfo(
            smoking = smoking?.let { Frequency.valueOf(it) },
            drinking = drinking?.let { Frequency.valueOf(it) },
            religion = religion?.let { Religion.valueOf(it) }
        )
    }

    companion object {
        fun from(lifestyleInfo: LifestyleInfo): LifestyleInfoDto {
            return LifestyleInfoDto(
                smoking = lifestyleInfo.smoking?.name,
                drinking = lifestyleInfo.drinking?.name,
                religion = lifestyleInfo.religion?.name
            )
        }
    }
}

data class IntroductionDto(
    val text: String?,
    val interests: List<String>
) {
    fun toDomain(): Introduction {
        return Introduction(
            text = text,
            interests = interests
        )
    }

    companion object {
        fun from(introduction: Introduction): IntroductionDto {
            return IntroductionDto(
                text = introduction.text,
                interests = introduction.interests
            )
        }
    }
}

data class IdealTypeDto(
    val ageRange: AgeRangeDto?,
    val heightRange: HeightRangeDto?,
    val bodyTypes: List<String>,
    val personalities: List<String>,
    val dateStyle: String?,
    val purpose: String?,
    val dealBreakers: String?
) {
    fun toDomain(): IdealType {
        return IdealType(
            ageRange = ageRange?.toDomain(),
            heightRange = heightRange?.toDomain(),
            bodyTypes = bodyTypes.mapNotNull {
                try { BodyType.valueOf(it) } catch (e: Exception) { null }
            },
            personalities = personalities,
            dateStyle = dateStyle?.let { DateStyle.valueOf(it) },
            purpose = purpose?.let { DatingPurpose.valueOf(it) },
            dealBreakers = dealBreakers
        )
    }

    companion object {
        fun from(idealType: IdealType): IdealTypeDto {
            return IdealTypeDto(
                ageRange = idealType.ageRange?.let { AgeRangeDto.from(it) },
                heightRange = idealType.heightRange?.let { HeightRangeDto.from(it) },
                bodyTypes = idealType.bodyTypes.map { it.name },
                personalities = idealType.personalities,
                dateStyle = idealType.dateStyle?.name,
                purpose = idealType.purpose?.name,
                dealBreakers = idealType.dealBreakers
            )
        }
    }
}

data class AgeRangeDto(
    val min: Int,
    val max: Int
) {
    fun toDomain(): AgeRange {
        return AgeRange(min, max)
    }

    companion object {
        fun from(ageRange: AgeRange): AgeRangeDto {
            return AgeRangeDto(ageRange.min, ageRange.max)
        }
    }
}

data class HeightRangeDto(
    val min: Int,
    val max: Int
) {
    fun toDomain(): HeightRange {
        return HeightRange(min, max)
    }

    companion object {
        fun from(heightRange: HeightRange): HeightRangeDto {
            return HeightRangeDto(heightRange.min, heightRange.max)
        }
    }
}

data class ProfileMetadataDto(
    val createdAt: Instant,
    val updatedAt: Instant,
    val lastAccessedAt: Instant,
    val deletedAt: Instant?
) {
    companion object {
        fun from(metadata: ProfileMetadata): ProfileMetadataDto {
            return ProfileMetadataDto(
                createdAt = metadata.createdAt,
                updatedAt = metadata.updatedAt,
                lastAccessedAt = metadata.lastAccessedAt,
                deletedAt = metadata.deletedAt
            )
        }
    }
}

data class ProfileMetricsDto(
    val completionRate: Int,
    val trustScore: Int,
    val viewCount: Int
) {
    companion object {
        fun from(metrics: ProfileMetrics): ProfileMetricsDto {
            return ProfileMetricsDto(
                completionRate = metrics.completionRate,
                trustScore = metrics.trustScore,
                viewCount = metrics.viewCount
            )
        }
    }
}

data class ProfileSettingsDto(
    val isAcceptingMatches: Boolean,
    val hiddenAt: Instant?
) {
    fun toDomain(): ProfileSettings {
        return ProfileSettings(
            isAcceptingMatches = isAcceptingMatches,
            hiddenAt = hiddenAt
        )
    }

    companion object {
        fun from(settings: ProfileSettings): ProfileSettingsDto {
            return ProfileSettingsDto(
                isAcceptingMatches = settings.isAcceptingMatches,
                hiddenAt = settings.hiddenAt
            )
        }
    }
}
