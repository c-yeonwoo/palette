package kr.ai.palette.persistence.relationship

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * 만남 후 사적 피드백 (ADR 0050) — 매칭 당사자가 주선자에게만 전하는 후기.
 *
 * 프라이버시 핵심: **상대방에게 절대 노출 X**. 주선자(1촌) + 운영자만 조회.
 *  · 공개 매너 평가의 독(보복·평가공포)을 회피
 *  · 주선자가 자기 매칭의 결과를 학습 → 다음 추천 품질↑ + 매너 나쁜 지인 자연 배제
 *  · 운영자는 반복 'DISAPPOINTING' 수신·노쇼(NOT_MET) 누적 패턴 모니터링
 *
 * 작성 조건: 매칭 COMPLETED 후, 당사자(requester/target) 본인이 1회 (UNIQUE request+author).
 */
@Entity
@Table(
    name = "post_match_feedbacks",
    indexes = [
        Index(name = "idx_pmf_matchmaker", columnList = "matchmaker_user_id, created_at"),
        Index(name = "idx_pmf_counterpart", columnList = "counterpart_user_id"),
        Index(name = "idx_pmf_request_author", columnList = "request_id, author_user_id", unique = true),
    ],
)
class PostMatchFeedbackEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    /** 어떤 매칭 요청에 대한 후기인가 (MatchmakingRequest.id) */
    @Column(name = "request_id", nullable = false, columnDefinition = "BINARY(16)")
    val requestId: UUID,

    /** 이 매칭의 주선자 (조회 최적화 위해 비정규화) */
    @Column(name = "matchmaker_user_id", nullable = false, columnDefinition = "BINARY(16)")
    val matchmakerUserId: UUID,

    /** 후기 작성자 (매칭 당사자 A 또는 B) */
    @Column(name = "author_user_id", nullable = false, columnDefinition = "BINARY(16)")
    val authorUserId: UUID,

    /** 후기 대상 = 매칭 상대 (이 사람에겐 절대 노출 X — 운영자 패턴 분석용) */
    @Column(name = "counterpart_user_id", nullable = false, columnDefinition = "BINARY(16)")
    val counterpartUserId: UUID,

    /** MET / NOT_MET / SCHEDULED */
    @Column(name = "met_status", nullable = false, length = 16)
    val metStatus: String,

    /** GOOD / NEUTRAL / DISAPPOINTING — 부드러운 3택 */
    @Column(name = "sentiment", nullable = false, length = 16)
    val sentiment: String,

    /** 주선자께 한마디 (비공개 자유 텍스트) */
    @Column(name = "message", columnDefinition = "TEXT")
    val message: String? = null,

    /** 다시 만나고 싶은지 */
    @Column(name = "want_to_meet_again", nullable = false)
    val wantToMeetAgain: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
