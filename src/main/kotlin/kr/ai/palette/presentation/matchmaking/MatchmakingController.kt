package kr.ai.palette.presentation.matchmaking

import kr.ai.palette.application.matchmaking.MatchmakingService
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.notification.PaletteEvent
import kr.ai.palette.domain.profile.ProfileRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.application.safety.BlockService
import kr.ai.palette.infrastructure.ratelimit.RateLimiter
import org.springframework.context.ApplicationEventPublisher
import java.time.Duration
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/matchmaking")
class MatchmakingController(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val matchmakingService: MatchmakingService,
    private val userRepository: UserRepository,
    private val profileRepository: ProfileRepository,
    private val rateLimiter: RateLimiter,
    private val blockService: BlockService,
    private val eventPublisher: ApplicationEventPublisher
) {

    @GetMapping("/cooltime-status")
    fun getCoolTimeStatus(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<CoolTimeStatusResponse> {
        val requesterId = authUser.userId
        val coolTimeDays = 10L

        val lastCompleted = matchmakingRequestRepository.findLatestCompletedByRequesterId(requesterId)

        if (lastCompleted == null) {
            return ResponseEntity.ok(CoolTimeStatusResponse(inCoolTime = false, remainingDays = 0, coolTimeDays = coolTimeDays.toInt()))
        }

        val coolTimeEnd = lastCompleted.updatedAt.plusDays(coolTimeDays)
        val now = java.time.LocalDateTime.now()

        return if (now.isBefore(coolTimeEnd)) {
            val remaining = java.time.temporal.ChronoUnit.DAYS.between(now, coolTimeEnd) + 1
            ResponseEntity.ok(CoolTimeStatusResponse(inCoolTime = true, remainingDays = remaining.toInt(), coolTimeDays = coolTimeDays.toInt()))
        } else {
            ResponseEntity.ok(CoolTimeStatusResponse(inCoolTime = false, remainingDays = 0, coolTimeDays = coolTimeDays.toInt()))
        }
    }

    @PostMapping("/request")
    fun createMatchmakingRequest(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: CreateMatchmakingRequestDto
    ): ResponseEntity<MatchmakingRequestResponse> {
        val requesterId = authUser.userId

        // 어뷰징 방지: 매칭 요청 rate limit (ADR 0023)
        rateLimiter.enforce("match:${requesterId.value}", 10, Duration.ofDays(1), "매칭 요청이 너무 잦습니다. 잠시 후 다시 시도해주세요")

        // Check cooltime (10 days after last successful match)
        val coolTimeDays = 10L
        val lastCompleted = matchmakingRequestRepository.findLatestCompletedByRequesterId(requesterId)

        if (lastCompleted != null) {
            val coolTimeEnd = lastCompleted.updatedAt.plusDays(coolTimeDays)
            if (java.time.LocalDateTime.now().isBefore(coolTimeEnd)) {
                return ResponseEntity.status(429).build()
            }
        }

        val targetUserId = UserId(UUID.fromString(request.targetUserId))

        // Check if already requested
        if (matchmakingRequestRepository.existsByRequesterIdAndTargetUserId(requesterId, targetUserId)) {
            return ResponseEntity.badRequest().build()
        }

        // 차단 관계(양방향)면 요청 차단 (ADR 0023)
        if (blockService.isBlockedBetween(requesterId.value, targetUserId.value)) {
            return ResponseEntity.status(403).build()
        }

        // 대상자가 소개/주선 받기를 꺼뒀거나 숨김이면 요청 차단 (ADR 0022)
        val targetProfile = profileRepository.findByUserId(targetUserId)
        if (targetProfile != null && !targetProfile.settings.canReceiveMatches()) {
            return ResponseEntity.status(403).build()
        }

        // Find matchmaker by real name
        val matchmaker = findUserByRealName(request.matchmakerName)
            ?: return ResponseEntity.badRequest().build()

        val matchmakingRequest = MatchmakingRequest.create(
            requesterId = requesterId,
            targetUserId = UserId(UUID.fromString(request.targetUserId)),
            matchmakerId = matchmaker.id,
            requesterMessage = request.message
        )

        val saved = matchmakingRequestRepository.save(matchmakingRequest)

        // 주선자에게 새 요청 알림 이벤트 발행
        val requesterName = userRepository.findById(requesterId)?.privateInfo?.realName
            ?: userRepository.findById(requesterId)?.publicInfo?.nickname ?: "요청자"
        val targetName = userRepository.findById(UserId(UUID.fromString(request.targetUserId)))
            ?.publicInfo?.nickname ?: "상대방"
        eventPublisher.publishEvent(
            PaletteEvent.MatchmakingRequested(
                requestId = saved.id.value.toString(),
                matchmakerId = matchmaker.id.value.toString(),
                requesterName = requesterName,
                targetName = targetName
            )
        )

        return ResponseEntity.ok(MatchmakingRequestResponse.from(saved))
    }

    @GetMapping("/check/{targetUserId}")
    fun checkMatchmakingRequest(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable targetUserId: String
    ): ResponseEntity<CheckMatchmakingRequestResponse> {
        val exists = matchmakingRequestRepository.existsByRequesterIdAndTargetUserId(
            authUser.userId,
            UserId(UUID.fromString(targetUserId))
        )
        return ResponseEntity.ok(CheckMatchmakingRequestResponse(exists))
    }

    @GetMapping("/requests")
    fun getMatchmakingRequests(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MatchmakingRequestListResponse> {
        val requests = matchmakingRequestRepository.findByMatchmakerId(authUser.userId)
            .sortedByDescending { it.createdAt } // 최신순 정렬

        val enrichedRequests = requests.map { request ->
            val requester = userRepository.findById(request.requesterId)
            val target = userRepository.findById(request.targetUserId)
            val matchmaker = userRepository.findById(request.matchmakerId)

            MatchmakingRequestResponse.from(
                request,
                requesterNickname = requester?.publicInfo?.nickname,
                requesterRealName = requester?.privateInfo?.realName,
                targetNickname = target?.publicInfo?.nickname,
                targetRealName = target?.privateInfo?.realName,
                matchmakerName = matchmaker?.privateInfo?.realName
            )
        }

        return ResponseEntity.ok(
            MatchmakingRequestListResponse(
                requests = enrichedRequests,
                totalCount = enrichedRequests.size
            )
        )
    }

    @GetMapping("/requests/pending")
    fun getPendingMatchmakingRequests(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MatchmakingRequestListResponse> {
        val pendingStatus = MatchmakingRequestStatus.PENDING
        val approvedStatus = MatchmakingRequestStatus.MATCHMAKER_APPROVED

        val pendingRequests = (matchmakingRequestRepository.findByRequesterIdAndStatus(authUser.userId, pendingStatus) +
            matchmakingRequestRepository.findByRequesterIdAndStatus(authUser.userId, approvedStatus))
            .sortedByDescending { it.createdAt }

        val enrichedRequests = pendingRequests.map { request ->
            val matchmaker = userRepository.findById(request.matchmakerId)
            val target = userRepository.findById(request.targetUserId)

            MatchmakingRequestResponse.from(
                request,
                requesterNickname = null,
                requesterRealName = null,
                targetNickname = target?.publicInfo?.nickname,
                targetRealName = target?.privateInfo?.realName,
                matchmakerName = matchmaker?.privateInfo?.realName
            )
        }

        return ResponseEntity.ok(
            MatchmakingRequestListResponse(
                requests = enrichedRequests,
                totalCount = enrichedRequests.size
            )
        )
    }

    @PutMapping("/requests/{requestId}/matchmaker/approve")
    fun approveMatchmakingRequest(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: String,
        @RequestBody request: ApprovalRequestDto
    ): ResponseEntity<MatchmakingRequestResponse> {
        try {
            val approved = matchmakingService.approveByMatchmaker(
                requestId = MatchmakingRequestId(UUID.fromString(requestId)),
                matchmakerId = authUser.userId,
                message = request.message
            )
            return ResponseEntity.ok(MatchmakingRequestResponse.from(approved))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().build()
        }
    }

    @PutMapping("/requests/{requestId}/matchmaker/reject")
    fun rejectMatchmakingRequest(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: String,
        @RequestBody request: RejectionRequestDto
    ): ResponseEntity<MatchmakingRequestResponse> {
        try {
            val rejected = matchmakingService.rejectByMatchmaker(
                requestId = MatchmakingRequestId(UUID.fromString(requestId)),
                matchmakerId = authUser.userId,
                message = request.message
            )
            return ResponseEntity.ok(MatchmakingRequestResponse.from(rejected))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().build()
        }
    }

    @PutMapping("/requests/{requestId}/target/accept")
    fun acceptByTarget(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: String,
        @RequestBody request: ApprovalRequestDto
    ): ResponseEntity<MatchmakingRequestResponse> {
        try {
            val accepted = matchmakingService.acceptByTarget(
                requestId = MatchmakingRequestId(UUID.fromString(requestId)),
                targetUserId = authUser.userId,
                message = request.message
            )
            return ResponseEntity.ok(MatchmakingRequestResponse.from(accepted))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().build()
        }
    }

    @PutMapping("/requests/{requestId}/target/reject")
    fun rejectByTarget(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: String,
        @RequestBody request: RejectionRequestDto
    ): ResponseEntity<MatchmakingRequestResponse> {
        try {
            val rejected = matchmakingService.rejectByTarget(
                requestId = MatchmakingRequestId(UUID.fromString(requestId)),
                targetUserId = authUser.userId,
                message = request.message
            )
            return ResponseEntity.ok(MatchmakingRequestResponse.from(rejected))
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().build()
        }
    }

    @GetMapping("/requests/target/pending")
    fun getPendingTargetRequests(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<MatchmakingRequestListResponse> {
        val requests = matchmakingRequestRepository.findByTargetUserId(authUser.userId)
            .filter { it.status == MatchmakingRequestStatus.MATCHMAKER_APPROVED }
            .sortedByDescending { it.createdAt }

        val enrichedRequests = requests.map { request ->
            val requester = userRepository.findById(request.requesterId)
            val matchmaker = userRepository.findById(request.matchmakerId)

            MatchmakingRequestResponse.from(
                request,
                requesterNickname = requester?.publicInfo?.nickname,
                requesterRealName = requester?.privateInfo?.realName,
                targetNickname = null,
                targetRealName = null,
                matchmakerName = matchmaker?.privateInfo?.realName
            )
        }

        return ResponseEntity.ok(
            MatchmakingRequestListResponse(
                requests = enrichedRequests,
                totalCount = enrichedRequests.size
            )
        )
    }

    private fun findUserByRealName(realName: String): kr.ai.palette.domain.user.User? {
        // This is a simplified implementation
        // In a real scenario, you might want to add a method to UserRepository
        return userRepository.findAll()
            .firstOrNull { it.privateInfo.realName == realName }
    }
}

data class CreateMatchmakingRequestDto(
    val targetUserId: String,
    val matchmakerName: String,
    val message: String?
)

data class CheckMatchmakingRequestResponse(
    val exists: Boolean
)

data class MatchmakingRequestResponse(
    val id: String,
    val requesterId: String,
    val requesterNickname: String?,
    val requesterRealName: String?,
    val targetUserId: String,
    val targetNickname: String?,
    val targetRealName: String?,
    val matchmakerId: String,
    val matchmakerName: String?,
    val message: String?,
    val status: String,
    val createdAt: String,
    val updatedAt: String
) {
    companion object {
        fun from(request: MatchmakingRequest): MatchmakingRequestResponse {
            return MatchmakingRequestResponse(
                id = request.id.value.toString(),
                requesterId = request.requesterId.value.toString(),
                requesterNickname = null,
                requesterRealName = null,
                targetUserId = request.targetUserId.value.toString(),
                targetNickname = null,
                targetRealName = null,
                matchmakerId = request.matchmakerId.value.toString(),
                matchmakerName = null,
                message = request.requesterMessage,
                status = request.status.name,
                createdAt = request.createdAt.toString(),
                updatedAt = request.updatedAt.toString()
            )
        }

        fun from(
            request: MatchmakingRequest,
            requesterNickname: String?,
            requesterRealName: String?,
            targetNickname: String?,
            targetRealName: String?,
            matchmakerName: String?
        ): MatchmakingRequestResponse {
            return MatchmakingRequestResponse(
                id = request.id.value.toString(),
                requesterId = request.requesterId.value.toString(),
                requesterNickname = requesterNickname,
                requesterRealName = requesterRealName,
                targetUserId = request.targetUserId.value.toString(),
                targetNickname = targetNickname,
                targetRealName = targetRealName,
                matchmakerId = request.matchmakerId.value.toString(),
                matchmakerName = matchmakerName,
                message = request.requesterMessage,
                status = request.status.name,
                createdAt = request.createdAt.toString(),
                updatedAt = request.updatedAt.toString()
            )
        }
    }
}

data class MatchmakingRequestListResponse(
    val requests: List<MatchmakingRequestResponse>,
    val totalCount: Int
)

data class ApprovalRequestDto(
    val message: String?
)

data class RejectionRequestDto(
    val message: String?
)

data class CoolTimeStatusResponse(
    val inCoolTime: Boolean,
    val remainingDays: Int,
    val coolTimeDays: Int
)
