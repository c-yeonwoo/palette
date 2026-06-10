package kr.ai.palette.persistence.ai

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * LLM 호출 audit log — 비용 추적·실패율 분석·rate-limit 위반 모니터링. ADR 0047.
 *
 * 운영 가시화의 SoT — admin 대시보드의 LLM 메트릭은 본 테이블 집계 결과.
 *
 * outcome:
 *  · OK         — 정상 응답 + 파싱 성공
 *  · FAILED     — 외부 5xx / timeout / 파싱 실패 (fallback stub 적용)
 *  · CACHED     — 캐시 hit (LLM 미호출, 비용 0)
 *  · RATE_LIMITED — 백엔드 rate-limit 차단 (호출 X)
 */
@Entity
@Table(
    name = "llm_usage_logs",
    indexes = [
        Index(name = "idx_llm_usage_user", columnList = "user_id"),
        Index(name = "idx_llm_usage_created", columnList = "created_at"),
        Index(name = "idx_llm_usage_outcome", columnList = "outcome"),
    ],
)
class LlmUsageLogEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    @Column(name = "user_id", nullable = false)
    val userId: String,

    /** 호출 종류 (예: profile_generate, palette_pick_score, first_message). 확장성 위해 string. */
    @Column(name = "purpose", nullable = false, length = 32)
    val purpose: String,

    /** gpt-4o-mini, gpt-4o 등 */
    @Column(name = "model", nullable = false, length = 32)
    val model: String,

    @Column(name = "input_tokens", nullable = false)
    val inputTokens: Int = 0,

    @Column(name = "output_tokens", nullable = false)
    val outputTokens: Int = 0,

    /** 예상 비용 (원 단위 정수, KRW). USD→KRW 환산 후 반올림. */
    @Column(name = "cost_won", nullable = false)
    val costWon: Int = 0,

    /** OK / FAILED / CACHED / RATE_LIMITED */
    @Column(name = "outcome", nullable = false, length = 16)
    val outcome: String,

    /** 응답 지연 ms (timeout 포함). 캐시·rate-limit 은 0. */
    @Column(name = "latency_ms", nullable = false)
    val latencyMs: Long = 0,

    /** FAILED 시 에러 코드/메시지 요약 (200자) */
    @Column(name = "error", length = 200)
    val error: String? = null,

    /** 입력 해시 — 캐시 lookup 및 동일 입력 반복 패턴 분석용 */
    @Column(name = "input_hash", length = 64)
    val inputHash: String? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),
)
