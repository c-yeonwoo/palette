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
                mbti = entity.mbti?.toDomain()
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
                sigungu = entity.sigungu,
                hometownSido = entity.hometownSido,
                hometownSigungu = entity.hometownSigungu,
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = entity.smoking?.toDomain(),
                drinking = entity.drinking?.toDomain(),
                religion = entity.religion?.toDomain()
            ),
            introduction = Introduction(
                text = entity.introductionText,
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
                } else null,
                datingStyle = parseDatingStyle(entity.tasteStack) // DB 컬럼 재사용
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
                    ?: emptyList(),
                bucketList = parseBucketList(entity.bucketList)
            ),
            photos = emptyList(), // Photos are managed separately
            videos = emptyList(), // Videos are managed separately
            personalityTests = parsePersonalityTests(entity.personalityTests),
            colorType = entity.colorType?.let { ct ->
                val enumVal = runCatching { ColorTypeEnum.valueOf(ct) }.getOrNull()
                val info = mapOf(
                    ColorTypeEnum.WARM_ORANGE to Triple("따뜻한 오렌지", "#F97316", "활발하고 다정한 당신은 주변을 밝게 만드는 에너지가 있어요"),
                    ColorTypeEnum.CALM_BLUE to Triple("차분한 블루", "#3B82F6", "신중하고 깊이있는 당신은 믿음직한 존재감을 가지고 있어요"),
                    ColorTypeEnum.VIBRANT_RED to Triple("생동감있는 레드", "#EF4444", "열정적이고 적극적인 당신은 삶을 가득 채우는 에너지가 넘쳐요"),
                    ColorTypeEnum.SOFT_PINK to Triple("부드러운 핑크", "#F9A8D4", "섬세하고 낭만적인 당신은 감성이 풍부하고 따뜻한 마음을 가졌어요"),
                    ColorTypeEnum.FRESH_GREEN to Triple("신선한 그린", "#22C55E", "자연스럽고 편안한 당신은 함께 있으면 마음이 편안해지는 사람이에요"),
                    ColorTypeEnum.ELEGANT_PURPLE to Triple("고급스러운 퍼플", "#A855F7", "지적이고 감각적인 당신은 독특한 매력과 깊은 내면을 가지고 있어요"),
                    ColorTypeEnum.BRIGHT_YELLOW to Triple("밝은 옐로우", "#EAB308", "긍정적이고 유쾌한 당신은 어디서든 분위기를 밝게 만드는 존재예요"),
                    ColorTypeEnum.SOPHISTICATED_GRAY to Triple("세련된 그레이", "#6B7280", "이성적이고 프로페셔널한 당신은 어떤 상황에도 신뢰를 주는 사람이에요")
                )
                val triple = info[enumVal]
                ColorType(type = enumVal, name = triple?.first, hex = triple?.second, description = triple?.third)
            },
            attachmentProfile = if (entity.attachmentContactAnxiety != null) {
                AttachmentProfile(
                    contactAnxiety = entity.attachmentContactAnxiety ?: 50,
                    intimacyAvoidance = entity.attachmentIntimacyAvoidance ?: 50,
                    conflictStyle = entity.attachmentConflictStyle ?: 50,
                    emotionExpression = entity.attachmentEmotionExpression ?: 50,
                    independenceLevel = entity.attachmentIndependenceLevel ?: 50,
                )
            } else null,
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

        return ProfileEntity(
            id = profile.id.value,
            userId = profile.userId.value,
            height = profile.basicInfo.height,
            bodyType = profile.basicInfo.bodyType?.toEntity(),
            mbti = profile.basicInfo.mbti?.toEntity(),
            careerCategory = profile.careerInfo.category?.toEntity(),
            company = profile.careerInfo.company,
            incomeRange = profile.careerInfo.incomeRange?.toEntity(),
            educationLevel = profile.educationInfo.level?.toEntity(),
            school = profile.educationInfo.school,
            major = profile.educationInfo.major,
            sido = profile.locationInfo.sido,
            sigungu = profile.locationInfo.sigungu,
            hometownSido = profile.locationInfo.hometownSido,
            hometownSigungu = profile.locationInfo.hometownSigungu,
            introductionText = profile.introduction.text,
            smoking = profile.lifestyleInfo.smoking?.toEntity(),
            drinking = profile.lifestyleInfo.drinking?.toEntity(),
            religion = profile.lifestyleInfo.religion?.toEntity(),
            interests = profile.introduction.interests.joinToString(","),
            introductionHobby = profile.introduction.interviewAnswers?.hobby,
            introductionCharm = profile.introduction.interviewAnswers?.charm,
            introductionPassion = profile.introduction.interviewAnswers?.passion,
            introductionHappiness = profile.introduction.interviewAnswers?.happiness,
            introductionMotto = profile.introduction.interviewAnswers?.motto,
            tasteStack = serializeDatingStyle(profile.introduction.datingStyle),
            idealDatePreferences = profile.idealType.datePreferences.joinToString(",") { it.name },
            idealImportantValues = profile.idealType.importantValues.joinToString(",") { it.name },
            idealPersonalities = profile.idealType.personalities.joinToString(","),
            idealAppearanceStyles = profile.idealType.appearanceStyles.joinToString(","),
            idealDealBreakers = profile.idealType.dealBreakers.joinToString(",") { it.name },
            bucketList = serializeBucketList(profile.idealType.bucketList),
            personalityTests = serializedTests,
            colorType = profile.colorType?.type?.name,
            createdAt = profile.metadata.createdAt,
            updatedAt = profile.metadata.updatedAt,
            lastAccessedAt = profile.metadata.lastAccessedAt,
            deletedAt = profile.metadata.deletedAt,
            completionRate = profile.metrics.completionRate,
            trustScore = profile.metrics.trustScore,
            viewCount = profile.metrics.viewCount,
            isAcceptingMatches = profile.settings.isAcceptingMatches,
            hiddenAt = profile.settings.hiddenAt,
            attachmentContactAnxiety = profile.attachmentProfile?.contactAnxiety,
            attachmentIntimacyAvoidance = profile.attachmentProfile?.intimacyAvoidance,
            attachmentConflictStyle = profile.attachmentProfile?.conflictStyle,
            attachmentEmotionExpression = profile.attachmentProfile?.emotionExpression,
            attachmentIndependenceLevel = profile.attachmentProfile?.independenceLevel,
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

    // JSON serialization for dating style (questionKey -> optionKey)
    @Suppress("UNCHECKED_CAST")
    private fun parseDatingStyle(json: String?): Map<String, String> {
        if (json.isNullOrBlank()) return emptyMap()
        return try {
            objectMapper.readValue(json, Map::class.java) as Map<String, String>
        } catch (e: Exception) {
            emptyMap()
        }
    }

    private fun serializeDatingStyle(style: Map<String, String>): String? {
        if (style.isEmpty()) return null
        return try { objectMapper.writeValueAsString(style) } catch (e: Exception) { null }
    }

    // JSON serialization for bucket list
    @Suppress("UNCHECKED_CAST")
    private fun parseBucketList(json: String?): List<String> {
        if (json.isNullOrBlank()) return emptyList()
        return try {
            objectMapper.readValue(json, List::class.java) as List<String>
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun serializeBucketList(list: List<String>): String? {
        if (list.isEmpty()) return null
        return try { objectMapper.writeValueAsString(list) } catch (e: Exception) { null }
    }

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
            objectMapper.writeValueAsString(testDtos)
        } catch (e: Exception) {
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
