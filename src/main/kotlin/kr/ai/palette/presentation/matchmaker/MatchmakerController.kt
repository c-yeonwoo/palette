package kr.ai.palette.presentation.matchmaker

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.matchmaker.*
import kr.ai.palette.infrastructure.storage.FileStorageService
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.net.URI
import java.time.Instant
import java.util.*

@RestController
@RequestMapping("/api/v1/matchmakers")
class MatchmakerController(
    private val matchmakerRepository: MatchmakerRepository,
    private val fileStorageService: FileStorageService
) {

    @PostMapping
    @Transactional
    fun createMatchmaker(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MatchmakerResponse> {
        // 이미 Matchmaker가 존재하는지 확인
        if (matchmakerRepository.existsByUserId(authUser.userId)) {
            return ResponseEntity.badRequest().build()
        }

        // Matchmaker 생성
        val now = Instant.now()
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

        val savedMatchmaker = matchmakerRepository.save(matchmaker)

        return ResponseEntity.created(
            URI.create("/api/v1/matchmakers/${savedMatchmaker.id.value}")
        ).body(
            MatchmakerResponse(
                matchmakerId = savedMatchmaker.id.value.toString(),
                userId = savedMatchmaker.userId.value.toString(),
                level = savedMatchmaker.level.level,
                commissionRate = savedMatchmaker.level.commissionRate,
                totalPoints = savedMatchmaker.earnings.totalPoints,
                availablePoints = savedMatchmaker.earnings.getAvailablePoints(),
                withdrawnPoints = savedMatchmaker.earnings.withdrawnPoints,
                pendingPoints = savedMatchmaker.earnings.pendingPoints,
                totalMatchRequests = savedMatchmaker.stats.totalMatchRequests,
                approvedRequests = savedMatchmaker.stats.approvedRequests,
                rejectedRequests = savedMatchmaker.stats.rejectedRequests,
                successfulMatches = savedMatchmaker.stats.successfulMatches,
                failedMatches = savedMatchmaker.stats.failedMatches,
                successRate = savedMatchmaker.stats.getSuccessRate(),
                profilePhotoUrl = savedMatchmaker.profilePhoto?.url,
                createdAt = savedMatchmaker.metadata.createdAt
            )
        )
    }

    @GetMapping("/me")
    fun getMyMatchmaker(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MatchmakerResponse> {
        val matchmaker = matchmakerRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        return ResponseEntity.ok(
            MatchmakerResponse(
                matchmakerId = matchmaker.id.value.toString(),
                userId = matchmaker.userId.value.toString(),
                level = matchmaker.level.level,
                commissionRate = matchmaker.level.commissionRate,
                totalPoints = matchmaker.earnings.totalPoints,
                availablePoints = matchmaker.earnings.getAvailablePoints(),
                withdrawnPoints = matchmaker.earnings.withdrawnPoints,
                pendingPoints = matchmaker.earnings.pendingPoints,
                totalMatchRequests = matchmaker.stats.totalMatchRequests,
                approvedRequests = matchmaker.stats.approvedRequests,
                rejectedRequests = matchmaker.stats.rejectedRequests,
                successfulMatches = matchmaker.stats.successfulMatches,
                failedMatches = matchmaker.stats.failedMatches,
                successRate = matchmaker.stats.getSuccessRate(),
                profilePhotoUrl = matchmaker.profilePhoto?.url,
                createdAt = matchmaker.metadata.createdAt
            )
        )
    }

    @PostMapping("/me/photo")
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

        val matchmaker = matchmakerRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // 파일 저장
        val photoUrl = fileStorageService.storeFile(file)

        // 기존 사진 삭제 (있는 경우)
        matchmaker.profilePhoto?.let { oldPhoto ->
            fileStorageService.deleteFile(oldPhoto.url)
        }

        // Matchmaker 업데이트
        val updatedMatchmaker = matchmaker.uploadPhoto(photoUrl, hasProfile = false)
        matchmakerRepository.save(updatedMatchmaker)

        return ResponseEntity.ok(
            PhotoUploadResponse(
                photoUrl = photoUrl,
                uploadedAt = Instant.now()
            )
        )
    }
}

data class MatchmakerResponse(
    val matchmakerId: String,
    val userId: String,
    val level: Int,
    val commissionRate: Double,
    val totalPoints: Int,
    val availablePoints: Int,
    val withdrawnPoints: Int,
    val pendingPoints: Int,
    val totalMatchRequests: Int,
    val approvedRequests: Int,
    val rejectedRequests: Int,
    val successfulMatches: Int,
    val failedMatches: Int,
    val successRate: Double,
    val profilePhotoUrl: String?,
    val createdAt: Instant
)

data class PhotoUploadResponse(
    val photoUrl: String,
    val uploadedAt: Instant
)
