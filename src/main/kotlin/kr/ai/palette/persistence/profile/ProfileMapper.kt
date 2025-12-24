package kr.ai.palette.persistence.profile

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.*
import org.springframework.stereotype.Component

@Component
class ProfileMapper {

    fun toDomain(entity: ProfileEntity): Profile {
        return Profile(
            id = ProfileId(entity.id),
            userId = UserId(entity.userId),
            basicInfo = BasicInfo(
                height = entity.height,
                bodyType = entity.bodyType?.toDomain()
            ),
            careerInfo = CareerInfo(
                category = entity.careerCategory?.toDomain(),
                company = entity.company,
                position = entity.position
            ),
            educationInfo = EducationInfo(
                level = entity.educationLevel?.toDomain(),
                school = entity.school,
                major = entity.major
            ),
            locationInfo = LocationInfo(
                sido = entity.sido,
                sigungu = entity.sigungu,
                hometownSido = entity.hometownSido,
                hometownSigungu = entity.hometownSigungu
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = entity.smoking?.toDomain(),
                drinking = entity.drinking?.toDomain(),
                religion = entity.religion?.toDomain()
            ),
            introduction = Introduction(
                text = entity.introductionText,
                interests = entity.interests?.split(",")?.filter { it.isNotBlank() } ?: emptyList()
            ),
            idealType = IdealType(
                ageRange = if (entity.idealAgeMin != null && entity.idealAgeMax != null)
                    AgeRange(entity.idealAgeMin!!, entity.idealAgeMax!!) else null,
                heightRange = if (entity.idealHeightMin != null && entity.idealHeightMax != null)
                    HeightRange(entity.idealHeightMin!!, entity.idealHeightMax!!) else null,
                bodyTypes = entity.idealBodyTypes?.split(",")
                    ?.filter { it.isNotBlank() }
                    ?.map { BodyType.valueOf(it) }
                    ?: emptyList(),
                personalities = entity.idealPersonalities?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
                dateStyle = entity.idealDateStyle?.toDomain(),
                purpose = entity.idealPurpose?.toDomain(),
                dealBreakers = entity.idealDealBreakers
            ),
            photos = emptyList(), // Photos are managed separately
            videos = emptyList(), // Videos are managed separately
            metadata = ProfileMetadata(
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt,
                lastAccessedAt = entity.lastAccessedAt,
                deletedAt = entity.deletedAt
            ),
            metrics = ProfileMetrics(
                completionRate = entity.completionRate,
                trustScore = entity.trustScore,
                viewCount = entity.viewCount
            ),
            settings = ProfileSettings(
                isAcceptingMatches = entity.isAcceptingMatches,
                hiddenAt = entity.hiddenAt
            )
        )
    }

    fun toEntity(profile: Profile): ProfileEntity {
        return ProfileEntity(
            id = profile.id.value,
            userId = profile.userId.value,
            height = profile.basicInfo.height,
            bodyType = profile.basicInfo.bodyType?.toEntity(),
            careerCategory = profile.careerInfo.category?.toEntity(),
            company = profile.careerInfo.company,
            position = profile.careerInfo.position,
            educationLevel = profile.educationInfo.level?.toEntity(),
            school = profile.educationInfo.school,
            major = profile.educationInfo.major,
            sido = profile.locationInfo.sido,
            sigungu = profile.locationInfo.sigungu,
            hometownSido = profile.locationInfo.hometownSido,
            hometownSigungu = profile.locationInfo.hometownSigungu,
            smoking = profile.lifestyleInfo.smoking?.toEntity(),
            drinking = profile.lifestyleInfo.drinking?.toEntity(),
            religion = profile.lifestyleInfo.religion?.toEntity(),
            introductionText = profile.introduction.text,
            interests = profile.introduction.interests.joinToString(","),
            idealAgeMin = profile.idealType.ageRange?.min,
            idealAgeMax = profile.idealType.ageRange?.max,
            idealHeightMin = profile.idealType.heightRange?.min,
            idealHeightMax = profile.idealType.heightRange?.max,
            idealBodyTypes = profile.idealType.bodyTypes.joinToString(","),
            idealPersonalities = profile.idealType.personalities.joinToString(","),
            idealDateStyle = profile.idealType.dateStyle?.toEntity(),
            idealPurpose = profile.idealType.purpose?.toEntity(),
            idealDealBreakers = profile.idealType.dealBreakers,
            createdAt = profile.metadata.createdAt,
            updatedAt = profile.metadata.updatedAt,
            lastAccessedAt = profile.metadata.lastAccessedAt,
            deletedAt = profile.metadata.deletedAt,
            completionRate = profile.metrics.completionRate,
            trustScore = profile.metrics.trustScore,
            viewCount = profile.metrics.viewCount,
            isAcceptingMatches = profile.settings.isAcceptingMatches,
            hiddenAt = profile.settings.hiddenAt
        )
    }

    // Enum conversions
    private fun BodyTypeEntity.toDomain(): BodyType = BodyType.valueOf(this.name)
    private fun BodyType.toEntity(): BodyTypeEntity = BodyTypeEntity.valueOf(this.name)

    private fun CareerCategoryEntity.toDomain(): CareerCategory = CareerCategory.valueOf(this.name)
    private fun CareerCategory.toEntity(): CareerCategoryEntity = CareerCategoryEntity.valueOf(this.name)

    private fun EducationLevelEntity.toDomain(): EducationLevel = EducationLevel.valueOf(this.name)
    private fun EducationLevel.toEntity(): EducationLevelEntity = EducationLevelEntity.valueOf(this.name)

    private fun FrequencyEntity.toDomain(): Frequency = Frequency.valueOf(this.name)
    private fun Frequency.toEntity(): FrequencyEntity = FrequencyEntity.valueOf(this.name)

    private fun ReligionEntity.toDomain(): Religion = Religion.valueOf(this.name)
    private fun Religion.toEntity(): ReligionEntity = ReligionEntity.valueOf(this.name)

    private fun DateStyleEntity.toDomain(): DateStyle = DateStyle.valueOf(this.name)
    private fun DateStyle.toEntity(): DateStyleEntity = DateStyleEntity.valueOf(this.name)

    private fun DatingPurposeEntity.toDomain(): DatingPurpose = DatingPurpose.valueOf(this.name)
    private fun DatingPurpose.toEntity(): DatingPurposeEntity = DatingPurposeEntity.valueOf(this.name)
}
