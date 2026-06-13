package kr.ai.palette.persistence.interview

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * AI 인터뷰 질문 (ADR 0055) — 어드민에서 선별·추가·수정 가능.
 * 기존 하드코딩(AIInterviewController.INTERVIEW_QUESTIONS)을 DB로 이관.
 * 최초 부팅 시 InterviewQuestionSeeder 가 기본 9개를 시드(테이블이 비어있을 때만).
 *
 * chips: chips 타입 질문의 선택지. 줄바꿈(\n)으로 join 저장 (라벨에 \n 없음).
 */
@Entity
@Table(
    name = "interview_questions",
    indexes = [Index(name = "idx_iq_order", columnList = "display_order")],
)
class InterviewQuestionEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    /** 안정 식별자 (예: "job"). 프론트 answers 맵 key 로 사용 — 변경 비권장 */
    @Column(name = "question_key", nullable = false, unique = true, length = 50)
    var questionKey: String,

    @Column(name = "display_order", nullable = false)
    var displayOrder: Int,

    @Column(name = "category", nullable = false, length = 50)
    var category: String,

    @Column(name = "question", nullable = false, length = 500)
    var question: String,

    @Column(name = "hint", length = 500)
    var hint: String? = null,

    /** chips | text */
    @Column(name = "input_type", nullable = false, length = 20)
    var inputType: String,

    /** chips 선택지 — 줄바꿈 join. text 타입이면 null */
    @Column(name = "chips", columnDefinition = "TEXT")
    var chips: String? = null,

    @Column(name = "active", nullable = false)
    var active: Boolean = true,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
