package kr.ai.palette.presentation.matchmaking

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.user.UserRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/matchmaking")
class MatchmakingController(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
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
                targetNickname = target?.publicInfo?.nickname,
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
        val allRequests = matchmakingRequestRepository.findAll()
        val pendingRequests = allRequests
            .filter { it.requesterId == authUser.userId && it.status == kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus.PENDING }
            .sortedByDescending { it.createdAt }

        return ResponseEntity.ok(
            MatchmakingRequestListResponse(
                requests = pendingRequests.map { MatchmakingRequestResponse.from(it) },
                totalCount = pendingRequests.size
            )
        )
    }

    @PutMapping("/requests/{requestId}/approve")
    fun approveMatchmakingRequest(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: String
    ): ResponseEntity<MatchmakingRequestResponse> {
        val request = matchmakingRequestRepository.findById(MatchmakingRequestId(UUID.fromString(requestId)))
            ?: return ResponseEntity.notFound().build()

        if (request.matchmakerId != authUser.userId) {
            return ResponseEntity.status(403).build()
        }

        val approved = request.approve()
        val saved = matchmakingRequestRepository.save(approved)
        return ResponseEntity.ok(MatchmakingRequestResponse.from(saved))
    }

    @PutMapping("/requests/{requestId}/reject")
    fun rejectMatchmakingRequest(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: String
    ): ResponseEntity<MatchmakingRequestResponse> {
        val request = matchmakingRequestRepository.findById(MatchmakingRequestId(UUID.fromString(requestId)))
            ?: return ResponseEntity.notFound().build()

        if (request.matchmakerId != authUser.userId) {
            return ResponseEntity.status(403).build()
        }

        val rejected = request.reject()
        val saved = matchmakingRequestRepository.save(rejected)
        return ResponseEntity.ok(MatchmakingRequestResponse.from(saved))
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
    val targetUserId: String,
    val targetNickname: String?,
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
                targetUserId = request.targetUserId.value.toString(),
                targetNickname = null,
                matchmakerId = request.matchmakerId.value.toString(),
                matchmakerName = null,
                message = request.message,
                status = request.status.name,
                createdAt = request.createdAt.toString(),
                updatedAt = request.updatedAt.toString()
            )
        }

        fun from(request: MatchmakingRequest, requesterNickname: String?, targetNickname: String?, matchmakerName: String?): MatchmakingRequestResponse {
            return MatchmakingRequestResponse(
                id = request.id.value.toString(),
                requesterId = request.requesterId.value.toString(),
                requesterNickname = requesterNickname,
                targetUserId = request.targetUserId.value.toString(),
                targetNickname = targetNickname,
                matchmakerId = request.matchmakerId.value.toString(),
                matchmakerName = matchmakerName,
                message = request.message,
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
