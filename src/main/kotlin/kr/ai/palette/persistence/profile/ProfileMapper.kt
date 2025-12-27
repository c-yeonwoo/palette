package kr.ai.palette.persistence.profile

import tools.jackson.databind.ObjectMapper
import tools.jackson.module.kotlin.readValue
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.profile.*
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class ProfileMapper(
    private val objectMapper: ObjectMapper
) {

    fun toDomain(entity: ProfileEntity): Profile {
        return Profile(
            id = ProfileId(entity.id),
            userId = UserId(entity.userId),
            basicInfo = BasicInfo(
                height = entity.height,
                bodyType = entity.bodyType?.toDomain(),
                mbti = entity.mbti.toDomain()
            ),
            careerInfo = CareerInfo(
                category = entity.careerCategory?.toDomain(),
                company = entity.company,
                incomeRange = entity.incomeRange?.toDomain()
            ),
            educationInfo = EducationInfo(
                level = entity.educationLevel?.toDomain(),
                school = entity.school,
                major = entity.major
            ),
            locationInfo = LocationInfo(
                sido = entity.sido,
                sigungu = entity.sigungu
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = entity.smoking?.toDomain(),
                drinking = entity.drinking?.toDomain(),
                religion = entity.religion?.toDomain()
            ),
            introduction = Introduction(
                text = null,
                interests = entity.interests?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
                interviewAnswers = if (entity.introductionHobby != null || entity.introductionCharm != null ||
                    entity.introductionPassion != null || entity.introductionHappiness != null || entity.introductionMotto != null) {
                    InterviewAnswers(
                        hobby = entity.introductionHobby,
                        charm = entity.introductionCharm,
                        passion = entity.introductionPassion,
                        happiness = entity.introductionHappiness,
                        motto = entity.introductionMotto
                    )
                } else null
            ),
            idealType = IdealType(
                datePreferences = entity.idealDatePreferences?.split(",")
                    ?.filter { it.isNotBlank() }
                    ?.mapNotNull { try { DatePreference.valueOf(it) } catch (e: Exception) { null } }
                    ?: emptyList(),
                importantValues = entity.idealImportantValues?.split(",")
                    ?.filter { it.isNotBlank() }
                    ?.mapNotNull { try { ImportantValue.valueOf(it) } catch (e: Exception) { null } }
                    ?: emptyList(),
                personalities = entity.idealPersonalities?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
                appearanceStyles = entity.idealAppearanceStyles?.split(",")?.filter { it.isNotBlank() } ?: emptyList(),
                dealBreakers = entity.idealDealBreakers?.split(",")
                    ?.filter { it.isNotBlank() }
                    ?.mapNotNull { try { DealBreaker.valueOf(it) } catch (e: Exception) { null } }
                    ?: emptyList()
            ),
            photos = emptyList(), // Photos are managed separately
            videos = emptyList(), // Videos are managed separately
            personalityTests = parsePersonalityTests(entity.personalityTests),
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
        val serializedTests = serializePersonalityTests(profile.personalityTests)
        println(">>> toEntity: profile.personalityTests = ${profile.personalityTests}")
        println(">>> toEntity: serializedTests = ${serializedTests}")

        return ProfileEntity(
            id = profile.id.value,
            userId = profile.userId.value,
            height = profile.basicInfo.height,
            bodyType = profile.basicInfo.bodyType?.toEntity(),
            mbti = profile.basicInfo.mbti.toEntity(),
            careerCategory = profile.careerInfo.category?.toEntity(),
            company = profile.careerInfo.company,
            incomeRange = profile.careerInfo.incomeRange?.toEntity(),
            educationLevel = profile.educationInfo.level?.toEntity(),
            school = profile.educationInfo.school,
            major = profile.educationInfo.major,
            sido = profile.locationInfo.sido,
            sigungu = profile.locationInfo.sigungu,
            smoking = profile.lifestyleInfo.smoking?.toEntity(),
            drinking = profile.lifestyleInfo.drinking?.toEntity(),
            religion = profile.lifestyleInfo.religion?.toEntity(),
            interests = profile.introduction.interests.joinToString(","),
            introductionHobby = profile.introduction.interviewAnswers?.hobby,
            introductionCharm = profile.introduction.interviewAnswers?.charm,
            introductionPassion = profile.introduction.interviewAnswers?.passion,
            introductionHappiness = profile.introduction.interviewAnswers?.happiness,
            introductionMotto = profile.introduction.interviewAnswers?.motto,
            idealDatePreferences = profile.idealType.datePreferences.joinToString(",") { it.name },
            idealImportantValues = profile.idealType.importantValues.joinToString(",") { it.name },
            idealPersonalities = profile.idealType.personalities.joinToString(","),
            idealAppearanceStyles = profile.idealType.appearanceStyles.joinToString(","),
            idealDealBreakers = profile.idealType.dealBreakers.joinToString(",") { it.name },
            personalityTests = serializedTests,
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

    private fun MBTIEntity.toDomain(): MBTI = MBTI.valueOf(this.name)
    private fun MBTI.toEntity(): MBTIEntity = MBTIEntity.valueOf(this.name)

    private fun CareerCategoryEntity.toDomain(): CareerCategory = CareerCategory.valueOf(this.name)
    private fun CareerCategory.toEntity(): CareerCategoryEntity = CareerCategoryEntity.valueOf(this.name)

    private fun IncomeRangeEntity.toDomain(): IncomeRange = IncomeRange.valueOf(this.name)
    private fun IncomeRange.toEntity(): IncomeRangeEntity = IncomeRangeEntity.valueOf(this.name)

    private fun EducationLevelEntity.toDomain(): EducationLevel = EducationLevel.valueOf(this.name)
    private fun EducationLevel.toEntity(): EducationLevelEntity = EducationLevelEntity.valueOf(this.name)

    private fun FrequencyEntity.toDomain(): Frequency = Frequency.valueOf(this.name)
    private fun Frequency.toEntity(): FrequencyEntity = FrequencyEntity.valueOf(this.name)

    private fun ReligionEntity.toDomain(): Religion = Religion.valueOf(this.name)
    private fun Religion.toEntity(): ReligionEntity = ReligionEntity.valueOf(this.name)

    // JSON serialization for personality tests
    private fun parsePersonalityTests(json: String?): List<PersonalityTestResult> {
        if (json.isNullOrBlank()) return emptyList()
        return try {
            val testDtos: List<PersonalityTestDto> = objectMapper.readValue(json)
            testDtos.map { it.toDomain() }
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun serializePersonalityTests(tests: List<PersonalityTestResult>): String? {
        println(">>> serializePersonalityTests: input tests = ${tests}, size = ${tests.size}")
        if (tests.isEmpty()) {
            println(">>> serializePersonalityTests: tests is empty, returning null")
            return null
        }
        return try {
            val testDtos = tests.map { PersonalityTestDto.from(it) }
            println(">>> serializePersonalityTests: testDtos = ${testDtos}")
            val json = objectMapper.writeValueAsString(testDtos)
            println(">>> serializePersonalityTests: serialized JSON = ${json}")
            json
        } catch (e: Exception) {
            println(">>> serializePersonalityTests: ERROR - ${e.message}")
            e.printStackTrace()
            null
        }
    }
}

// DTO for JSON serialization
data class PersonalityTestDto(
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
        fun from(test: PersonalityTestResult): PersonalityTestDto {
            return PersonalityTestDto(
                link = test.link,
                title = test.title
            )
        }
    }
}
