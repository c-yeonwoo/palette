package kr.ai.palette.palettepick.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Index
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/**
 * LLM 매칭 궁합 분석 결과 캐시 (ADR 0047 §B.3 Stage 3).
 *
 * (viewerId, candidateId) 쌍 단위 1행. 입력 텍스트(두 사람의 intro/ideal)가 동일하면 inputsHash 도 동일,
 * 캐시 hit → LLM 미호출. 입력이 바뀌면 새 inputsHash 가 들어와 덮어쓴다.
 *
 * 필드:
 *  · summaryJson — OpenAI 가 반환한 JSON 그대로 (parsing 은 application 단에서). 키:
 *      summary / strengths[] / watchOuts[] / firstQuestion
 *  · scoreDeterministic — 결정적 4축 PalettePickScore.total (0..100). 캐시 hit 시 점수 변화 추적용.
 *  · modelVersion — gpt-4o-mini 등 (모델 갱신 시 캐시 무효화).
 *
 * UNIQUE (viewer_user_id, candidate_user_id) — pair 1행 보장. 모델/입력이 바뀌면 update.
 */
@Entity
@Table(
    name = "palettepick_compatibility_analyses",
    indexes = [
        Index(name = "idx_compat_viewer", columnList = "viewer_user_id"),
        Index(name = "idx_compat_pair", columnList = "viewer_user_id, candidate_user_id", unique = true),
        Index(name = "idx_compat_updated", columnList = "updated_at"),
    ],
)
class CompatibilityAnalysisEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "viewer_user_id", nullable = false, columnDefinition = "BINARY(16)")
    val viewerUserId: UUID,

    @Column(name = "candidate_user_id", nullable = false, columnDefinition = "BINARY(16)")
    val candidateUserId: UUID,

    /** 입력 텍스트(두 사람 intro+ideal) SHA-256 — 캐시 무효화 키. */
    @Column(name = "inputs_hash", nullable = false, length = 64)
    var inputsHash: String,

    /** 결정적 4축 점수 — 캐시 시점의 PalettePickScore.total. */
    @Column(name = "score_deterministic", nullable = false)
    var scoreDeterministic: Int = 0,

    /** OpenAI 응답 원본 JSON (summary/strengths[]/watchOuts[]/firstQuestion). */
    @Column(name = "summary_json", nullable = false, columnDefinition = "TEXT")
    var summaryJson: String,

    /** gpt-4o-mini 등 — 모델 변경 시 캐시 갱신용. */
    @Column(name = "model_version", nullable = false, length = 32)
    var modelVersion: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
