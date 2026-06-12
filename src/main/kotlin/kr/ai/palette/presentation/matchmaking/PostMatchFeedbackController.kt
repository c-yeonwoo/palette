package kr.ai.palette.presentation.matchmaking

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.exception.BusinessRuleViolationException
import kr.ai.palette.infrastructure.exception.ResourceNotFoundException
import kr.ai.palette.persistence.relationship.PostMatchFeedbackEntity
import kr.ai.palette.persistence.relationship.PostMatchFeedbackJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

/**
 * 만남 후 사적 피드백 (ADR 0050).
 *
 *  · POST /api/v1/relationships/{requestId}/feedback — 당사자가 주선자에게 후기 작성 (1회)
 *  · GET  /api/v1/relationships/{requestId}/feedback/mine — 내가 쓴 후기 조회
 *  · GET  /api/v1/matchmaker/feedback — 주선자: 내가 주선한 매칭들의 후기 모음
 *
 * 프라이버시: 상대방은 절대 조회 불가. 주선자 + (별도 컨트롤러) 운영자만.
 */
@RestController
class PostMatchFeedbackController(
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val feedbackRepository: PostMatchFeedbackJpaRepository,
    private val userRepository: UserRepository,
) {

    private val validMet = setOf("MET", "NOT_MET", "SCHEDULED")
    private val validSentiment = setOf("GOOD", "NEUTRAL", "DISAPPOINTING")

    /** 당사자가 후기 작성 — 매칭 COMPLETED 후, 본인이 1회. */
    @PostMapping("/api/v1/relationships/{requestId}/feedback")
    @Transactional
    fun submit(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: UUID,
        @RequestBody body: SubmitFeedbackRequest,
    ): ResponseEntity<PostMatchFeedbackResponse> {
        val request = matchmakingRequestRepository.findById(MatchmakingRequestId(requestId))
            ?: throw ResourceNotFoundException("매칭 요청을 찾을 수 없습니다")

        val me = authUser.userId
        // 당사자만 (requester 또는 target)
        val isParticipant = me == request.requesterId || me == request.targetUserId
        if (!isParticipant) {
            throw BusinessRuleViolationException("이 매칭의 당사자만 후기를 남길 수 있습니다")
        }
        // 성사된 매칭만
        if (request.status != MatchmakingRequestStatus.COMPLETED) {
            throw BusinessRuleViolationException("매칭이 성사된 후에만 후기를 남길 수 있습니다")
        }
        // 입력 검증
        val met = body.metStatus.uppercase()
        val sentiment = body.sentiment.uppercase()
        if (met !in validMet) throw BusinessRuleViolationException("만남 여부 값이 올바르지 않습니다")
        if (sentiment !in validSentiment) throw BusinessRuleViolationException("후기 값이 올바르지 않습니다")
        // 멱등 — 1회만
        feedbackRepository.findByRequestIdAndAuthorUserId(requestId, me.value)?.let {
            throw BusinessRuleViolationException("이미 후기를 남기셨습니다")
        }

        val counterpart = if (me == request.requesterId) request.targetUserId else request.requesterId
        val saved = feedbackRepository.save(
            PostMatchFeedbackEntity(
                requestId = requestId,
                matchmakerUserId = request.matchmakerId.value,
                authorUserId = me.value,
                counterpartUserId = counterpart.value,
                metStatus = met,
                sentiment = sentiment,
                message = body.message?.trim()?.takeIf { it.isNotEmpty() },
                wantToMeetAgain = body.wantToMeetAgain,
            )
        )
        return ResponseEntity.ok(PostMatchFeedbackResponse.from(saved))
    }

    /** 내가 쓴 후기 (작성 여부 확인용) */
    @GetMapping("/api/v1/relationships/{requestId}/feedback/mine")
    fun mine(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable requestId: UUID,
    ): ResponseEntity<PostMatchFeedbackResponse> {
        val found = feedbackRepository.findByRequestIdAndAuthorUserId(requestId, authUser.userId.value)
            ?: return ResponseEntity.noContent().build()  // 204 = 아직 미작성
        return ResponseEntity.ok(PostMatchFeedbackResponse.from(found))
    }

    /** 주선자: 내가 주선한 매칭들의 후기 모음 (상대방 이름 비노출 — 작성자만 표기). */
    @GetMapping("/api/v1/matchmaker/feedback")
    fun matchmakerFeedback(
        @AuthenticationPrincipal authUser: AuthUser,
    ): ResponseEntity<List<MatchmakerFeedbackItem>> {
        val items = feedbackRepository.findByMatchmakerUserIdOrderByCreatedAtDesc(authUser.userId.value)
            .map { fb ->
                val author = userRepository.findById(UserId(fb.authorUserId))
                val counterpart = userRepository.findById(UserId(fb.counterpartUserId))
                MatchmakerFeedbackItem(
                    requestId = fb.requestId.toString(),
                    authorNickname = author?.publicInfo?.nickname ?: "회원",
                    counterpartNickname = counterpart?.publicInfo?.nickname ?: "회원",
                    metStatus = fb.metStatus,
                    sentiment = fb.sentiment,
                    message = fb.message,
                    wantToMeetAgain = fb.wantToMeetAgain,
                    createdAt = fb.createdAt.toString(),
                )
            }
        return ResponseEntity.ok(items)
    }
}

data class SubmitFeedbackRequest(
    val metStatus: String,       // MET / NOT_MET / SCHEDULED
    val sentiment: String,       // GOOD / NEUTRAL / DISAPPOINTING
    val message: String? = null,
    val wantToMeetAgain: Boolean = false,
)

data class PostMatchFeedbackResponse(
    val id: String,
    val requestId: String,
    val metStatus: String,
    val sentiment: String,
    val message: String?,
    val wantToMeetAgain: Boolean,
    val createdAt: String,
) {
    companion object {
        fun from(e: PostMatchFeedbackEntity) = PostMatchFeedbackResponse(
            id = e.id.toString(),
            requestId = e.requestId.toString(),
            metStatus = e.metStatus,
            sentiment = e.sentiment,
            message = e.message,
            wantToMeetAgain = e.wantToMeetAgain,
            createdAt = e.createdAt.toString(),
        )
    }
}

/** 주선자 대시보드용 — 누가(작성자) 누구(상대)에 대해 남겼는지 + 내용. */
data class MatchmakerFeedbackItem(
    val requestId: String,
    val authorNickname: String,
    val counterpartNickname: String,
    val metStatus: String,
    val sentiment: String,
    val message: String?,
    val wantToMeetAgain: Boolean,
    val createdAt: String,
)
