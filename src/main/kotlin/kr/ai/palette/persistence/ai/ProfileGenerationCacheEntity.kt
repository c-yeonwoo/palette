package kr.ai.palette.persistence.ai

import jakarta.persistence.*
import java.time.Instant

/**
 * 프로필 생성 LLM 결과 캐시 — 동일 입력은 동일 결과 보장 + LLM 비용 0. ADR 0047.
 *
 * 키: 입력 답변 + 이상형 정보 SHA-256 hash (32 chars hex 사용).
 * TTL: 30일 — 사용자가 답변 변경 후 재분석하면 새 hash 라 새 호출,
 *      변경 없이 반복 시도 시 캐시 hit.
 *
 * 응답 JSON 을 그대로 보관 (parseResult 가 그대로 파싱 가능한 형태).
 */
@Entity
@Table(name = "profile_generation_cache")
class ProfileGenerationCacheEntity(
    @Id
    @Column(name = "input_hash", nullable = false, length = 64)
    val inputHash: String,

    /** OpenAI 응답 content (JSON 문자열) */
    @Column(name = "response_json", nullable = false, columnDefinition = "TEXT")
    val responseJson: String,

    @Column(name = "model", nullable = false, length = 32)
    val model: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    /** 캐시 hit 카운트 — 절감 효과 측정용 */
    @Column(name = "hit_count", nullable = false)
    var hitCount: Int = 0,
)
