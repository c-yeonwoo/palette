package kr.ai.palette.presentation.matchmaking

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.persistence.relationship.PhotoFeedbackEntity
import kr.ai.palette.persistence.relationship.PhotoFeedbackJpaRepository
import kr.ai.palette.persistence.relationship.RelationshipStageEntity
import kr.ai.palette.persistence.relationship.RelationshipStageJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

enum class RelationshipStage {
    MATCHED,
    CONTACTS_EXCHANGED,
    MET,
    DATING,
}

data class UpdateStageRequest(
    val stage: String,
    val message: String? = null
)

data class RelationshipStatusResponse(
    val requestId: String,
    val stage: RelationshipStage,
    val message: String?,
    val encouragementMessage: String?,
    val updatedAt: String,
    val photoFeedback: String? = null
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
    private val relationshipStageRepository: RelationshipStageJpaRepository,
    private val photoFeedbackRepository: PhotoFeedbackJpaRepository
) {

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

        val record = relationshipStageRepository.findByRequestId(requestId)
        val myFeedback = photoFeedbackRepository
            .findByRequestIdAndUserId(requestId, authUser.userId.value.toString())
            ?.similarity

        return ResponseEntity.ok(
            RelationshipStatusResponse(
                requestId = requestId.toString(),
                stage = record?.stage?.let { RelationshipStage.valueOf(it) } ?: RelationshipStage.MATCHED,
                message = record?.message,
                encouragementMessage = request.matchmakerDecision?.message,
                updatedAt = record?.updatedAt?.toString() ?: request.updatedAt.toString(),
                photoFeedback = myFeedback
            )
        )
    }

    @PutMapping("/{requestId}/stage")
    @Transactional
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

        if (authUser.userId != request.requesterId && authUser.userId != request.targetUserId) {
            return ResponseEntity.status(403).build()
        }

        val stage = try {
            RelationshipStage.valueOf(body.stage)
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().build()
        }

        val now = Instant.now()
        val existing = relationshipStageRepository.findByRequestId(requestId)
        val entity = if (existing != null) {
            RelationshipStageEntity(
                id = existing.id,
                requestId = requestId,
                userId = authUser.userId.value.toString(),
                stage = stage.name,
                message = body.message,
                updatedAt = now
            )
        } else {
            RelationshipStageEntity(
                requestId = requestId,
                userId = authUser.userId.value.toString(),
                stage = stage.name,
                message = body.message,
                updatedAt = now
            )
        }
        relationshipStageRepository.save(entity)

        return ResponseEntity.ok(
            RelationshipStatusResponse(
                requestId = requestId.toString(),
                stage = stage,
                message = body.message,
                encouragementMessage = request.matchmakerDecision?.message,
                updatedAt = now.toString()
            )
        )
    }

    @GetMapping
    fun getMyRelationships(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<List<RelationshipStatusResponse>> {
        val myId = authUser.userId
        val completedRequests = matchmakingRequestRepository.findByRequesterOrTarget(myId)
            .filter { it.status == MatchmakingRequestStatus.COMPLETED }

        val result = completedRequests.map { req ->
            val record = relationshipStageRepository.findByRequestId(req.id.value)
            val myFeedback = photoFeedbackRepository
                .findByRequestIdAndUserId(req.id.value, myId.value.toString())
                ?.similarity
            RelationshipStatusResponse(
                requestId = req.id.value.toString(),
                stage = record?.stage?.let { RelationshipStage.valueOf(it) } ?: RelationshipStage.MATCHED,
                message = record?.message,
                encouragementMessage = req.matchmakerDecision?.message,
                updatedAt = record?.updatedAt?.toString() ?: req.updatedAt.toString(),
                photoFeedback = myFeedback
            )
        }

        return ResponseEntity.ok(result)
    }

    @PostMapping("/{requestId}/photo-feedback")
    @Transactional
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

        val record = relationshipStageRepository.findByRequestId(requestId)
        val stage = record?.stage?.let { RelationshipStage.valueOf(it) } ?: RelationshipStage.MATCHED
        if (stage == RelationshipStage.MATCHED || stage == RelationshipStage.CONTACTS_EXCHANGED) {
            return ResponseEntity.badRequest().build()
        }

        val similarity = try {
            PhotoSimilarity.valueOf(body.similarity)
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().build()
        }

        val userId = authUser.userId.value.toString()
        val existing = photoFeedbackRepository.findByRequestIdAndUserId(requestId, userId)
        val entity = if (existing != null) {
            PhotoFeedbackEntity(
                id = existing.id,
                requestId = requestId,
                userId = userId,
                similarity = similarity.name,
                createdAt = existing.createdAt
            )
        } else {
            PhotoFeedbackEntity(
                requestId = requestId,
                userId = userId,
                similarity = similarity.name
            )
        }
        photoFeedbackRepository.save(entity)

        return ResponseEntity.ok(
            PhotoFeedbackResponse(
                requestId = requestId.toString(),
                similarity = similarity.name,
                message = "피드백이 저장되었습니다. 감사합니다!"
            )
        )
    }
}
