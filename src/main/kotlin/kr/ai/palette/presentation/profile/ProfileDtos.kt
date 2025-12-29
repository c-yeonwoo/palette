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
    val personalityTests: List<PersonalityTestResultDto>,
    val photos: List<ProfilePhotoDto>,
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
                personalityTests = profile.personalityTests.map { PersonalityTestResultDto.from(it) },
                photos = profile.photos.map { ProfilePhotoDto.from(it) },
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
    val personalityTests: List<PersonalityTestResultDto>?,
    val settings: ProfileSettingsDto?
)

data class UpdateSettingsRequest(
    val isAcceptingMatches: Boolean
) {
    fun toDomain(): ProfileSettings {
        return ProfileSettings(
            isAcceptingMatches = isAcceptingMatches,
            hiddenAt = null
        )
    }
}

data class BasicInfoDto(
    val height: Int?,
    val bodyType: String?,
    val mbti: String
) {
    fun toDomain(): BasicInfo {
        return BasicInfo(
            height = height,
            bodyType = bodyType?.let { BodyType.valueOf(it) },
            mbti = MBTI.valueOf(mbti)
        )
    }

    companion object {
        fun from(basicInfo: BasicInfo): BasicInfoDto {
            return BasicInfoDto(
                height = basicInfo.height,
                bodyType = basicInfo.bodyType?.name,
                mbti = basicInfo.mbti.name
            )
        }
    }
}

data class CareerInfoDto(
    val category: String?,
    val company: String?,
    val incomeRange: String?
) {
    fun toDomain(): CareerInfo {
        return CareerInfo(
            category = category?.let { CareerCategory.valueOf(it) },
            company = company,
            incomeRange = incomeRange?.let { IncomeRange.valueOf(it) }
        )
    }

    companion object {
        fun from(careerInfo: CareerInfo): CareerInfoDto {
            return CareerInfoDto(
                category = careerInfo.category?.name,
                company = careerInfo.company,
                incomeRange = careerInfo.incomeRange?.name
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
    val sigungu: String?
) {
    fun toDomain(): LocationInfo {
        return LocationInfo(
            sido = sido,
            sigungu = sigungu
        )
    }

    companion object {
        fun from(locationInfo: LocationInfo): LocationInfoDto {
            return LocationInfoDto(
                sido = locationInfo.sido,
                sigungu = locationInfo.sigungu
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
    val interests: List<String>?,
    val interviewAnswers: InterviewAnswersDto?
) {
    fun toDomain(): Introduction {
        return Introduction(
            text = text,
            interests = interests ?: emptyList(),
            interviewAnswers = interviewAnswers?.toDomain()
        )
    }

    companion object {
        fun from(introduction: Introduction): IntroductionDto {
            return IntroductionDto(
                text = introduction.text,
                interests = introduction.interests,
                interviewAnswers = introduction.interviewAnswers?.let { InterviewAnswersDto.from(it) }
            )
        }
    }
}

data class InterviewAnswersDto(
    val hobby: String?,
    val charm: String?,
    val passion: String?,
    val happiness: String?,
    val motto: String?
) {
    fun toDomain(): InterviewAnswers {
        return InterviewAnswers(
            hobby = hobby,
            charm = charm,
            passion = passion,
            happiness = happiness,
            motto = motto
        )
    }

    companion object {
        fun from(interviewAnswers: InterviewAnswers): InterviewAnswersDto {
            return InterviewAnswersDto(
                hobby = interviewAnswers.hobby,
                charm = interviewAnswers.charm,
                passion = interviewAnswers.passion,
                happiness = interviewAnswers.happiness,
                motto = interviewAnswers.motto
            )
        }
    }
}

data class IdealTypeDto(
    val datePreferences: List<String>, // DatePreference enum values
    val importantValues: List<String>, // ImportantValue enum values (max 3)
    val personalities: List<String>, // max 5
    val appearanceStyles: List<String>, // MaleAppearanceStyle or FemaleAppearanceStyle enum values
    val dealBreakers: List<String> // DealBreaker enum values (max 3)
) {
    fun toDomain(): IdealType {
        return IdealType(
            datePreferences = datePreferences.mapNotNull {
                try { DatePreference.valueOf(it) } catch (e: Exception) { null }
            },
            importantValues = importantValues.mapNotNull {
                try { ImportantValue.valueOf(it) } catch (e: Exception) { null }
            },
            personalities = personalities,
            appearanceStyles = appearanceStyles, // Store as strings (enum values)
            dealBreakers = dealBreakers.mapNotNull {
                try { DealBreaker.valueOf(it) } catch (e: Exception) { null }
            }
        )
    }

    companion object {
        fun from(idealType: IdealType): IdealTypeDto {
            return IdealTypeDto(
                datePreferences = idealType.datePreferences.map { it.name },
                importantValues = idealType.importantValues.map { it.name },
                personalities = idealType.personalities,
                appearanceStyles = idealType.appearanceStyles,
                dealBreakers = idealType.dealBreakers.map { it.name }
            )
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

data class PersonalityTestResultDto(
    val link: String,
    val title: String
) {
    fun toDomain(): PersonalityTestResult {
        return PersonalityTestResult(
            link = link,
            title = title
        )
    }

    companion object {
        fun from(test: PersonalityTestResult): PersonalityTestResultDto {
            return PersonalityTestResultDto(
                link = test.link,
                title = test.title
            )
        }
    }
}

data class ProfilePhotoDto(
    val id: String,
    val url: String,
    val displayOrder: Int,
    val isPrimary: Boolean
) {
    companion object {
        fun from(photo: ProfilePhoto): ProfilePhotoDto {
            return ProfilePhotoDto(
                id = photo.id.value.toString(),
                url = photo.url,
                displayOrder = photo.displayOrder,
                isPrimary = photo.isPrimary
            )
        }
    }
}
