package kr.ai.palette.presentation.feed

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.storage.FileStorageService
import kr.ai.palette.persistence.feed.CardOpenEntity
import kr.ai.palette.persistence.feed.CardOpenJpaRepository
import kr.ai.palette.persistence.feed.FeedHideJpaRepository
import kr.ai.palette.presentation.profile.ProfileResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/v1/feed")
class FeedController(
    private val friendshipRepository: FriendshipRepository,
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository,
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val cardOpenJpaRepository: CardOpenJpaRepository,
    private val feedHideRepository: FeedHideJpaRepository,
    private val fileStorageService: FileStorageService,
    private val blockService: kr.ai.palette.application.safety.BlockService,
) {

    @GetMapping
    fun getHomeFeed(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestParam(required = false) ageMin: Int?,
        @RequestParam(required = false) ageMax: Int?,
        @RequestParam(required = false) heightMin: Int?,
        @RequestParam(required = false) heightMax: Int?,
        @RequestParam(required = false) region: String?,
        @RequestParam(required = false) jobCategory: String?,
        @RequestParam(required = false) degree: Int?  // 1=1촌만, 2=2촌만, null=전체
    ): ResponseEntity<FeedResponse> {
        val currentUserId = authUser.userId

        // 현재 사용자의 성별 가져오기
        val currentUser = userRepository.findById(currentUserId)
            ?: return ResponseEntity.notFound().build()
        val currentUserGender = currentUser.publicInfo.gender

        // 이미 카드를 열어본 목록
        val openedIds = cardOpenJpaRepository.findByViewerId(currentUserId.value)
            .map { it.targetUserId.toString() }.toSet()

        // 1촌 친구들의 ID 가져오기 (주선자 역할, 피드 노출 제외)
        val firstDegreeFriendIds = friendshipRepository.findFriendIdsByUserId(currentUserId)

        // 2촌 친구들의 ID 가져오기 (피드 노출 대상)
        val secondDegreeFriendIds = friendshipRepository.findSecondDegreeFriendIds(currentUserId)

        // 매칭 이력이 있는 사용자 전체 제외 (요청자/대상자 양방향, 모든 상태 포함)
        val matchHistoryExcluded = matchmakingRequestRepository.findByRequesterOrTarget(currentUserId)
            .flatMap { listOf(it.requesterId.value.toString(), it.targetUserId.value.toString()) }
            .toSet()

        // 숨김 처리한 프로필 제외
        val hiddenIds = feedHideRepository.findAllByUserId(currentUserId.value.toString())
            .map { it.targetUserId }.toSet()

        // 유저간 차단(양방향) 제외 — ADR 0023
        val blockedIds = blockService.blockedCounterpartIds(currentUserId.value)

        // 2촌만 피드에 노출 (1촌은 이미 아는 사람이므로 제외)
        val profileItems = secondDegreeFriendIds.distinct().mapNotNull { userId ->
            val user = userRepository.findById(userId)

            // 매칭 이력 또는 숨김 처리된 프로필 제외
            if (matchHistoryExcluded.contains(userId.value.toString())) return@mapNotNull null
            if (hiddenIds.contains(userId.value.toString())) return@mapNotNull null
            if (blockedIds.contains(userId.value)) return@mapNotNull null  // 유저간 차단 양방향 (ADR 0023)

            // 반대 성별만 필터링
            if (user != null && user.publicInfo.gender != currentUserGender) {
                profileRepository.findByUserId(userId)?.let { profile ->
                    // 소개/주선 받기 off·숨김 처리한 대상자 제외 (ADR 0022)
                    if (!profile.settings.canReceiveMatches()) return@let null

                    // 나이 필터
                    val userAge = user.publicInfo.getAge()
                    if (ageMin != null && userAge < ageMin) return@let null
                    if (ageMax != null && userAge > ageMax) return@let null

                    // 키 필터
                    val h = profile.basicInfo.height
                    if (heightMin != null && (h == null || h < heightMin)) return@let null
                    if (heightMax != null && (h == null || h > heightMax)) return@let null

                    // 지역 필터
                    if (!region.isNullOrBlank()) {
                        val profileRegion = profile.locationInfo?.sido
                        if (profileRegion == null || !profileRegion.contains(region, ignoreCase = true)) return@let null
                    }

                    // 직업 카테고리 필터
                    if (!jobCategory.isNullOrBlank()) {
                        val profileJob = profile.careerInfo?.category
                        if (profileJob == null || profileJob.name != jobCategory) return@let null
                    }

                    // 공통 친구(주선 가능한 1촌) 찾기
                    val mutualFriends = firstDegreeFriendIds.filter { firstDegreeFriendId ->
                        friendshipRepository.findFriendIdsByUserId(firstDegreeFriendId).contains(userId)
                    }

                    // 공통 친구들의 실명 가져오기
                    val mutualFriendNames = mutualFriends.mapNotNull { friendId ->
                        userRepository.findById(friendId)?.privateInfo?.realName
                    }

                    FeedProfileItem(
                        profile = ProfileResponse.from(profile, fileStorageService),
                        mutualFriends = mutualFriendNames,
                        degree = 2,
                        viewCost = 3000,
                        isOpened = openedIds.contains(userId.value.toString()),
                        nickname = user.publicInfo.nickname,
                        age = user.publicInfo.getAge()
                    )
                }
            } else {
                null
            }
        }

        return ResponseEntity.ok(
            FeedResponse(
                items = profileItems,
                totalCount = profileItems.size
            )
        )
    }

    /**
     * 카드 열람 기록 저장 (최초 1회만, 이미 열람한 경우 무시)
     */
    @PostMapping("/open/{targetUserId}")
    fun openCard(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: UUID
    ): ResponseEntity<Void> {
        val viewerId = authUser.userId.value
        if (!cardOpenJpaRepository.existsByViewerIdAndTargetUserId(viewerId, targetUserId)) {
            cardOpenJpaRepository.save(CardOpenEntity(viewerId = viewerId, targetUserId = targetUserId))
        }
        return ResponseEntity.ok().build()
    }

    @GetMapping("/friends")
    fun getMyFriends(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<FriendsResponse> {
        val currentUserId = authUser.userId

        // 1촌 친구들의 ID 가져오기
        val friendIds = friendshipRepository.findFriendIdsByUserId(currentUserId)

        // 친구들의 기본 정보 가져오기
        val friends = friendIds.mapNotNull { userId ->
            userRepository.findById(userId)?.let { user ->
                FriendInfo(
                    userId = user.id.value.toString(),
                    nickname = user.publicInfo.nickname
                )
            }
        }

        return ResponseEntity.ok(
            FriendsResponse(
                friends = friends,
                totalCount = friends.size
            )
        )
    }
}

data class FeedResponse(
    val items: List<FeedProfileItem>,
    val totalCount: Int
)

data class FeedProfileItem(
    val profile: ProfileResponse,
    val mutualFriends: List<String>,  // 공통 친구들의 닉네임 리스트
    val degree: Int = 2,              // 1=1촌(free), 2=2촌(3,000원), 3=3촌(5,000원)
    val viewCost: Int = 3000,         // 0 for free
    val isOpened: Boolean = false,    // 이미 카드를 열어본 여부
    val nickname: String? = null,     // 카드 소개 섹션용
    val age: Int? = null              // 카드 소개 섹션용
)

data class FriendsResponse(
    val friends: List<FriendInfo>,
    val totalCount: Int
)

data class FriendInfo(
    val userId: String,
    val nickname: String
)
