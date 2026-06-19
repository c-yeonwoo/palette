package kr.ai.palette.presentation.matchmaking

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.persistence.relationship.MeetingFeedbackEntity
import kr.ai.palette.persistence.relationship.MeetingFeedbackJpaRepository
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
    ENDED,  // 만남 피드백 결과 종결 (ADR 0051) — 선형 진행에서 제외된 종료 상태
}

/** 선형 진행 순서 (ENDED 는 별도 종료 상태이므로 제외) */
private val LINEAR_STAGES = listOf(
    RelationshipStage.MATCHED,
    RelationshipStage.CONTACTS_EXCHANGED,
    RelationshipStage.MET,
    RelationshipStage.DATING,
)

/** 만남 피드백 의향 — '다시 만나고 싶나요?' (ADR 0051) */
enum class MeetingIntent { MEET_AGAIN, UNSURE, NOT_FOR_ME }

data class UpdateStageRequest(
    val stage: String,
    val message: String? = null
)

data class MeetingFeedbackRequest(val intent: String)

data class RelationshipStatusResponse(
    val requestId: String,
    val stage: RelationshipStage,
    val message: String?,
    val encouragementMessage: String?,
    val updatedAt: String,
    val photoFeedback: String? = null,
    /** 내가 제출한 만남 피드백 의향 (MEET_AGAIN/UNSURE/NOT_FOR_ME). 미제출 시 null */
    val myMeetingFeedback: String? = null,
    /** stage 업데이트 시 이미 그 단계(이상)거나 종료돼 변경이 적용되지 않았으면 true */
    val conflict: Boolean = false,
    /**
     * 매칭 성사 후 교환되는 상대 연락처 (ADR 0065).
     * 성사(COMPLETED) 된 관계의 양 당사자에게만 노출 — 정직한 핸드오프의 핵심.
     * 카카오톡 ID 는 선택, 전화번호는 필수(가입 시 인증).
     */
    val partnerName: String? = null,
    val partnerPhone: String? = null,
    val partnerKakaoId: String? = null,
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
    private val photoFeedbackRepository: PhotoFeedbackJpaRepository,
    private val meetingFeedbackRepository: MeetingFeedbackJpaRepository,
    private val userRepository: UserRepository,
) {

    private data class PartnerContact(val name: String?, val phone: String?, val kakaoId: String?)

    /**
     * 매칭 상대(요청자↔수신자 중 내가 아닌 쪽)의 연락처를 조회한다 (ADR 0065).
     * COMPLETED 관계의 당사자 본인이 호출한 경로에서만 사용 — 호출부가 당사자 검증을 끝낸 뒤 호출한다.
     */
    private fun resolvePartnerContact(request: MatchmakingRequest, myId: UserId): PartnerContact {
        val partnerId = if (request.requesterId == myId) request.targetUserId else request.requesterId
        val partner = userRepository.findById(partnerId)
            ?: return PartnerContact(null, null, null)
        val name = partner.publicInfo.nickname.takeIf { it.isNotBlank() } ?: partner.privateInfo.realName
        return PartnerContact(
            name = name,
            phone = partner.privateInfo.getEffectivePhoneNumber(),
            kakaoId = partner.privateInfo.getKakaoTalkId(),
        )
    }

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

        // 당사자(요청자/수신자)만 조회 가능 — 연락처가 응답에 포함되므로 필수 가드 (ADR 0065).
        if (authUser.userId != request.requesterId && authUser.userId != request.targetUserId) {
            return ResponseEntity.status(403).build()
        }

        val record = relationshipStageRepository.findByRequestId(requestId)
        val myFeedback = photoFeedbackRepository
            .findByRequestIdAndUserId(requestId, authUser.userId.value.toString())
            ?.similarity
        val myMeeting = meetingFeedbackRepository
            .findByRequestIdAndUserId(requestId, authUser.userId.value.toString())
            ?.intent
        val partner = resolvePartnerContact(request, authUser.userId)

        return ResponseEntity.ok(
            RelationshipStatusResponse(
                requestId = requestId.toString(),
                stage = record?.stage?.let { RelationshipStage.valueOf(it) } ?: RelationshipStage.MATCHED,
                message = record?.message,
                encouragementMessage = request.matchmakerDecision?.message,
                updatedAt = record?.updatedAt?.toString() ?: request.updatedAt.toString(),
                photoFeedback = myFeedback,
                myMeetingFeedback = myMeeting,
                partnerName = partner.name,
                partnerPhone = partner.phone,
                partnerKakaoId = partner.kakaoId,
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
        val currentStage = existing?.stage?.let { RelationshipStage.valueOf(it) } ?: RelationshipStage.MATCHED

        // 단계 싱크 정합성: stage 는 관계당 1행(양쪽 공유). 상대가 이미 같은/더 앞 단계로
        // 바꿨거나 이미 종료(ENDED)된 경우 덮어쓰지 않고 conflict=true 로 현재 상태를 돌려준다.
        // ENDED 로의 전환은 만남 피드백(meeting-feedback)에서만 발생 — stage 업데이트로는 불가.
        val curIdx = LINEAR_STAGES.indexOf(currentStage)   // ENDED -> -1
        val reqIdx = LINEAR_STAGES.indexOf(stage)          // ENDED 요청 -> -1
        val isConflict = currentStage == RelationshipStage.ENDED || reqIdx < 0 || reqIdx <= curIdx
        if (isConflict) {
            val myMeeting = meetingFeedbackRepository
                .findByRequestIdAndUserId(requestId, authUser.userId.value.toString())?.intent
            return ResponseEntity.ok(
                RelationshipStatusResponse(
                    requestId = requestId.toString(),
                    stage = currentStage,
                    message = existing?.message,
                    encouragementMessage = request.matchmakerDecision?.message,
                    updatedAt = existing?.updatedAt?.toString() ?: now.toString(),
                    myMeetingFeedback = myMeeting,
                    conflict = true,
                )
            )
        }

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

    /**
     * 만남 피드백 설문 (ADR 0051) — MET 이상에서 '다시 만나고 싶나요?' 답변.
     * 한쪽이라도 NOT_FOR_ME 면 관계 즉시 종결(stage=ENDED). 둘 다 긍정/중립이면 유지.
     */
    @PostMapping("/{requestId}/meeting-feedback")
    @Transactional
    fun submitMeetingFeedback(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: UUID,
        @RequestBody body: MeetingFeedbackRequest
    ): ResponseEntity<RelationshipStatusResponse> {
        val request = matchmakingRequestRepository.findById(MatchmakingRequestId(requestId))
            ?: return ResponseEntity.notFound().build()
        if (request.status != MatchmakingRequestStatus.COMPLETED) {
            return ResponseEntity.badRequest().build()
        }
        if (authUser.userId != request.requesterId && authUser.userId != request.targetUserId) {
            return ResponseEntity.status(403).build()
        }

        val intent = try {
            MeetingIntent.valueOf(body.intent)
        } catch (e: IllegalArgumentException) {
            return ResponseEntity.badRequest().build()
        }

        val stageRecord = relationshipStageRepository.findByRequestId(requestId)
        val currentStage = stageRecord?.stage?.let { RelationshipStage.valueOf(it) } ?: RelationshipStage.MATCHED
        // MET(만남 완료) 이상에서만 설문. 아직 안 만났으면 거절.
        if (currentStage == RelationshipStage.MATCHED || currentStage == RelationshipStage.CONTACTS_EXCHANGED) {
            return ResponseEntity.badRequest().build()
        }

        val userId = authUser.userId.value.toString()
        val now = Instant.now()
        val existing = meetingFeedbackRepository.findByRequestIdAndUserId(requestId, userId)
        meetingFeedbackRepository.save(
            if (existing != null) {
                MeetingFeedbackEntity(id = existing.id, requestId = requestId, userId = userId, intent = intent.name, createdAt = existing.createdAt)
            } else {
                MeetingFeedbackEntity(requestId = requestId, userId = userId, intent = intent.name)
            }
        )

        // 종결 판단: 내 답변 또는 상대 답변 중 하나라도 NOT_FOR_ME → ENDED
        val all = meetingFeedbackRepository.findByRequestId(requestId)
        val ended = all.any { it.intent == MeetingIntent.NOT_FOR_ME.name }
        var resultStage = currentStage
        if (ended && currentStage != RelationshipStage.ENDED) {
            resultStage = RelationshipStage.ENDED
            relationshipStageRepository.save(
                if (stageRecord != null) {
                    RelationshipStageEntity(id = stageRecord.id, requestId = requestId, userId = userId, stage = RelationshipStage.ENDED.name, message = stageRecord.message, updatedAt = now)
                } else {
                    RelationshipStageEntity(requestId = requestId, userId = userId, stage = RelationshipStage.ENDED.name, updatedAt = now)
                }
            )
        }

        return ResponseEntity.ok(
            RelationshipStatusResponse(
                requestId = requestId.toString(),
                stage = resultStage,
                message = stageRecord?.message,
                encouragementMessage = request.matchmakerDecision?.message,
                updatedAt = now.toString(),
                myMeetingFeedback = intent.name,
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
            val myMeeting = meetingFeedbackRepository
                .findByRequestIdAndUserId(req.id.value, myId.value.toString())
                ?.intent
            val partner = resolvePartnerContact(req, myId)
            RelationshipStatusResponse(
                requestId = req.id.value.toString(),
                stage = record?.stage?.let { RelationshipStage.valueOf(it) } ?: RelationshipStage.MATCHED,
                message = record?.message,
                encouragementMessage = req.matchmakerDecision?.message,
                updatedAt = record?.updatedAt?.toString() ?: req.updatedAt.toString(),
                photoFeedback = myFeedback,
                myMeetingFeedback = myMeeting,
                partnerName = partner.name,
                partnerPhone = partner.phone,
                partnerKakaoId = partner.kakaoId,
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
