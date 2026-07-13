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

        return ResponseEntity.ok(ProfileResponse.from(profile, fileStorageService))
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
            // hiddenAt(노출 on/off)은 전용 visibility 엔드포인트로만 변경 —
            // PUT 본문의 클라이언트 hiddenAt 은 무시하고 기존 값 보존 (mass-assignment 방지)
            val merged = settingsDto.toDomain().copy(hiddenAt = profile.settings.hiddenAt)
            profile = profile.updateSettings(merged)
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
        if (user != null && user.accountType == kr.ai.palette.domain.user.AccountType.REGULAR) {
            if (!user.isProfileCompleted) {
                // 최초 완성 → 운영자 승인 대기 (ADR 0054)
                userRepository.save(user.completeProfile())
            } else if (user.status == kr.ai.palette.domain.user.UserStatus.REJECTED) {
                // 반려된 프로필 보완 후 재제출 → 다시 심사 대기 (ADR 0054).
                // 운영자가 콕 집은 사진 반려 표시도 초기화 → 재검토 (ADR 0060)
                profilePhotoRepository.findByProfileId(savedProfile.id)
                    .filter { it.rejected }
                    .forEach { profilePhotoRepository.save(it.clearRejection()) }
                userRepository.save(user.resubmitForApproval())
            }
        }

        return ResponseEntity.ok(ProfileResponse.from(savedProfile, fileStorageService))
    }

    @PatchMapping("/settings")
    @Transactional
    fun updateProfileSettings(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: UpdateSettingsRequest
    ): ResponseEntity<ProfileResponse> {
        var profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // 제공된 필드만 병합 (hiddenAt 등 미제공 값은 보존)
        val cur = profile.settings
        val merged = cur.copy(
            isAcceptingMatches = request.isAcceptingMatches ?: cur.isAcceptingMatches,
            detailsVisibleToFriends = request.detailsVisibleToFriends ?: cur.detailsVisibleToFriends,
            publicDiscoverable = request.publicDiscoverable ?: cur.publicDiscoverable
        )
        profile = profile.updateSettings(merged)

        val savedProfile = profileRepository.save(profile)
        return ResponseEntity.ok(ProfileResponse.from(savedProfile, fileStorageService))
    }

    @PatchMapping("/settings/visibility")
    @Transactional
    fun toggleVisibility(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: ToggleVisibilityRequest
    ): ResponseEntity<ProfileSettingsDto> {
        val profile = profileRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // hiddenAt 만 토글 (isAcceptingMatches·detailsVisibleToFriends 보존 — show/hide 도메인 메서드)
        val newSettings = if (request.visible) profile.settings.show() else profile.settings.hide()
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

            // 본인 사진만 — 타인 사진 ID 를 넣어 대표/순서를 조작하는 IDOR 차단
            if (photo.profileId != profile.id) return@forEachIndexed

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

        // 파일 저장 — storeFile은 S3 키 반환 (presigned URL 아님)
        val s3Key = fileStorageService.storeFile(file)

        // 기존 사진들 조회하여 다음 displayOrder 결정
        val existingPhotos = profilePhotoRepository.findByProfileId(profile.id)
        val nextDisplayOrder = existingPhotos.size
        val isFirstPhoto = existingPhotos.isEmpty()

        // 새 사진 생성 및 저장 (DB에는 키만 저장, url 컬럼도 일관성 위해 키 저장)
        val newPhoto = ProfilePhoto(
            id = ProfilePhotoId(UUID.randomUUID()),
            profileId = profile.id,
            s3Key = s3Key,
            url = s3Key,  // legacy 컬럼 — 조회 시 presigned URL로 변환
            displayOrder = nextDisplayOrder,
            isPrimary = isFirstPhoto,
            trustAnalysis = TrustAnalysis(
                trustFactor = TrustFactor.UNKNOWN,
                trustScore = 0
            ),
            aiAnalysis = null,
            createdAt = Instant.now()
        )

        profilePhotoRepository.save(newPhoto)

        profile = profile.addPhoto(newPhoto).recalculateMetrics()
        profileRepository.save(profile)

        // 응답에는 presigned URL 반환
        return ResponseEntity.ok(
            PhotoUploadResponse(
                photoId = newPhoto.id.value.toString(),
                photoUrl = fileStorageService.getPresignedDownloadUrl(s3Key),
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

        // 대표사진(첫 사진) 보장 — 삭제 후 displayOrder 재정렬 + 맨 앞만 isPrimary.
        // 대표를 지웠어도 다음 사진이 대표가 되도록.
        normalizePrimaryPhoto(profile.id)

        // metrics 재계산
        profileRepository.save(profile.recalculateMetrics())

        return ResponseEntity.noContent().build()
    }

    /** 남은 사진을 displayOrder 0..n 으로 재정렬하고 첫 사진만 대표(isPrimary)로 정규화 */
    private fun normalizePrimaryPhoto(profileId: kr.ai.palette.domain.profile.ProfileId) {
        val remaining = profilePhotoRepository.findByProfileId(profileId).sortedBy { it.displayOrder }
        remaining.forEachIndexed { index, p ->
            val wantPrimary = index == 0
            if (p.displayOrder != index || p.isPrimary != wantPrimary) {
                profilePhotoRepository.save(p.copy(displayOrder = index, isPrimary = wantPrimary))
            }
        }
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
