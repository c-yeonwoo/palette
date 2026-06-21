package kr.ai.palette.presentation.feed

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.billing.PointPrice
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.infrastructure.beta.BetaPolicy
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
    private val betaPolicy: BetaPolicy,
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
        @RequestParam(required = false) degree: Int?,  // 1=1촌만, 2=2촌만, null=전체
        // ── 추가 필터 (P0 — 컨셉 부합도 우선) ──
        @RequestParam(required = false) colorTypes: String?,  // CSV: "WARM_ORANGE,CALM_BLUE"
        @RequestParam(required = false) activeOnly: Boolean?, // true = 최근 7일 로그인
        @RequestParam(required = false) minTrustScore: Int?, // 신뢰도(0-100) 최소 점수 — '등급' 아님(브론즈/실버는 주선자 등급)
    ): ResponseEntity<FeedResponse> {
        // 색깔 필터 파싱 — CSV → Set<String>
        val colorTypeSet: Set<String> = colorTypes
            ?.split(",")
            ?.mapNotNull { it.trim().takeIf { s -> s.isNotEmpty() } }
            ?.toSet()
            .orEmpty()
        // minTrustScore 는 param 그대로 사용 (사진·영상 인증 신뢰도 점수 기준)

        // 활성 사용자 기준 — 최근 7일 (KST 무관, Instant 기준)
        val activeSince: java.time.Instant? = if (activeOnly == true) {
            java.time.Instant.now().minus(7, java.time.temporal.ChronoUnit.DAYS)
        } else null

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

                    // 색깔 필터 (P0) — 선택된 색 중 하나라도 매칭
                    if (colorTypeSet.isNotEmpty()) {
                        val profileColor = profile.colorType?.type?.name
                        if (profileColor == null || profileColor !in colorTypeSet) return@let null
                    }

                    // 활성 사용자 필터 (P0) — 최근 7일 내 로그인
                    if (activeSince != null) {
                        if (user.metadata.lastLoginAt.isBefore(activeSince)) return@let null
                    }

                    // 트러스트 점수 필터 (P0)
                    if (minTrustScore != null) {
                        if (profile.metrics.trustScore < minTrustScore) return@let null
                    }

                    // 공통 친구(주선 가능한 1촌) 찾기
                    val mutualFriends = firstDegreeFriendIds.filter { firstDegreeFriendId ->
                        friendshipRepository.findFriendIdsByUserId(firstDegreeFriendId).contains(userId)
                    }

                    // 공통 친구(주선 가능한 1촌) — 이름 + userId (프론트 MutualFriend 객체 형태).
                    // 과거 List<String> 으로 내려가 프론트에서 .name 이 undefined 로 찍히던 버그 수정.
                    val mutualFriendDtos = mutualFriends.mapNotNull { friendId ->
                        userRepository.findById(friendId)?.let { f ->
                            MutualFriendDto(name = f.privateInfo.realName, userId = friendId.value.toString())
                        }
                    }

                    FeedProfileItem(
                        profile = ProfileResponse.from(profile, fileStorageService),
                        mutualFriends = mutualFriendDtos,
                        degree = 2,
                        // 친친 열람 = 20 물감 (PointPrice). 베타 기간(BetaPolicy)엔 0 — 결제 유도 숨김.
                        viewCost = if (betaPolicy.freeUnlock) 0 else PointPrice.FRIEND_OF_FRIEND_VIEW,
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
    val mutualFriends: List<MutualFriendDto>,  // 공통 친구(주선 가능한 1촌) — 이름 + userId
    val degree: Int = 2,              // 1=1촌(무료), 2=친친(20 물감), 3=한 다리 더(30 물감)
    val viewCost: Int = PointPrice.FRIEND_OF_FRIEND_VIEW,  // 물감(P). 베타엔 0
    val isOpened: Boolean = false,    // 이미 카드를 열어본 여부
    val nickname: String? = null,     // 카드 소개 섹션용
    val age: Int? = null              // 카드 소개 섹션용
)

/** 공통 친구(주선자 후보) — 프론트 MutualFriend 와 동일 형태. name=실명, userId=주선자 선택용. */
data class MutualFriendDto(
    val name: String,
    val userId: String,
)

data class FriendsResponse(
    val friends: List<FriendInfo>,
    val totalCount: Int
)

data class FriendInfo(
    val userId: String,
    val nickname: String
)
