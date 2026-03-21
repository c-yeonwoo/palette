package kr.ai.palette.presentation.matchmaking

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

enum class RelationshipStage {
    MATCHED,              // 매칭 성사
    CONTACTS_EXCHANGED,   // 연락처 교환 완료
    MET,                  // 실제 만남 완료
    DATING,               // 연애 시작 🎉
}

data class RelationshipRecord(
    val requestId: String,
    val userId: String,
    val stage: RelationshipStage,
    val message: String?,
    val updatedAt: String
)

data class UpdateStageRequest(
    val stage: String,
    val message: String? = null
)

data class RelationshipStatusResponse(
    val requestId: String,
    val stage: RelationshipStage,
    val message: String?,
    val encouragementMessage: String?,   // 주선자의 응원 메시지
    val updatedAt: String,
    val photoFeedback: String? = null    // 사진 유사도 피드백
)

enum class PhotoSimilarity(val label: String) {
    VERY_SIMILAR("사진과 매우 비슷해요"),
    SIMILAR("사진과 비슷해요"),
    DIFFERENT("사진과 조금 달라요"),
    VERY_DIFFERENT("사진과 많이 달라요")
}

data class PhotoFeedbackRequest(val similarity: String)
data class PhotoFeedbackResponse(val requestId: String, val similarity: String, val message: String)

@RestController
@RequestMapping("/api/v1/relationships")
class RelationshipController(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val userRepository: kr.ai.palette.domain.user.UserRepository
) {

    companion object {
        // requestId -> RelationshipRecord
        private val stages = ConcurrentHashMap<String, RelationshipRecord>()
        // requestId -> Map<userId, PhotoSimilarity>
        private val photoFeedbacks = ConcurrentHashMap<String, ConcurrentHashMap<String, String>>()
    }

    /**
     * 관계 단계 조회
     */
    @GetMapping("/{requestId}")
    fun getRelationshipStatus(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: UUID
    ): ResponseEntity<RelationshipStatusResponse> {
        val request = matchmakingRequestRepository.findById(MatchmakingRequestId(requestId))
            ?: return ResponseEntity.notFound().build()

        if (request.status != MatchmakingRequestStatus.COMPLETED) {
            return ResponseEntity.badRequest().build()
        }

        val record = stages[requestId.toString()]
        val encouragement = request.matchmakerDecision?.message

        return ResponseEntity.ok(
            RelationshipStatusResponse(
                requestId = requestId.toString(),
                stage = record?.stage ?: RelationshipStage.MATCHED,
                message = record?.message,
                encouragementMessage = encouragement,
                updatedAt = record?.updatedAt ?: request.updatedAt.toString()
            )
        )
    }

    /**
     * 관계 단계 업데이트
     */
    @PutMapping("/{requestId}/stage")
    fun updateRelationshipStage(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: UUID,
        @RequestBody body: UpdateStageRequest
    ): ResponseEntity<RelationshipStatusResponse> {
        val request = matchmakingRequestRepository.findById(MatchmakingRequestId(requestId))
            ?: return ResponseEntity.notFound().build()

        if (request.status != MatchmakingRequestStatus.COMPLETED) {
            return ResponseEntity.badRequest().build()
        }

        // Only requester or target can update
        if (authUser.userId != request.requesterId && authUser.userId != request.targetUserId) {
            return ResponseEntity.status(403).build()
        }

        val stage = try {
            RelationshipStage.valueOf(body.stage)
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().build()
        }

        val now = java.time.Instant.now().toString()
        val record = RelationshipRecord(
            requestId = requestId.toString(),
            userId = authUser.userId.value.toString(),
            stage = stage,
            message = body.message,
            updatedAt = now
        )
        stages[requestId.toString()] = record

        return ResponseEntity.ok(
            RelationshipStatusResponse(
                requestId = requestId.toString(),
                stage = stage,
                message = body.message,
                encouragementMessage = request.matchmakerDecision?.message,
                updatedAt = now
            )
        )
    }

    /**
     * 내 관계 단계 목록 (COMPLETED 매칭들)
     */
    @GetMapping
    fun getMyRelationships(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<List<RelationshipStatusResponse>> {
        val myId = authUser.userId
        val completedRequests = matchmakingRequestRepository.findAll()
            .filter { (it.requesterId == myId || it.targetUserId == myId) &&
                      it.status == MatchmakingRequestStatus.COMPLETED }

        val result = completedRequests.map { req ->
            val record = stages[req.id.value.toString()]
            val myFeedback = photoFeedbacks[req.id.value.toString()]?.get(myId.value.toString())
            RelationshipStatusResponse(
                requestId = req.id.value.toString(),
                stage = record?.stage ?: RelationshipStage.MATCHED,
                message = record?.message,
                encouragementMessage = req.matchmakerDecision?.message,
                updatedAt = record?.updatedAt ?: req.updatedAt.toString(),
                photoFeedback = myFeedback
            )
        }

        return ResponseEntity.ok(result)
    }

    /**
     * 만남 후 사진 유사도 피드백
     */
    @PostMapping("/{requestId}/photo-feedback")
    fun submitPhotoFeedback(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: UUID,
        @RequestBody body: PhotoFeedbackRequest
    ): ResponseEntity<PhotoFeedbackResponse> {
        val request = matchmakingRequestRepository.findById(MatchmakingRequestId(requestId))
            ?: return ResponseEntity.notFound().build()

        if (request.requesterId != authUser.userId && request.targetUserId != authUser.userId) {
            return ResponseEntity.status(403).build()
        }

        // MET 이상 단계에서만 피드백 가능
        val record = stages[requestId.toString()]
        val stage = record?.stage ?: RelationshipStage.MATCHED
        if (stage == RelationshipStage.MATCHED || stage == RelationshipStage.CONTACTS_EXCHANGED) {
            return ResponseEntity.badRequest().build()
        }

        val similarity = try {
            PhotoSimilarity.valueOf(body.similarity)
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().build()
        }

        val feedbackMap = photoFeedbacks.getOrPut(requestId.toString()) { ConcurrentHashMap() }
        feedbackMap[authUser.userId.value.toString()] = similarity.name

        return ResponseEntity.ok(
            PhotoFeedbackResponse(
                requestId = requestId.toString(),
                similarity = similarity.name,
                message = "피드백이 저장되었습니다. 감사합니다!"
            )
        )
    }
}
