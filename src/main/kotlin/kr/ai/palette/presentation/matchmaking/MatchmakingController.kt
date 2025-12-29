package kr.ai.palette.presentation.matchmaking

import kr.ai.palette.application.matchmaking.MatchmakingService
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/matchmaking")
class MatchmakingController(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val matchmakingService: MatchmakingService,
    private val userRepository: UserRepository
) {

    @PostMapping("/request")
    fun createMatchmakingRequest(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: CreateMatchmakingRequestDto
    ): ResponseEntity<MatchmakingRequestResponse> {
        val requesterId = authUser.userId

        // Check if already requested
        if (matchmakingRequestRepository.existsByRequesterIdAndTargetUserId(
                requesterId,
                UserId(UUID.fromString(request.targetUserId))
            )) {
            return ResponseEntity.badRequest().build()
        }

        // Find matchmaker by real name
        val matchmaker = findUserByRealName(request.matchmakerName)
            ?: return ResponseEntity.badRequest().build()

        val matchmakingRequest = MatchmakingRequest.create(
            requesterId = requesterId,
            targetUserId = UserId(UUID.fromString(request.targetUserId)),
            matchmakerId = matchmaker.id,
            message = request.message
        )

        val saved = matchmakingRequestRepository.save(matchmakingRequest)
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

        val allRequests = matchmakingRequestRepository.findAll()
        val pendingRequests = allRequests
            .filter {
                it.requesterId == authUser.userId &&
                (it.status == pendingStatus || it.status == approvedStatus)
            }
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
