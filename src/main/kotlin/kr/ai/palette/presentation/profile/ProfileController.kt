package kr.ai.palette.presentation.profile

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.matchmaker.*
import kr.ai.palette.domain.profile.*
import kr.ai.palette.domain.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.net.URI
import java.time.Instant
import java.util.*

@RestController
@RequestMapping("/api/v1/profiles")
class ProfileController(
    private val profileRepository: ProfileRepository,
    private val matchmakerRepository: MatchmakerRepository,
    private val userRepository: UserRepository
) {

    @PostMapping
    @Transactional
    fun createProfile(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: CreateProfileRequest
    ): ResponseEntity<ProfileResponse> {
        // 이미 Profile이 존재하는지 확인
        if (profileRepository.existsByUserId(authUser.userId)) {
            return ResponseEntity.badRequest().build()
        }

        // Profile 생성
        val now = Instant.now()
        val profile = Profile(
            id = ProfileId(UUID.randomUUID()),
            userId = authUser.userId,
            basicInfo = BasicInfo(
                height = request.height,
                bodyType = request.bodyType
            ),
            careerInfo = CareerInfo(
                category = request.careerCategory,
                company = request.company,
                position = request.position
            ),
            educationInfo = EducationInfo(
                level = request.educationLevel,
                school = request.school,
                major = request.major
            ),
            locationInfo = LocationInfo(
                sido = request.sido,
                sigungu = request.sigungu,
                hometownSido = request.hometownSido,
                hometownSigungu = request.hometownSigungu
            ),
            introduction = Introduction(
                text = request.introductionText,
                interests = request.interests ?: emptyList()
            ),
            lifestyleInfo = LifestyleInfo(
                smoking = request.smoking,
                drinking = request.drinking,
                religion = request.religion
            ),
            idealType = IdealType(
                ageRange = request.idealAgeRange,
                heightRange = request.idealHeightRange,
                bodyTypes = request.idealBodyTypes ?: emptyList(),
                personalities = request.idealPersonalities ?: emptyList(),
                dateStyle = request.idealDateStyle,
                purpose = request.idealPurpose,
                dealBreakers = request.idealDealBreakers
            ),
            colorType = ColorType(
                type = request.colorType,
                name = null,
                hex = null,
                description = null
            ),
            metrics = ProfileMetrics.initial(),
            settings = ProfileSettings.initial(),
            metadata = ProfileMetadata(
                createdAt = now,
                updatedAt = now,
                lastAccessedAt = now,
                deletedAt = null
            )
        )

        val savedProfile = profileRepository.save(profile)

        // Matchmaker도 함께 생성 (일반 유저도 주선 가능)
        if (!matchmakerRepository.existsByUserId(authUser.userId)) {
            val matchmaker = Matchmaker(
                id = MatchmakerId(UUID.randomUUID()),
                userId = authUser.userId,
                stats = MatchmakerStats.initial(),
                level = MatchmakerLevel.initial(),
                earnings = MatchmakerEarnings.initial(),
                profilePhoto = null,
                metadata = MatchmakerMetadata(
                    createdAt = now,
                    updatedAt = now
                )
            )
            matchmakerRepository.save(matchmaker)
        }

        // User의 isProfileCompleted를 true로 업데이트
        val user = userRepository.findById(authUser.userId)
        if (user != null) {
            val completedUser = user.completeProfile()
            userRepository.save(completedUser)
        }

        return ResponseEntity.created(
            URI.create("/api/v1/profiles/${savedProfile.id.value}")
        ).body(
            ProfileResponse(
                profileId = savedProfile.id.value.toString(),
                userId = savedProfile.userId.value.toString(),
                completionRate = savedProfile.metrics.completionRate,
                trustScore = savedProfile.metrics.trustScore,
                createdAt = savedProfile.metadata.createdAt
            )
        )
    }

    @GetMapping("/me")
    fun getMyProfile(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<ProfileResponse> {
        val profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(
            ProfileResponse(
                profileId = profile.id.value.toString(),
                userId = profile.userId.value.toString(),
                completionRate = profile.metrics.completionRate,
                trustScore = profile.metrics.trustScore,
                createdAt = profile.metadata.createdAt
            )
        )
    }
}

data class CreateProfileRequest(
    // BasicInfo
    val height: Int?,
    val bodyType: BodyType?,

    // CareerInfo
    val careerCategory: CareerCategory?,
    val company: String?,
    val position: String?,

    // EducationInfo
    val educationLevel: EducationLevel?,
    val school: String?,
    val major: String?,

    // LocationInfo
    val sido: String?,
    val sigungu: String?,
    val hometownSido: String?,
    val hometownSigungu: String?,

    // Introduction
    val introductionText: String?,
    val interests: List<String>?,

    // LifestyleInfo
    val smoking: Frequency?,
    val drinking: Frequency?,
    val religion: Religion?,

    // IdealType
    val idealAgeRange: AgeRange?,
    val idealHeightRange: HeightRange?,
    val idealBodyTypes: List<BodyType>?,
    val idealPersonalities: List<String>?,
    val idealDateStyle: DateStyle?,
    val idealPurpose: DatingPurpose?,
    val idealDealBreakers: String?,

    // ColorType
    val colorType: ColorTypeEnum?
)

data class ProfileResponse(
    val profileId: String,
    val userId: String,
    val completionRate: Int,
    val trustScore: Int,
    val createdAt: Instant
)
