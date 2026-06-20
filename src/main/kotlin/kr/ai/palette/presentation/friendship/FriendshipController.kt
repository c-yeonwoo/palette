package kr.ai.palette.presentation.friendship

import kr.ai.palette.application.notification.NotificationService
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.friendship.Friendship
import kr.ai.palette.domain.friendship.FriendshipId
import kr.ai.palette.domain.friendship.FriendshipRepository
import kr.ai.palette.domain.friendship.FriendshipStatus
import kr.ai.palette.domain.notification.NotificationType
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.ratelimit.RateLimiter
import kr.ai.palette.persistence.friendship.InviteCodeEntity
import kr.ai.palette.persistence.friendship.InviteCodeJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Duration
import java.time.Instant
import java.util.UUID

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

@RestController
@RequestMapping("/api/v1/friends")
class FriendshipController(
    private val friendshipRepository: FriendshipRepository,
    private val userRepository: UserRepository,
    private val notificationService: NotificationService,
    private val inviteCodeJpaRepository: InviteCodeJpaRepository,
    private val rateLimiter: RateLimiter,
    private val welcomeBonusService: kr.ai.palette.application.billing.WelcomeBonusService,
    private val profileRepository: ProfileRepository,
) {

    companion object {
        private fun generateCode(): String {
            val chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
            return (1..6).map { chars.random() }.joinToString("")
        }
    }

    /**
     * 초대 코드 생성
     */
    @PostMapping("/invite-code")
    @Transactional
    fun generateInviteCode(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<InviteCodeResponse> {
        val userId = authUser.userId.value
        // 기존 코드 삭제 (유저당 1개)
        inviteCodeJpaRepository.deleteByUserId(userId)

        val code = generateCode()
        val expiresAt = Instant.now().plusSeconds(86400) // 24시간
        inviteCodeJpaRepository.save(
            InviteCodeEntity(userId = userId, code = code, expiresAt = expiresAt)
        )

        return ResponseEntity.ok(InviteCodeResponse(code = code, expiresAt = expiresAt.toString()))
    }

    /**
     * 초대 코드로 친구 연결
     */
    @PostMapping("/join")
    @Transactional
    fun joinByInviteCode(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: JoinByCodeRequest
    ): ResponseEntity<Map<String, Any>> {
        val myUserId = authUser.userId
        val codeEntity = inviteCodeJpaRepository.findByCode(request.code.trim().uppercase())
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "유효하지 않은 초대 코드입니다"))

        if (codeEntity.expiresAt.isBefore(Instant.now())) {
            inviteCodeJpaRepository.delete(codeEntity)
            return ResponseEntity.badRequest().body(mapOf("error" to "만료된 초대 코드입니다"))
        }

        val inviterUserId = UserId(codeEntity.userId)

        if (inviterUserId == myUserId) {
            return ResponseEntity.badRequest().body(mapOf("error" to "자신의 초대 코드는 사용할 수 없습니다"))
        }

        if (friendshipRepository.existsBetweenUsers(myUserId, inviterUserId)) {
            return ResponseEntity.badRequest().body(mapOf("error" to "이미 친구 관계입니다"))
        }

        val now = Instant.now()
        val friendship = Friendship(
            id = FriendshipId.generate(),
            user1Id = inviterUserId,
            user2Id = myUserId,
            status = FriendshipStatus.ACCEPTED,
            createdAt = now,
            acceptedAt = now
        )
        friendshipRepository.save(friendship)
        inviteCodeJpaRepository.delete(codeEntity) // 1회용 코드 삭제

        val inviterUser = userRepository.findById(inviterUserId)
        return ResponseEntity.ok(
            mapOf(
                "success" to true,
                "message" to "${inviterUser?.publicInfo?.nickname ?: "상대방"}님과 친구가 되었습니다!",
                "friendUserId" to inviterUserId.value.toString()
            )
        )
    }

    /**
     * 사용자 검색 — 닉네임(부분일치) 또는 휴대폰 번호.
     * 동명이인·오검색 리스크 때문에 이름이 아닌 닉네임/번호로 찾는다.
     * 휴대폰은 **정확히 일치할 때만** 매칭 (부분일치 X) — 번호 전체를 알아야 찾히므로 무작위 열람 차단.
     */
    @GetMapping("/search")
    fun searchUsers(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestParam query: String
    ): ResponseEntity<List<SearchUserResponse>> {
        if (query.trim().length < 2) {
            return ResponseEntity.ok(emptyList())
        }

        val queryDigits = query.filter { it.isDigit() }
        val isPhoneQuery = queryDigits.length >= 8   // 010xxxxxxx 류 — 번호 검색으로 간주

        val myUserId = authUser.userId
        val users = userRepository.findAll()
            .filter { user ->
                if (user.id == myUserId) return@filter false
                val byNickname = user.publicInfo.nickname.contains(query.trim(), ignoreCase = true)
                val byPhone = isPhoneQuery &&
                    user.privateInfo.getEffectivePhoneNumber()?.filter { it.isDigit() } == queryDigits
                byNickname || byPhone
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

        // 어뷰징 방지: 친구 요청 rate limit — 콜드 add/코드 블래스팅 차단 (ADR 0023)
        rateLimiter.enforce("friendreq:${myUserId.value}", 30, Duration.ofDays(1), "친구 요청이 너무 잦습니다. 잠시 후 다시 시도해주세요")

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

        // 피요청자에게 알림
        val requesterName = userRepository.findById(myUserId)?.publicInfo?.nickname ?: "누군가"
        notificationService.create(
            userId = targetId.value.toString(),
            type = NotificationType.FRIEND_REQUEST,
            title = "새 친구 요청",
            body = "${requesterName}님이 친구 요청을 보냈습니다",
            metadata = mapOf("friendshipId" to saved.id.value.toString())
        )

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

        // 원래 요청자에게 수락 알림
        val accepterName = userRepository.findById(myUserId)?.publicInfo?.nickname ?: "상대방"
        notificationService.create(
            userId = friendship.user1Id.value.toString(),
            type = NotificationType.FRIEND_ACCEPTED,
            title = "친구 요청이 수락되었습니다 🤝",
            body = "${accepterName}님이 친구 요청을 수락했습니다",
            metadata = mapOf("friendshipId" to friendship.id.value.toString())
        )

        // 친구 가입 보너스 — 양쪽에 열람권 1장 (ADR 0041, B-002)
        // 어뷰징 가드: 수락된 친구는 양방향 1회만 발생 (PENDING → ACCEPTED 전이 1회)
        runCatching {
            welcomeBonusService.grantFriendSignupBonus(friendship.user1Id.value.toString())
            welcomeBonusService.grantFriendSignupBonus(friendship.user2Id.value.toString())
        }.onFailure { e ->
            org.slf4j.LoggerFactory.getLogger(FriendshipController::class.java)
                .warn("친구 가입 보너스 지급 실패 friendship={} error={}", friendship.id.value, e.message)
        }

        // B-007 retention 트리거 — 양쪽에 "지인이 가입했어요" 알림
        // (수락 알림과 별개로, 네트워크 가치 증가를 시각화)
        val requesterName = userRepository.findById(friendship.user1Id)?.publicInfo?.nickname ?: "지인"
        notificationService.create(
            userId = friendship.user2Id.value.toString(),
            type = NotificationType.FRIEND_NEW_SIGNUP,
            title = "지인 네트워크가 넓어졌어요 🌿",
            body = "${requesterName}님과 연결됐어요. 친구의 친구가 보일 수 있어요",
            metadata = mapOf("friendshipId" to friendship.id.value.toString())
        )

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
            // 데이팅 프로필 없는 지인(주선자 전용 등)은 제외 — 데이팅 프로필 있는 지인만 노출
            if (!profileRepository.existsByUserId(friendId)) return@mapNotNull null
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
