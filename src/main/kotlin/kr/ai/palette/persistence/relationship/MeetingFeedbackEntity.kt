package kr.ai.palette.persistence.relationship

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * 만남 피드백 설문 (ADR 0051) — 만남 완료(MET) 후 당사자가 답하는 "다시 만나고 싶나요?".
 *
 * 목적: 만남 결과로 관계를 이어갈지/종결할지 결정.
 *  · intent = NOT_FOR_ME 가 한쪽이라도 나오면 → 관계 즉시 종결(RelationshipStage.ENDED).
 *  · 둘 다 MEET_AGAIN/UNSURE 면 계속 이어갈 수 있음(연애 중 진행 가능).
 *
 * PostMatchFeedback(주선자 전용 후기)·PhotoFeedback(사진 유사도)와는 별개 — 이건 '관계 지속 판단'.
 * 작성: MET 이상 단계에서 당사자(requester/target) 본인이 1회 (UNIQUE request+user).
 */
@Entity
@Table(
    name = "meeting_feedbacks",
    indexes = [
        Index(name = "idx_meetfb_request", columnList = "request_id"),
        Index(name = "idx_meetfb_request_user", columnList = "request_id, user_id", unique = true),
    ],
)
class MeetingFeedbackEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    /** 어떤 매칭 요청(관계)인가 */
    @Column(name = "request_id", nullable = false, columnDefinition = "BINARY(16)")
    val requestId: UUID,

    /** 답변자 (매칭 당사자 본인) */
    @Column(name = "user_id", nullable = false, length = 36)
    val userId: String,

    /** MEET_AGAIN / UNSURE / NOT_FOR_ME */
    @Column(name = "intent", nullable = false, length = 16)
    val intent: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
