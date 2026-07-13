package kr.ai.palette.presentation.profile

import kr.ai.palette.domain.profile.*
import kr.ai.palette.infrastructure.storage.FileStorageService
import java.time.Instant

data class AttachmentProfileDto(
    val contactAnxiety: Int,
    val intimacyAvoidance: Int,
    val conflictStyle: Int,
    val emotionExpression: Int,
    val independenceLevel: Int,
    val attachmentType: String,
    val attachmentTypeLabel: String,
    val attachmentTypeDescription: String,
    val attachmentTypeEmoji: String,
) {
    fun toDomain() = AttachmentProfile(
        contactAnxiety = contactAnxiety,
        intimacyAvoidance = intimacyAvoidance,
        conflictStyle = conflictStyle,
        emotionExpression = emotionExpression,
        independenceLevel = independenceLevel,
    )

    companion object {
        fun from(ap: AttachmentProfile) = AttachmentProfileDto(
            contactAnxiety = ap.contactAnxiety,
            intimacyAvoidance = ap.intimacyAvoidance,
            conflictStyle = ap.conflictStyle,
            emotionExpression = ap.emotionExpression,
            independenceLevel = ap.independenceLevel,
            attachmentType = ap.attachmentType.name,
            attachmentTypeLabel = ap.attachmentType.label,
            attachmentTypeDescription = ap.attachmentType.description,
            attachmentTypeEmoji = ap.attachmentType.emoji,
        )
    }
}

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
    val colorType: ColorTypeDto?,
    val attachmentProfile: AttachmentProfileDto?,
    val metadata: ProfileMetadataDto,
    val metrics: ProfileMetricsDto,
    val settings: ProfileSettingsDto
) {
    companion object {
        fun from(profile: Profile, storage: FileStorageService? = null): ProfileResponse {
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
                photos = profile.photos.map { ProfilePhotoDto.from(it, storage) },
                primaryPhotoUrl = profile.photos.firstOrNull { it.isPrimary }?.url?.let {
                    storage?.getPresignedDownloadUrl(it) ?: it
                },
                colorType = profile.colorType?.let { ColorTypeDto.from(it) },
                attachmentProfile = profile.attachmentProfile?.let { AttachmentProfileDto.from(it) },
                metadata = ProfileMetadataDto.from(profile.metadata),
                metrics = ProfileMetricsDto.from(profile.metrics),
                settings = ProfileSettingsDto.from(profile.settings)
            )
        }
    }
}

data class ColorTypeDto(
    val type: String?,
    val key: String?,
    val name: String?,
    val hex: String?,
    val description: String?,
    val reasoning: String? = null,
    val personalitySummary: String? = null,
    val idealTypeInsight: String? = null,
    val strengths: List<String>? = null,
) {
    companion object {
        private val ENUM_TO_KEY = mapOf(
            "WARM_ORANGE"       to "orange",
            "CALM_BLUE"         to "blue",
            "VIBRANT_RED"       to "red",
            "SOFT_PINK"         to "pink",
            "FRESH_GREEN"       to "green",
            "ELEGANT_PURPLE"    to "purple",
            "BRIGHT_YELLOW"     to "yellow",
            "SOPHISTICATED_GRAY" to "gray",
        )

        fun from(ct: ColorType) = ColorTypeDto(
            type = ct.type?.name,
            key  = ct.type?.name?.let { ENUM_TO_KEY[it] },
            name = ct.name,
            hex  = ct.hex,
            description = ct.description,
            reasoning = ct.reasoning,
            personalitySummary = ct.personalitySummary,
            idealTypeInsight = ct.idealTypeInsight,
            strengths = ct.strengths,
        )
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
    val settings: ProfileSettingsDto?,
    val attachmentProfile: AttachmentProfileDto?
)

data class UpdateSettingsRequest(
    val isAcceptingMatches: Boolean? = null,
    val detailsVisibleToFriends: Boolean? = null,
    val publicDiscoverable: Boolean? = null   // 팔레트 Pick 공개 발견 풀 opt-in/out (ADR 0072)
)

data class BasicInfoDto(
    val height: Int?,
    val bodyType: String?,
    val mbti: String?
) {
    fun toDomain(): BasicInfo {
        return BasicInfo(
            height = height,
            bodyType = bodyType,   // ADR 0057 — 코드 문자열 직통
            mbti = mbti?.let { MBTI.valueOf(it) }
        )
    }

    companion object {
        fun from(basicInfo: BasicInfo): BasicInfoDto {
            return BasicInfoDto(
                height = basicInfo.height,
                bodyType = basicInfo.bodyType,
                mbti = basicInfo.mbti?.name
            )
        }
    }
}

data class CareerInfoDto(
    val category: String?,
    val company: String?,
    val position: String? = null,   // DA-002 — 직책·직급 자유 텍스트
    val incomeRange: String?
) {
    fun toDomain(): CareerInfo {
        return CareerInfo(
            category = category?.let { CareerCategory.valueOf(it) },
            company = company,
            position = position,
            incomeRange = incomeRange?.let { IncomeRange.valueOf(it) }
        )
    }

    companion object {
        fun from(careerInfo: CareerInfo): CareerInfoDto {
            return CareerInfoDto(
                category = careerInfo.category?.name,
                company = careerInfo.company,
                position = careerInfo.position,
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
    val sigungu: String?,
    val workSido: String? = null,
    val workSigungu: String? = null,
) {
    fun toDomain(): LocationInfo {
        return LocationInfo(sido = sido, sigungu = sigungu, workSido = workSido, workSigungu = workSigungu)
    }

    companion object {
        fun from(locationInfo: LocationInfo): LocationInfoDto {
            return LocationInfoDto(sido = locationInfo.sido, sigungu = locationInfo.sigungu, workSido = locationInfo.workSido, workSigungu = locationInfo.workSigungu)
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
            smoking = smoking,   // ADR 0057 — 코드 문자열 직통
            drinking = drinking,
            religion = religion
        )
    }

    companion object {
        fun from(lifestyleInfo: LifestyleInfo): LifestyleInfoDto {
            return LifestyleInfoDto(
                smoking = lifestyleInfo.smoking,
                drinking = lifestyleInfo.drinking,
                religion = lifestyleInfo.religion
            )
        }
    }
}

data class IntroductionDto(
    val text: String?,
    val interests: List<String>?,
    val interviewAnswers: InterviewAnswersDto?,
    val datingStyle: Map<String, String>? = null // questionKey -> selectedOptionKey
) {
    fun toDomain(): Introduction {
        return Introduction(
            text = text,
            interests = interests ?: emptyList(),
            interviewAnswers = interviewAnswers?.toDomain(),
            datingStyle = datingStyle ?: emptyMap()
        )
    }

    companion object {
        fun from(introduction: Introduction): IntroductionDto {
            return IntroductionDto(
                text = introduction.text,
                interests = introduction.interests,
                interviewAnswers = introduction.interviewAnswers?.let { InterviewAnswersDto.from(it) },
                datingStyle = introduction.datingStyle.ifEmpty { null }
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
    val datePreferences: List<String> = emptyList(), // 하위호환용
    val importantValues: List<String>, // ImportantValue enum values (max 3)
    val personalities: List<String>, // max 5
    val appearanceStyles: List<String>, // MaleAppearanceStyle or FemaleAppearanceStyle enum values
    val dealBreakers: List<String>, // DealBreaker enum values (max 3)
    val bucketList: List<String> = emptyList(), // 시스템 키 or "custom:..." (max 10)
    // DA-001 — 나이/키 범위. 미설정 시 null (제한 없음)
    val ageMin: Int? = null,
    val ageMax: Int? = null,
    val heightMin: Int? = null,
    val heightMax: Int? = null,
) {
    fun toDomain(): IdealType {
        return IdealType(
            // ADR 0057 — 코드 문자열 리스트 직통 (어드민 신규 옵션 허용)
            datePreferences = datePreferences,
            importantValues = importantValues,
            personalities = personalities,
            appearanceStyles = appearanceStyles,
            dealBreakers = dealBreakers,
            bucketList = bucketList,
            ageMin = ageMin,
            ageMax = ageMax,
            heightMin = heightMin,
            heightMax = heightMax,
        )
    }

    companion object {
        fun from(idealType: IdealType): IdealTypeDto {
            return IdealTypeDto(
                datePreferences = idealType.datePreferences,
                importantValues = idealType.importantValues,
                personalities = idealType.personalities,
                appearanceStyles = idealType.appearanceStyles,
                dealBreakers = idealType.dealBreakers,
                bucketList = idealType.bucketList,
                ageMin = idealType.ageMin,
                ageMax = idealType.ageMax,
                heightMin = idealType.heightMin,
                heightMax = idealType.heightMax,
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
    val hiddenAt: Instant?,
    val detailsVisibleToFriends: Boolean = false,
    val publicDiscoverable: Boolean = true   // 팔레트 Pick 공개 발견 풀 노출 (ADR 0072, 기본 ON)
) {
    fun toDomain(): ProfileSettings {
        return ProfileSettings(
            isAcceptingMatches = isAcceptingMatches,
            hiddenAt = hiddenAt,
            detailsVisibleToFriends = detailsVisibleToFriends,
            publicDiscoverable = publicDiscoverable
        )
    }

    companion object {
        fun from(settings: ProfileSettings): ProfileSettingsDto {
            return ProfileSettingsDto(
                isAcceptingMatches = settings.isAcceptingMatches,
                hiddenAt = settings.hiddenAt,
                detailsVisibleToFriends = settings.detailsVisibleToFriends,
                publicDiscoverable = settings.publicDiscoverable
            )
        }
    }
}

data class ToggleVisibilityRequest(
    val visible: Boolean
)

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
    val isPrimary: Boolean,
    /** 운영자가 콕 집어 반려(재촬영 요청)한 사진 (ADR 0060) */
    val rejected: Boolean = false
) {
    companion object {
        fun from(photo: ProfilePhoto, storage: FileStorageService? = null): ProfilePhotoDto {
            // storage 주어지면 presigned URL로 변환, 아니면 원본 그대로 (legacy 호환)
            val resolvedUrl = storage?.getPresignedDownloadUrl(photo.url) ?: photo.url
            return ProfilePhotoDto(
                id = photo.id.value.toString(),
                url = resolvedUrl,
                displayOrder = photo.displayOrder,
                isPrimary = photo.isPrimary,
                rejected = photo.rejected
            )
        }
    }
}
