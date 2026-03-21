package kr.ai.palette.presentation.friendship

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.Friendship
import kr.ai.palette.domain.friendship.FriendshipId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.friendship.FriendshipStatus
import kr.ai.palette.domain.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

data class InviteCodeResponse(val code: String, val expiresAt: String)
data class JoinByCodeRequest(val code: String)
data class FriendRequestResponse(
    val id: String,
    val userId: String,
    val nickname: String,
    val status: String,
    val createdAt: String
)
data class FriendResponse(
    val id: String,
    val userId: String,
    val nickname: String,
    val acceptedAt: String?
)
data class SearchUserResponse(
    val userId: String,
    val nickname: String,
    val isFriend: Boolean,
    val hasPendingRequest: Boolean
)

private data class InviteCodeData(
    val userId: UserId,
    val code: String,
    val createdAt: Instant,
    val expiresAt: Instant
)

@RestController
@RequestMapping("/api/v1/friends")
class FriendshipController(
    private val friendshipRepository: FriendshipRepository,
    private val userRepository: UserRepository
) {

    companion object {
        // In-memory invite code store (production: use Redis or DB)
        private val inviteCodes = ConcurrentHashMap<String, InviteCodeData>()

        private fun generateCode(): String {
            val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
            return (1..6).map { chars.random() }.joinToString("")
        }
    }

    /**
     * 초대 코드 생성
     */
    @PostMapping("/invite-code")
    fun generateInviteCode(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<InviteCodeResponse> {
        val userId = authUser.userId
        // Remove existing code for this user
        inviteCodes.entries.removeIf { it.value.userId == userId }

        val code = generateCode()
        val now = Instant.now()
        val expiresAt = now.plusSeconds(86400) // 24 hours
        inviteCodes[code] = InviteCodeData(userId, code, now, expiresAt)

        return ResponseEntity.ok(
            InviteCodeResponse(code = code, expiresAt = expiresAt.toString())
        )
    }

    /**
     * 초대 코드로 친구 연결
     */
    @PostMapping("/join")
    fun joinByInviteCode(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: JoinByCodeRequest
    ): ResponseEntity<Map<String, Any>> {
        val myUserId = authUser.userId
        val codeData = inviteCodes[request.code.uppercase()]
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "유효하지 않은 초대 코드입니다"))

        if (codeData.expiresAt.isBefore(Instant.now())) {
            inviteCodes.remove(request.code.uppercase())
            return ResponseEntity.badRequest().body(mapOf("error" to "만료된 초대 코드입니다"))
        }

        if (codeData.userId == myUserId) {
            return ResponseEntity.badRequest().body(mapOf("error" to "자신의 초대 코드는 사용할 수 없습니다"))
        }

        if (friendshipRepository.existsBetweenUsers(myUserId, codeData.userId)) {
            return ResponseEntity.badRequest().body(mapOf("error" to "이미 친구 관계입니다"))
        }

        val now = Instant.now()
        val friendship = Friendship(
            id = FriendshipId.generate(),
            user1Id = codeData.userId,
            user2Id = myUserId,
            status = FriendshipStatus.ACCEPTED,
            createdAt = now,
            acceptedAt = now
        )
        friendshipRepository.save(friendship)
        inviteCodes.remove(request.code.uppercase())

        val inviterUser = userRepository.findById(codeData.userId)
        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "message" to "${inviterUser?.publicInfo?.nickname ?: "상대방"}님과 친구가 되었습니다!",
                "friendUserId" to codeData.userId.value.toString()
            )
        )
    }

    /**
     * 사용자 검색 (닉네임)
     */
    @GetMapping("/search")
    fun searchUsers(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestParam query: String
    ): ResponseEntity<List<SearchUserResponse>> {
        if (query.length < 2) {
            return ResponseEntity.ok(emptyList())
        }

        val myUserId = authUser.userId
        val users = userRepository.findAll()
            .filter { user ->
                user.id != myUserId &&
                user.publicInfo.nickname.contains(query, ignoreCase = true)
            }
            .take(20)

        val myFriendIds = friendshipRepository.findFriendIdsByUserId(myUserId).toSet()
        val myPendingRequests = friendshipRepository.findByUserId(myUserId)
            .filter { it.status == FriendshipStatus.PENDING }
            .map { if (it.user1Id == myUserId) it.user2Id else it.user1Id }
            .toSet()

        val result = users.map { user ->
            SearchUserResponse(
                userId = user.id.value.toString(),
                nickname = user.publicInfo.nickname,
                isFriend = user.id in myFriendIds,
                hasPendingRequest = user.id in myPendingRequests
            )
        }

        return ResponseEntity.ok(result)
    }

    /**
     * 친구 요청 보내기
     */
    @PostMapping("/request/{targetUserId}")
    fun sendFriendRequest(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: UUID
    ): ResponseEntity<Map<String, Any>> {
        val myUserId = authUser.userId
        val targetId = UserId(targetUserId)

        userRepository.findById(targetId)
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "존재하지 않는 사용자입니다"))

        if (friendshipRepository.existsBetweenUsers(myUserId, targetId)) {
            return ResponseEntity.badRequest().body(mapOf("error" to "이미 친구 요청을 보냈거나 친구 관계입니다"))
        }

        val friendship = Friendship(
            id = FriendshipId.generate(),
            user1Id = myUserId,
            user2Id = targetId,
            status = FriendshipStatus.PENDING,
            createdAt = Instant.now(),
            acceptedAt = null
        )
        val saved = friendshipRepository.save(friendship)

        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "requestId" to saved.id.value.toString(),
                "message" to "친구 요청을 보냈습니다"
            )
        )
    }

    /**
     * 친구 요청 수락
     */
    @PutMapping("/request/{requestId}/accept")
    fun acceptFriendRequest(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: UUID
    ): ResponseEntity<Map<String, Any>> {
        val myUserId = authUser.userId
        val friendship = friendshipRepository.findById(FriendshipId(requestId))
            ?: return ResponseEntity.notFound().build()

        if (friendship.user2Id != myUserId) {
            return ResponseEntity.status(403).body(mapOf("error" to "수락 권한이 없습니다"))
        }

        if (friendship.status != FriendshipStatus.PENDING) {
            return ResponseEntity.badRequest().body(mapOf("error" to "이미 처리된 요청입니다"))
        }

        val accepted = friendship.accept(Instant.now())
        friendshipRepository.save(accepted)

        return ResponseEntity.ok(mapOf("success" to true, "message" to "친구 요청을 수락했습니다"))
    }

    /**
     * 받은 친구 요청 목록
     */
    @GetMapping("/requests/pending")
    fun getPendingRequests(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<List<FriendRequestResponse>> {
        val myUserId = authUser.userId
        val pending = friendshipRepository.findByUserId(myUserId)
            .filter { it.status == FriendshipStatus.PENDING && it.user2Id == myUserId }

        val result = pending.mapNotNull { friendship ->
            val requester = userRepository.findById(friendship.user1Id) ?: return@mapNotNull null
            FriendRequestResponse(
                id = friendship.id.value.toString(),
                userId = friendship.user1Id.value.toString(),
                nickname = requester.publicInfo.nickname,
                status = friendship.status.name,
                createdAt = friendship.createdAt.toString()
            )
        }

        return ResponseEntity.ok(result)
    }

    /**
     * 내 친구 목록
     */
    @GetMapping
    fun getMyFriends(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<List<FriendResponse>> {
        val myUserId = authUser.userId
        val friendships = friendshipRepository.findAcceptedFriendshipsByUserId(myUserId)

        val result = friendships.mapNotNull { friendship ->
            val friendId = friendship.getOtherUserId(myUserId)
            val friend = userRepository.findById(friendId) ?: return@mapNotNull null
            FriendResponse(
                id = friendship.id.value.toString(),
                userId = friendId.value.toString(),
                nickname = friend.publicInfo.nickname,
                acceptedAt = friendship.acceptedAt?.toString()
            )
        }

        return ResponseEntity.ok(result)
    }
}
