package kr.ai.palette.presentation.profile

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.profile.*
import kr.ai.palette.infrastructure.storage.FileStorageService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.time.Instant
import java.util.*

@RestController
@RequestMapping("/api/v1/profile")
class ProfileController(
    private val profileRepository: ProfileRepository,
    private val profilePhotoRepository: ProfilePhotoRepository,
    private val fileStorageService: FileStorageService,
    private val userRepository: kr.ai.palette.domain.user.UserRepository
) {

    @GetMapping
    fun getMyProfile(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<ProfileResponse> {
        val profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // Update last accessed time
        profileRepository.save(profile.access())

        return ResponseEntity.ok(ProfileResponse.from(profile))
    }

    @PutMapping
    @Transactional
    fun updateProfile(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: UpdateProfileRequest
    ): ResponseEntity<ProfileResponse> {
        var profile = profileRepository.findByUserId(authUser.userId)
            ?: Profile.create(authUser.userId)

        // Update each section if provided
        request.basicInfo?.let { basicInfoDto ->
            profile = profile.updateBasicInfo(basicInfoDto.toDomain())
        }

        request.careerInfo?.let { careerInfoDto ->
            profile = profile.updateCareerInfo(careerInfoDto.toDomain())
        }

        request.educationInfo?.let { educationInfoDto ->
            profile = profile.updateEducationInfo(educationInfoDto.toDomain())
        }

        request.locationInfo?.let { locationInfoDto ->
            profile = profile.updateLocationInfo(locationInfoDto.toDomain())
        }

        request.lifestyleInfo?.let { lifestyleInfoDto ->
            profile = profile.updateLifestyleInfo(lifestyleInfoDto.toDomain())
        }

        request.introduction?.let { introductionDto ->
            profile = profile.updateIntroduction(introductionDto.toDomain())
        }

        request.idealType?.let { idealTypeDto ->
            profile = profile.updateIdealType(idealTypeDto.toDomain())
        }

        request.settings?.let { settingsDto ->
            profile = profile.updateSettings(settingsDto.toDomain())
        }

        request.personalityTests?.let { testsDto ->
            val tests = testsDto.map { it.toDomain() }
            profile = profile.updatePersonalityTests(tests)
        }

        // Recalculate metrics (completion rate)
        profile = profile.recalculateMetrics()

        val savedProfile = profileRepository.save(profile)

        // Mark user profile as completed if not already (only for REGULAR users)
        val user = userRepository.findById(authUser.userId)
        if (user != null && !user.isProfileCompleted && user.accountType == kr.ai.palette.domain.user.AccountType.REGULAR) {
            val updatedUser = user.completeProfile()
            userRepository.save(updatedUser)
        }

        return ResponseEntity.ok(ProfileResponse.from(savedProfile))
    }

    @PatchMapping("/settings")
    @Transactional
    fun updateProfileSettings(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: UpdateSettingsRequest
    ): ResponseEntity<ProfileResponse> {
        var profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // Update settings
        profile = profile.updateSettings(request.toDomain())

        val savedProfile = profileRepository.save(profile)
        return ResponseEntity.ok(ProfileResponse.from(savedProfile))
    }

    @PatchMapping("/settings/visibility")
    @Transactional
    fun toggleVisibility(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: ToggleVisibilityRequest
    ): ResponseEntity<ProfileSettingsDto> {
        val profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        val newSettings = if (request.visible) {
            ProfileSettings(isAcceptingMatches = profile.settings.isAcceptingMatches, hiddenAt = null)
        } else {
            ProfileSettings(isAcceptingMatches = false, hiddenAt = Instant.now())
        }
        val saved = profileRepository.save(profile.updateSettings(newSettings))
        return ResponseEntity.ok(ProfileSettingsDto.from(saved.settings))
    }

    @PutMapping("/photos/reorder")
    @Transactional
    fun reorderPhotos(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: ReorderPhotosRequest
    ): ResponseEntity<Unit> {
        var profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // Update display order for each photo
        request.photos.forEachIndexed { newDisplayOrder, photoUpdate ->
            val photoId = ProfilePhotoId(java.util.UUID.fromString(photoUpdate.id))
            val photo = profilePhotoRepository.findById(photoId) ?: return@forEachIndexed

            // Update display order
            val updatedPhoto = photo.copy(
                displayOrder = newDisplayOrder,
                isPrimary = newDisplayOrder == 0 // First photo is always primary
            )
            profilePhotoRepository.save(updatedPhoto)
        }

        return ResponseEntity.ok().build()
    }

    @PostMapping("/photo")
    @Transactional
    fun uploadProfilePhoto(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<PhotoUploadResponse> {
        // 파일 유효성 검사
        if (file.isEmpty) {
            return ResponseEntity.badRequest().build()
        }

        // 이미지 파일인지 확인
        val contentType = file.contentType
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().build()
        }

        // 파일 크기 제한 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return ResponseEntity.badRequest().build()
        }

        var profile = profileRepository.findByUserId(authUser.userId)
            ?: Profile.create(authUser.userId)

        // 파일 저장
        val photoUrl = fileStorageService.storeFile(file)

        // 기존 사진들 조회하여 다음 displayOrder 결정
        val existingPhotos = profilePhotoRepository.findByProfileId(profile.id)
        val nextDisplayOrder = existingPhotos.size
        val isFirstPhoto = existingPhotos.isEmpty()

        // 새 사진 생성 및 저장
        val newPhoto = ProfilePhoto(
            id = ProfilePhotoId(UUID.randomUUID()),
            profileId = profile.id,
            s3Key = photoUrl,
            url = photoUrl,
            displayOrder = nextDisplayOrder,
            isPrimary = isFirstPhoto, // 첫 번째 사진만 primary
            trustAnalysis = TrustAnalysis(
                trustFactor = TrustFactor.UNKNOWN,
                trustScore = 0
            ),
            aiAnalysis = null,
            createdAt = Instant.now()
        )

        profilePhotoRepository.save(newPhoto)

        // Profile에도 사진 추가하고 metrics 재계산
        profile = profile.addPhoto(newPhoto).recalculateMetrics()
        profileRepository.save(profile)

        return ResponseEntity.ok(
            PhotoUploadResponse(
                photoId = newPhoto.id.value.toString(),
                photoUrl = photoUrl,
                uploadedAt = Instant.now()
            )
        )
    }

    @DeleteMapping("/photo/{photoId}")
    @Transactional
    fun deleteProfilePhoto(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable photoId: String
    ): ResponseEntity<Unit> {
        val profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        val id = ProfilePhotoId(UUID.fromString(photoId))
        val photo = profilePhotoRepository.findById(id)
            ?: return ResponseEntity.notFound().build()

        // 본인 사진인지 확인
        if (photo.profileId != profile.id) return ResponseEntity.status(403).build()

        // 스토리지에서 삭제
        try { fileStorageService.deleteFile(photo.url) } catch (_: Exception) {}

        profilePhotoRepository.delete(id)

        // metrics 재계산
        profileRepository.save(profile.recalculateMetrics())

        return ResponseEntity.noContent().build()
    }
}

data class PhotoUploadResponse(
    val photoId: String,
    val photoUrl: String,
    val uploadedAt: Instant
)

data class ReorderPhotosRequest(
    val photos: List<PhotoOrderUpdate>
)

data class PhotoOrderUpdate(
    val id: String,
    val displayOrder: Int
)
