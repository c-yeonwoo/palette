package kr.ai.palette.presentation.matchmaker

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.matchmaker.*
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.infrastructure.seed.SeedUserPolicy
import kr.ai.palette.infrastructure.storage.FileStorageService
import kr.ai.palette.persistence.matchmaker.MatchmakerReviewEntity
import kr.ai.palette.persistence.matchmaker.MatchmakerReviewJpaRepository
import kr.ai.palette.persistence.matchmaker.NudgeEntity
import kr.ai.palette.persistence.matchmaker.NudgeJpaRepository
import kr.ai.palette.presentation.profile.ColorTypeDto
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
    private val fileStorageService: FileStorageService,
    private val userRepository: kr.ai.palette.domain.user.UserRepository,
    private val matchmakerReviewJpaRepository: MatchmakerReviewJpaRepository,
    private val seedUserPolicy: SeedUserPolicy,
    private val friendshipRepository: FriendshipRepository,
    private val profileRepository: ProfileRepository,
    private val nudgeJpaRepository: NudgeJpaRepository,
) {

    @GetMapping("/marketplace")
    fun getMarketplace(
        @AuthenticationPrincipal authUser: AuthUser?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): ResponseEntity<List<MatchmakerPublicResponse>> {
        val matchmakers = matchmakerRepository.findPublicMatchmakers(page, size)
        // 시드 격리: 일반(non-seed) 가입자에게는 시드 주선자를 마켓플레이스에 노출 안 함
        val viewer = authUser?.let { userRepository.findById(it.userId) }
        val exposeSeed = viewer?.let { seedUserPolicy.shouldExposeSeedTo(it) } ?: false
        val filtered = if (exposeSeed) matchmakers
        else matchmakers.filter { !seedUserPolicy.isSeed(it.userId) }
        return ResponseEntity.ok(filtered.map { MatchmakerPublicResponse.from(it, fileStorageService) })
    }

    @GetMapping("/{matchmakerId}/public")
    fun getPublicMatchmaker(
        @PathVariable matchmakerId: UUID
    ): ResponseEntity<MatchmakerPublicResponse> {
        val matchmaker = matchmakerRepository.findById(MatchmakerId(matchmakerId))
            ?: return ResponseEntity.notFound().build()
        if (!matchmaker.isPublicProfile) {
            return ResponseEntity.notFound().build()
        }
        return ResponseEntity.ok(MatchmakerPublicResponse.from(matchmaker, fileStorageService))
    }

    @PutMapping("/me/public-profile")
    @Transactional
    fun updatePublicProfile(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: UpdatePublicProfileRequest
    ): ResponseEntity<MatchmakerPublicResponse> {
        val matchmaker = matchmakerRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()
        val updated = matchmaker.updatePublicProfile(
            bio = request.bio,
            specialties = request.specialties,
            isPublicProfile = request.isPublicProfile
        )
        val saved = matchmakerRepository.save(updated)
        return ResponseEntity.ok(MatchmakerPublicResponse.from(saved, fileStorageService))
    }

    @PostMapping("/{matchmakerId}/reviews")
    @Transactional
    fun createReview(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable matchmakerId: UUID,
        @RequestBody request: CreateReviewRequest
    ): ResponseEntity<Map<String, Any>> {
        if (request.rating < 1 || request.rating > 5) {
            return ResponseEntity.badRequest().body(mapOf("error" to "평점은 1~5 사이여야 합니다"))
        }
        val matchmaker = matchmakerRepository.findById(MatchmakerId(matchmakerId))
            ?: return ResponseEntity.notFound().build()
        val review = MatchmakerReviewEntity(
            id = UUID.randomUUID(),
            matchmakerId = matchmakerId,
            reviewerUserId = authUser.userId.value,
            rating = request.rating,
            comment = request.comment,
        )
        matchmakerReviewJpaRepository.save(review)
        val updatedMatchmaker = matchmaker.addReview(request.rating)
        matchmakerRepository.save(updatedMatchmaker)
        return ResponseEntity.ok(mapOf(
            "success" to true,
            "message" to "리뷰가 등록되었습니다",
            "newAverageRating" to updatedMatchmaker.averageRating,
            "totalReviews" to updatedMatchmaker.totalReviews
        ))
    }

    @PostMapping
    @Transactional
    fun createMatchmaker(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MatchmakerResponse> {
        // 사용자 조회
        val user = userRepository.findById(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        // 핸드폰 인증 확인
        if (!user.canBeMatchmaker()) {
            return ResponseEntity.status(403).build()  // 403 Forbidden - 핸드폰 미인증
        }

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
                profilePhotoUrl = savedMatchmaker.profilePhoto?.url?.let { fileStorageService.getPresignedDownloadUrl(it) },
                createdAt = savedMatchmaker.metadata.createdAt
            )
        )
    }

    @GetMapping("/me")
    @Transactional
    fun getMyMatchmaker(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MatchmakerResponse> {
        val matchmaker = matchmakerRepository.findByUserId(authUser.userId)
            ?: run {
                val now = Instant.now()
                matchmakerRepository.save(
                    Matchmaker(
                        id = MatchmakerId(UUID.randomUUID()),
                        userId = authUser.userId,
                        stats = MatchmakerStats.initial(),
                        level = MatchmakerLevel.initial(),
                        earnings = MatchmakerEarnings.initial(),
                        profilePhoto = null,
                        metadata = MatchmakerMetadata(createdAt = now, updatedAt = now)
                    )
                )
            }

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
                profilePhotoUrl = matchmaker.profilePhoto?.url?.let { fileStorageService.getPresignedDownloadUrl(it) },
                createdAt = matchmaker.metadata.createdAt
            )
        )
    }

    @PostMapping("/me/withdraw")
    @Transactional
    fun requestWithdrawal(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: WithdrawRequest
    ): ResponseEntity<Map<String, Any>> {
        val matchmaker = matchmakerRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        if (request.amount <= 0) {
            return ResponseEntity.badRequest().body(mapOf("error" to "출금 금액은 0보다 커야 합니다"))
        }

        if (matchmaker.earnings.getAvailablePoints() < request.amount) {
            return ResponseEntity.badRequest().body(
                mapOf("error" to "출금 가능 포인트가 부족합니다 (가용: ${matchmaker.earnings.getAvailablePoints()}P)")
            )
        }

        val updated = matchmaker.copy(
            earnings = matchmaker.earnings.withdraw(request.amount)
        )
        matchmakerRepository.save(updated)

        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "withdrawnAmount" to request.amount,
                "remainingAvailable" to updated.earnings.getAvailablePoints(),
                "message" to "${request.amount}P 출금 신청이 완료되었습니다"
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

    /**
     * 내 지인(members) — 주선자가 연결해 줄 수 있는 1촌(승인된 친구) 목록.
     */
    @GetMapping("/me/members")
    fun getMyMembers(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MembersResponse> {
        val members = friendshipRepository.findAcceptedFriendshipsByUserId(authUser.userId)
            .mapNotNull { friendship ->
                val otherId = friendship.getOtherUserId(authUser.userId)
                toClientMember(otherId, friendship.acceptedAt)
            }
        return ResponseEntity.ok(MembersResponse(members))
    }

    /**
     * 내가 만든 연결 제안(Nudge) 목록.
     */
    @GetMapping("/me/nudges")
    fun getMyNudges(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<NudgesResponse> {
        val nudges = nudgeJpaRepository
            .findByMatchmakerUserIdOrderByProposedAtDesc(authUser.userId.value)
            .mapNotNull { nudge ->
                val from = toClientMember(UserId(nudge.fromUserId), null) ?: return@mapNotNull null
                val to = toClientMember(UserId(nudge.toUserId), null) ?: return@mapNotNull null
                NudgeProposalResponse(
                    id = nudge.id.toString(),
                    fromMember = from,
                    toMember = to,
                    message = nudge.message,
                    pointsSpent = nudge.pointsSpent,
                    status = nudge.status,
                    proposedAt = nudge.proposedAt.toString(),
                )
            }
        return ResponseEntity.ok(NudgesResponse(nudges))
    }

    /**
     * 연결 제안 생성 — 두 지인을 매칭시켜보자고 제안. 건당 50P 소모.
     */
    @PostMapping("/me/nudges")
    @Transactional
    fun createNudge(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: CreateNudgeRequest
    ): ResponseEntity<Map<String, Any?>> {
        val matchmaker = matchmakerRepository.findByUserId(authUser.userId)
            ?: return ResponseEntity.notFound().build()

        val fromUserId = runCatching { UUID.fromString(request.fromUserId) }.getOrNull()
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "잘못된 fromUserId"))
        val toUserId = runCatching { UUID.fromString(request.toUserId) }.getOrNull()
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "잘못된 toUserId"))
        if (fromUserId == toUserId) {
            return ResponseEntity.badRequest().body(mapOf("error" to "같은 사람을 연결할 수 없습니다"))
        }

        // 두 사람 모두 내 지인(1촌)인지 검증
        val myFriendIds = friendshipRepository.findFriendIdsByUserId(authUser.userId)
            .map { it.value }.toSet()
        if (fromUserId !in myFriendIds || toUserId !in myFriendIds) {
            return ResponseEntity.status(403).body(mapOf("error" to "내 지인만 연결 제안할 수 있습니다"))
        }

        val cost = 50
        if (matchmaker.earnings.getAvailablePoints() < cost) {
            return ResponseEntity.badRequest().body(
                mapOf("error" to "포인트가 부족합니다 (가용: ${matchmaker.earnings.getAvailablePoints()}P)")
            )
        }

        val saved = nudgeJpaRepository.save(
            NudgeEntity(
                id = UUID.randomUUID(),
                matchmakerUserId = authUser.userId.value,
                fromUserId = fromUserId,
                toUserId = toUserId,
                message = request.message,
                pointsSpent = cost,
                status = "PENDING",
            )
        )
        val updatedEarnings = matchmaker.earnings.spend(cost)
        matchmakerRepository.save(matchmaker.copy(earnings = updatedEarnings))

        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "nudgeId" to saved.id.toString(),
                "pointsSpent" to cost,
                "remainingAvailable" to updatedEarnings.getAvailablePoints(),
            )
        )
    }

    /**
     * userId → ClientMember 투영 (User + Profile). 사용자가 없으면 null.
     */
    private fun toClientMember(userId: UserId, joinedAt: Instant?): ClientMember? {
        val user = userRepository.findById(userId) ?: return null
        val profile = profileRepository.findByUserId(userId)
        val colorDto = profile?.colorType?.let { ColorTypeDto.from(it) }
        val photoUrl = profile?.photos?.firstOrNull { it.isPrimary }?.url?.let {
            fileStorageService.getPresignedDownloadUrl(it)
        }
        return ClientMember(
            id = userId.value.toString(),
            userId = userId.value.toString(),
            name = user.privateInfo.realName.ifBlank { user.publicInfo.nickname },
            age = user.publicInfo.getAge(),
            gender = user.publicInfo.gender.name,
            region = profile?.locationInfo?.sido ?: "",
            colorType = colorDto?.key,
            colorHex = colorDto?.hex,
            colorName = colorDto?.name,
            photoUrl = photoUrl,
            joinedAt = joinedAt?.toString() ?: "",
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

data class WithdrawRequest(
    val amount: Int
)

data class UpdatePublicProfileRequest(
    val bio: String?,
    val specialties: List<String>,
    val isPublicProfile: Boolean,
)

data class CreateReviewRequest(
    val rating: Int,  // 1-5
    val comment: String,
)

data class CreateNudgeRequest(
    val fromUserId: String,
    val toUserId: String,
    val message: String?,
)

data class MembersResponse(
    val members: List<ClientMember>,
)

data class NudgesResponse(
    val nudges: List<NudgeProposalResponse>,
)

data class ClientMember(
    val id: String,
    val userId: String,
    val name: String,
    val age: Int,
    val gender: String,          // "MALE" | "FEMALE"
    val region: String,
    val colorType: String?,      // 컬러 key (orange/blue/...)
    val colorHex: String?,
    val colorName: String?,
    val photoUrl: String?,
    val joinedAt: String,        // ISO-8601, 없으면 ""
)

data class NudgeProposalResponse(
    val id: String,
    val fromMember: ClientMember,
    val toMember: ClientMember,
    val message: String?,
    val pointsSpent: Int,
    val status: String,          // PENDING | BOTH_ACCEPTED | REJECTED | MATCHED
    val proposedAt: String,
)

data class MatchmakerPublicResponse(
    val matchmakerId: String,
    val userId: String,
    val level: Int,
    val commissionRate: Double,
    val successfulMatches: Int,
    val bio: String?,
    val specialties: List<String>,
    val isPublicProfile: Boolean,
    val averageRating: Double,
    val totalReviews: Int,
    val profilePhotoUrl: String?,
) {
    companion object {
        fun from(
            matchmaker: Matchmaker,
            storage: FileStorageService? = null,
        ) = MatchmakerPublicResponse(
            matchmakerId = matchmaker.id.value.toString(),
            userId = matchmaker.userId.value.toString(),
            level = matchmaker.level.level,
            commissionRate = matchmaker.level.commissionRate,
            successfulMatches = matchmaker.stats.successfulMatches,
            bio = matchmaker.bio,
            specialties = matchmaker.specialties,
            isPublicProfile = matchmaker.isPublicProfile,
            averageRating = matchmaker.averageRating,
            totalReviews = matchmaker.totalReviews,
            profilePhotoUrl = matchmaker.profilePhoto?.url?.let {
                storage?.getPresignedDownloadUrl(it) ?: it
            },
        )
    }
}
