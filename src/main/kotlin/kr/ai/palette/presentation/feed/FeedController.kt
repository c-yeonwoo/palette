package kr.ai.palette.presentation.feed

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.presentation.profile.ProfileResponse
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/feed")
class FeedController(
    private val friendshipRepository: FriendshipRepository,
    private val profileRepository: ProfileRepository,
    private val userRepository: UserRepository
) {

    @GetMapping
    fun getHomeFeed(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<FeedResponse> {
        val currentUserId = authUser.userId

        // 현재 사용자의 성별 가져오기
        val currentUser = userRepository.findById(currentUserId)
            ?: return ResponseEntity.notFound().build()
        val currentUserGender = currentUser.publicInfo.gender

        // 1촌 친구들의 ID 가져오기
        val firstDegreeFriendIds = friendshipRepository.findFriendIdsByUserId(currentUserId)

        // 2촌 친구들의 ID 가져오기
        val secondDegreeFriendIds = friendshipRepository.findSecondDegreeFriendIds(currentUserId)

        // 2촌 친구들의 프로필과 공통 친구 정보 가져오기 (반대 성별만)
        val profileItems = secondDegreeFriendIds.mapNotNull { userId ->
            val user = userRepository.findById(userId)

            // 반대 성별만 필터링
            if (user != null && user.publicInfo.gender != currentUserGender) {
                profileRepository.findByUserId(userId)?.let { profile ->
                    // 이 프로필과 나 사이의 공통 친구 찾기
                    val mutualFriends = firstDegreeFriendIds.filter { firstDegreeFriendId ->
                        friendshipRepository.findFriendIdsByUserId(firstDegreeFriendId).contains(userId)
                    }

                    // 공통 친구들의 실명 가져오기
                    val mutualFriendNames = mutualFriends.mapNotNull { friendId ->
                        userRepository.findById(friendId)?.privateInfo?.realName
                    }

                    FeedProfileItem(
                        profile = ProfileResponse.from(profile),
                        mutualFriends = mutualFriendNames
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
    val mutualFriends: List<String>  // 공통 친구들의 닉네임 리스트
)

data class FriendsResponse(
    val friends: List<FriendInfo>,
    val totalCount: Int
)

data class FriendInfo(
    val userId: String,
    val nickname: String
)
