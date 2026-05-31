package kr.ai.palette.presentation.admin

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.User
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.domain.user.UserStatus
import kr.ai.palette.infrastructure.exception.BusinessRuleViolationException
import kr.ai.palette.infrastructure.exception.ResourceNotFoundException
import kr.ai.palette.infrastructure.storage.FileStorageService
import kr.ai.palette.persistence.recommendation.DailyRecommendationJpaRepository
import kr.ai.palette.presentation.profile.ProfileResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.Period
import java.time.ZoneId
import java.util.UUID

/**
 * 운영자: 회원 조회 / 상태 변경.
 *
 * 베타 단계 사용자 수 적음(~25) → `userRepository.findAll()` + 메모리 필터/페이징 으로 충분.
 * 1000명 넘으면 JPA Specification + Pageable 로 전환 (BACKLOG).
 *
 * ADR: docs/DECISIONS/0008-user-status-and-admin-actions.md
 */
@RestController
@RequestMapping("/api/v1/admin/users")
class AdminUsersController(
    private val userRepository: UserRepository,
    private val profileRepository: ProfileRepository,
    private val friendshipRepository: FriendshipRepository,
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val dailyRecommendationRepo: DailyRecommendationJpaRepository,
    private val fileStorageService: FileStorageService,
) {

    @GetMapping
    fun list(
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "createdAt:desc") sort: String,
    ): ResponseEntity<AdminUsersPageResponse> {
        val statusFilter = status?.takeIf { it != "ALL" }?.let { runCatching { UserStatus.valueOf(it) }.getOrNull() }

        val all = userRepository.findAll().filter { !it.metadata.isDeleted() }
        val filtered = all.filter { u ->
            if (statusFilter != null && u.status != statusFilter) return@filter false
            if (q.isNullOrBlank()) return@filter true
            val needle = q.trim().lowercase()
            (u.privateInfo.email?.lowercase()?.contains(needle) == true) ||
                u.publicInfo.nickname.lowercase().contains(needle) ||
                u.privateInfo.realName.lowercase().contains(needle) ||
                (u.privateInfo.phoneNumber?.contains(needle) == true)
        }

        val sorted = sortUsers(filtered, sort)
        val pageSize = size.coerceIn(1, 100)
        val pageIndex = page.coerceAtLeast(0)
        val start = pageIndex * pageSize
        val items = if (start >= sorted.size) emptyList() else sorted.drop(start).take(pageSize)

        return ResponseEntity.ok(
            AdminUsersPageResponse(
                items = items.map { AdminUserSummary.from(it) },
                page = pageIndex,
                size = pageSize,
                totalCount = sorted.size,
                totalPages = if (sorted.isEmpty()) 0 else (sorted.size + pageSize - 1) / pageSize,
            )
        )
    }

    @GetMapping("/{userId}")
    fun detail(@PathVariable userId: UUID): ResponseEntity<AdminUserDetail> {
        val user = userRepository.findById(UserId(userId))
            ?: throw ResourceNotFoundException("사용자를 찾을 수 없습니다")
        return ResponseEntity.ok(AdminUserDetail.from(user))
    }

    @PatchMapping("/{userId}/status")
    @Transactional
    fun changeStatus(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable userId: UUID,
        @RequestBody request: ChangeStatusRequest,
    ): ResponseEntity<AdminUserDetail> {
        val target = userRepository.findById(UserId(userId))
            ?: throw ResourceNotFoundException("사용자를 찾을 수 없습니다")

        val newStatus = runCatching { UserStatus.valueOf(request.status) }.getOrElse {
            throw BusinessRuleViolationException("지원하지 않는 status: ${request.status}")
        }

        if (target.isAdmin()) {
            throw BusinessRuleViolationException("운영자 계정은 상태 변경 불가 (오작동 방지)")
        }

        val updated = target.changeStatus(newStatus, request.reason, authUser.userId)
        val saved = userRepository.save(updated)
        return ResponseEntity.ok(AdminUserDetail.from(saved))
    }

    // ── 보강 endpoint (PR #10) ────────────────────────────────────────────

    /** 유저의 1촌 친구 목록 + 각자 색깔/완성도 한 줄 요약 (depth 1) */
    @GetMapping("/{userId}/friends")
    fun friends(@PathVariable userId: UUID): ResponseEntity<List<AdminFriendSummary>> {
        userRepository.findById(UserId(userId))
            ?: throw ResourceNotFoundException("사용자를 찾을 수 없습니다")
        val friendIds = friendshipRepository.findFriendIdsByUserId(UserId(userId))
        val items = friendIds.mapNotNull { fid ->
            val u = userRepository.findById(fid) ?: return@mapNotNull null
            val p = profileRepository.findByUserId(fid)
            AdminFriendSummary(
                userId = u.id.value.toString(),
                nickname = u.publicInfo.nickname,
                realName = u.privateInfo.realName,
                gender = u.publicInfo.gender.name,
                age = computeAge(u.publicInfo.birthDate),
                colorType = p?.colorType?.name,
                completionRate = p?.metrics?.completionRate ?: 0,
                status = u.status.name,
                isDeleted = u.metadata.isDeleted(),
            )
        }
        return ResponseEntity.ok(items)
    }

    /** 유저의 활동 통계 — 색깔, 프로필 완성도, 매칭 요청, AI 추천 노출 */
    @GetMapping("/{userId}/stats")
    fun stats(@PathVariable userId: UUID): ResponseEntity<AdminUserStats> {
        val user = userRepository.findById(UserId(userId))
            ?: throw ResourceNotFoundException("사용자를 찾을 수 없습니다")
        val profile = profileRepository.findByUserId(user.id)

        val sentRequests = matchmakingRequestRepository.findByRequesterId(user.id)
        val receivedRequests = matchmakingRequestRepository.findByTargetUserId(user.id)
        val matchedAsMatchmaker = matchmakingRequestRepository.findByMatchmakerId(user.id)

        val sentByStatus = sentRequests.groupBy { it.status }.mapValues { it.value.size }
        val receivedByStatus = receivedRequests.groupBy { it.status }.mapValues { it.value.size }

        val friendCount = friendshipRepository.findFriendIdsByUserId(user.id).size

        // AI 추천 노출 — 30일 이내 target 으로 노출된 횟수
        val since = LocalDate.now().minusDays(30)
        val aiExposures = dailyRecommendationRepo
            .findByTargetUserIdAndRecommendedDateGreaterThanEqualOrderByRecommendedDateDescPositionAsc(
                user.id.value, since
            ).size

        return ResponseEntity.ok(
            AdminUserStats(
                colorType = profile?.colorType?.name,
                profileCompletionRate = profile?.metrics?.completionRate ?: 0,
                trustScore = profile?.metrics?.trustScore ?: 0,
                viewCount = profile?.metrics?.viewCount ?: 0,
                friendCount = friendCount,
                matchmaking = MatchmakingStatBlock(
                    sentTotal = sentRequests.size,
                    sentCompleted = sentByStatus[MatchmakingRequestStatus.COMPLETED] ?: 0,
                    sentPending = sentByStatus[MatchmakingRequestStatus.PENDING] ?: 0,
                    receivedTotal = receivedRequests.size,
                    receivedCompleted = receivedByStatus[MatchmakingRequestStatus.COMPLETED] ?: 0,
                    receivedPending = receivedByStatus[MatchmakingRequestStatus.PENDING] ?: 0,
                    matchmakerTotal = matchedAsMatchmaker.size,
                    matchmakerCompleted = matchedAsMatchmaker.count { it.status == MatchmakingRequestStatus.COMPLETED },
                ),
                aiSignal = AiSignalStatBlock(
                    last30DaysExposures = aiExposures,
                ),
            )
        )
    }

    /** 운영자 프로필 미리보기 — 일반 사용자에게 보이는 모습과 동일 */
    @GetMapping("/{userId}/profile")
    fun profile(@PathVariable userId: UUID): ResponseEntity<ProfileResponse> {
        val profile = profileRepository.findByUserId(UserId(userId))
            ?: throw ResourceNotFoundException("프로필이 없습니다 (아직 작성 안 됨)")
        return ResponseEntity.ok(ProfileResponse.from(profile, fileStorageService))
    }

    // ── 내부 헬퍼 ────────────────────────────────────────────────────────────

    private fun sortUsers(users: List<User>, sort: String): List<User> {
        val (key, dir) = sort.split(":").let { it[0] to (it.getOrNull(1) ?: "desc") }
        val cmp: Comparator<User> = when (key) {
            "createdAt" -> compareBy { it.metadata.createdAt }
            "nickname" -> compareBy { it.publicInfo.nickname }
            "email" -> compareBy { it.privateInfo.email ?: "" }
            "status" -> compareBy { it.status.name }
            else -> compareBy { it.metadata.createdAt }
        }
        return if (dir == "asc") users.sortedWith(cmp) else users.sortedWith(cmp.reversed())
    }
}

// ── DTO ──────────────────────────────────────────────────────────────────────

data class AdminUsersPageResponse(
    val items: List<AdminUserSummary>,
    val page: Int,
    val size: Int,
    val totalCount: Int,
    val totalPages: Int,
)

data class AdminUserSummary(
    val userId: String,
    val email: String?,
    val nickname: String,
    val realName: String,
    val gender: String,
    val age: Int,
    val phoneNumber: String?,
    val accountType: String,
    val role: String,
    val status: String,
    val isProfileCompleted: Boolean,
    val createdAt: String,
    val lastLoginAt: String,
) {
    companion object {
        fun from(u: User) = AdminUserSummary(
            userId = u.id.value.toString(),
            email = u.privateInfo.email,
            nickname = u.publicInfo.nickname,
            realName = u.privateInfo.realName,
            gender = u.publicInfo.gender.name,
            age = computeAge(u.publicInfo.birthDate),
            phoneNumber = u.privateInfo.phoneNumber?.let { maskPhone(it) },
            accountType = u.accountType.name,
            role = u.role.name,
            status = u.status.name,
            isProfileCompleted = u.isProfileCompleted,
            createdAt = u.metadata.createdAt.toString(),
            lastLoginAt = u.metadata.lastLoginAt.toString(),
        )
    }
}

data class AdminUserDetail(
    val userId: String,
    val email: String?,
    val nickname: String,
    val realName: String,
    val gender: String,
    val birthDate: String,
    val age: Int,
    val phoneNumber: String?,
    val accountType: String,
    val role: String,
    val status: String,
    val statusReason: String?,
    val statusUpdatedAt: String?,
    val statusUpdatedBy: String?,
    val isProfileCompleted: Boolean,
    val isPhoneVerified: Boolean,
    val createdAt: String,
    val updatedAt: String,
    val lastLoginAt: String,
    val deletedAt: String?,
) {
    companion object {
        fun from(u: User) = AdminUserDetail(
            userId = u.id.value.toString(),
            email = u.privateInfo.email,
            nickname = u.publicInfo.nickname,
            realName = u.privateInfo.realName,
            gender = u.publicInfo.gender.name,
            birthDate = u.publicInfo.birthDate.toString(),
            age = computeAge(u.publicInfo.birthDate),
            phoneNumber = u.privateInfo.phoneNumber,  // 상세는 마스킹 안 함 (운영자만 접근)
            accountType = u.accountType.name,
            role = u.role.name,
            status = u.status.name,
            statusReason = u.statusReason,
            statusUpdatedAt = u.statusUpdatedAt?.toString(),
            statusUpdatedBy = u.statusUpdatedBy?.value?.toString(),
            isProfileCompleted = u.isProfileCompleted,
            isPhoneVerified = u.privateInfo.isPhoneVerified,
            createdAt = u.metadata.createdAt.toString(),
            updatedAt = u.metadata.updatedAt.toString(),
            lastLoginAt = u.metadata.lastLoginAt.toString(),
            deletedAt = u.metadata.deletedAt?.toString(),
        )
    }
}

data class ChangeStatusRequest(
    val status: String,
    val reason: String? = null,
)

// ── 보강 (PR #10) ────────────────────────────────────────────────────────────

data class AdminFriendSummary(
    val userId: String,
    val nickname: String,
    val realName: String,
    val gender: String,
    val age: Int,
    val colorType: String?,
    val completionRate: Int,
    val status: String,
    val isDeleted: Boolean,
)

data class AdminUserStats(
    val colorType: String?,
    val profileCompletionRate: Int,
    val trustScore: Int,
    val viewCount: Int,
    val friendCount: Int,
    val matchmaking: MatchmakingStatBlock,
    val aiSignal: AiSignalStatBlock,
)

data class MatchmakingStatBlock(
    val sentTotal: Int,
    val sentCompleted: Int,
    val sentPending: Int,
    val receivedTotal: Int,
    val receivedCompleted: Int,
    val receivedPending: Int,
    val matchmakerTotal: Int,
    val matchmakerCompleted: Int,
)

data class AiSignalStatBlock(
    val last30DaysExposures: Int,
)

private fun computeAge(birthDate: LocalDate): Int {
    val today = LocalDate.now(ZoneId.of("Asia/Seoul"))
    return Period.between(birthDate, today).years
}

private fun maskPhone(phone: String): String {
    if (phone.length < 7) return phone
    return phone.substring(0, 3) + "****" + phone.takeLast(4)
}
