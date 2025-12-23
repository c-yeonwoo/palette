package kr.ai.palette.persistence.profile

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.jacksonObjectMapper
import tools.jackson.module.kotlin.readValue
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.*
import org.springframework.stereotype.Component

@Component
class ProfileMapper {

    private val objectMapper: ObjectMapper = jacksonObjectMapper()

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
                company = entity.careerCompany,
                position = entity.careerPosition
            ),
            educationInfo = EducationInfo(
                level = entity.educationLevel?.toDomain(),
                school = entity.educationSchool,
                major = entity.educationMajor
            ),
            locationInfo = LocationInfo(
                sido = entity.locationSido,
                sigungu = entity.locationSigungu,
                hometownSido = entity.hometownSido,
                hometownSigungu = entity.hometownSigungu
            ),
            introduction = Introduction(
                text = entity.introduction,
                interests = parseJsonArray(entity.interests)
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = entity.smoking?.toDomain(),
                drinking = entity.drinking?.toDomain(),
                religion = entity.religion?.toDomain()
            ),
            idealType = IdealType(
                ageRange = if (entity.idealAgeMin != null && entity.idealAgeMax != null) {
                    AgeRange(entity.idealAgeMin!!, entity.idealAgeMax!!)
                } else null,
                heightRange = if (entity.idealHeightMin != null && entity.idealHeightMax != null) {
                    HeightRange(entity.idealHeightMin!!, entity.idealHeightMax!!)
                } else null,
                bodyTypes = parseJsonArray(entity.idealBodyTypes).mapNotNull {
                    try {
                        BodyType.valueOf(it)
                    } catch (e: IllegalArgumentException) {
                        null
                    }
                },
                personalities = parseJsonArray(entity.idealPersonalities),
                dateStyle = entity.idealDateStyle?.toDomain(),
                purpose = entity.idealPurpose?.toDomain(),
                dealBreakers = entity.idealDealBreakers
            ),
            colorType = ColorType(
                type = entity.colorType?.toDomain(),
                name = entity.colorName,
                hex = entity.colorHex,
                description = entity.colorDescription
            ),
            metrics = ProfileMetrics(
                completionRate = entity.completionRate,
                trustScore = entity.trustScore,
                viewCount = entity.viewCount
            ),
            settings = ProfileSettings(
                isAcceptingMatches = entity.isAcceptingMatches,
                hiddenAt = entity.hiddenAt
            ),
            metadata = ProfileMetadata(
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt,
                lastAccessedAt = entity.lastAccessedAt,
                deletedAt = entity.deletedAt
            )
        )
    }

    fun toEntity(domain: Profile): ProfileEntity {
        return ProfileEntity(
            id = domain.id.value,
            userId = domain.userId.value,
            height = domain.basicInfo.height,
            bodyType = domain.basicInfo.bodyType?.toEntity(),
            careerCategory = domain.careerInfo.category?.toEntity(),
            careerCompany = domain.careerInfo.company,
            careerPosition = domain.careerInfo.position,
            educationLevel = domain.educationInfo.level?.toEntity(),
            educationSchool = domain.educationInfo.school,
            educationMajor = domain.educationInfo.major,
            locationSido = domain.locationInfo.sido,
            locationSigungu = domain.locationInfo.sigungu,
            hometownSido = domain.locationInfo.hometownSido,
            hometownSigungu = domain.locationInfo.hometownSigungu,
            introduction = domain.introduction.text,
            interests = toJsonArray(domain.introduction.interests),
            smoking = domain.lifestyleInfo.smoking?.toEntity(),
            drinking = domain.lifestyleInfo.drinking?.toEntity(),
            religion = domain.lifestyleInfo.religion?.toEntity(),
            idealAgeMin = domain.idealType.ageRange?.min,
            idealAgeMax = domain.idealType.ageRange?.max,
            idealHeightMin = domain.idealType.heightRange?.min,
            idealHeightMax = domain.idealType.heightRange?.max,
            idealBodyTypes = toJsonArray(domain.idealType.bodyTypes.map { it.name }),
            idealPersonalities = toJsonArray(domain.idealType.personalities),
            idealDateStyle = domain.idealType.dateStyle?.toEntity(),
            idealPurpose = domain.idealType.purpose?.toEntity(),
            idealDealBreakers = domain.idealType.dealBreakers,
            colorType = domain.colorType.type?.toEntity(),
            colorName = domain.colorType.name,
            colorHex = domain.colorType.hex,
            colorDescription = domain.colorType.description,
            completionRate = domain.metrics.completionRate,
            trustScore = domain.metrics.trustScore,
            viewCount = domain.metrics.viewCount,
            isAcceptingMatches = domain.settings.isAcceptingMatches,
            hiddenAt = domain.settings.hiddenAt,
            createdAt = domain.metadata.createdAt,
            updatedAt = domain.metadata.updatedAt,
            lastAccessedAt = domain.metadata.lastAccessedAt,
            deletedAt = domain.metadata.deletedAt
        )
    }

    fun updateEntity(entity: ProfileEntity, domain: Profile) {
        entity.userId = domain.userId.value
        entity.height = domain.basicInfo.height
        entity.bodyType = domain.basicInfo.bodyType?.toEntity()
        entity.careerCategory = domain.careerInfo.category?.toEntity()
        entity.careerCompany = domain.careerInfo.company
        entity.careerPosition = domain.careerInfo.position
        entity.educationLevel = domain.educationInfo.level?.toEntity()
        entity.educationSchool = domain.educationInfo.school
        entity.educationMajor = domain.educationInfo.major
        entity.locationSido = domain.locationInfo.sido
        entity.locationSigungu = domain.locationInfo.sigungu
        entity.hometownSido = domain.locationInfo.hometownSido
        entity.hometownSigungu = domain.locationInfo.hometownSigungu
        entity.introduction = domain.introduction.text
        entity.interests = toJsonArray(domain.introduction.interests)
        entity.smoking = domain.lifestyleInfo.smoking?.toEntity()
        entity.drinking = domain.lifestyleInfo.drinking?.toEntity()
        entity.religion = domain.lifestyleInfo.religion?.toEntity()
        entity.idealAgeMin = domain.idealType.ageRange?.min
        entity.idealAgeMax = domain.idealType.ageRange?.max
        entity.idealHeightMin = domain.idealType.heightRange?.min
        entity.idealHeightMax = domain.idealType.heightRange?.max
        entity.idealBodyTypes = toJsonArray(domain.idealType.bodyTypes.map { it.name })
        entity.idealPersonalities = toJsonArray(domain.idealType.personalities)
        entity.idealDateStyle = domain.idealType.dateStyle?.toEntity()
        entity.idealPurpose = domain.idealType.purpose?.toEntity()
        entity.idealDealBreakers = domain.idealType.dealBreakers
        entity.colorType = domain.colorType.type?.toEntity()
        entity.colorName = domain.colorType.name
        entity.colorHex = domain.colorType.hex
        entity.colorDescription = domain.colorType.description
        entity.completionRate = domain.metrics.completionRate
        entity.trustScore = domain.metrics.trustScore
        entity.viewCount = domain.metrics.viewCount
        entity.isAcceptingMatches = domain.settings.isAcceptingMatches
        entity.hiddenAt = domain.settings.hiddenAt
        entity.updatedAt = domain.metadata.updatedAt
        entity.lastAccessedAt = domain.metadata.lastAccessedAt
        entity.deletedAt = domain.metadata.deletedAt
    }

    private fun parseJsonArray(json: String?): List<String> {
        if (json.isNullOrBlank()) return emptyList()
        return try {
            objectMapper.readValue<List<String>>(json)
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun toJsonArray(list: List<String>): String? {
        if (list.isEmpty()) return null
        return try {
            objectMapper.writeValueAsString(list)
        } catch (e: Exception) {
            null
        }
    }
}

// Extension functions for enum conversion
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

private fun ColorTypeEntity.toDomain(): ColorTypeEnum = ColorTypeEnum.valueOf(this.name)
private fun ColorTypeEnum.toEntity(): ColorTypeEntity = ColorTypeEntity.valueOf(this.name)
