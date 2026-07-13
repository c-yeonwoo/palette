package kr.ai.palette.palettepick.persistence

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

/**
 * 팔레트픽 야간 배치 실행 기록 — 운영 관측의 SoT (ADR 0047 §B.3).
 *
 * 배치는 매일 00:30 KST 스케줄로 돌지만 결과가 로그로만 남아 어드민에서 볼 수 없었다.
 * 각 실행의 진척·집계·에러를 본 테이블에 영속화 → AdminPalettePickBatchScreen 에서 조회.
 *
 * status:
 *  · RUNNING   — 실행 중 (시작 시 기록, 종료 시 갱신)
 *  · SUCCESS   — 정상 완료
 *  · PARTIAL   — 완료됐으나 일부 viewer 실패 (failures > 0)
 *  · FAILED    — 배치 자체가 예외로 중단
 *  · SKIPPED   — 비활성(enabled=false) 로 skip
 *
 * trigger:
 *  · SCHEDULED — cron 자동
 *  · MANUAL    — 어드민 "지금 실행" 버튼
 */
@Entity
@Table(
    name = "palette_pick_batch_runs",
    indexes = [
        Index(name = "idx_ppbatch_started", columnList = "started_at"),
        Index(name = "idx_ppbatch_run_date", columnList = "run_date"),
    ],
)
class PalettePickBatchRunEntity(
    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    val id: UUID = UUID.randomUUID(),

    /** 대상 일자 (KST). 하루 여러 번(수동) 돌 수 있어 PK 아님. */
    @Column(name = "run_date", nullable = false, length = 10)
    val runDate: String,

    /** SCHEDULED / MANUAL (컬럼명은 MySQL 예약어 trigger 회피). */
    @Column(name = "trigger_type", nullable = false, length = 16)
    val trigger: String,

    /** RUNNING / SUCCESS / PARTIAL / FAILED / SKIPPED */
    @Column(name = "status", nullable = false, length = 16)
    var status: String,

    @Column(name = "started_at", nullable = false)
    val startedAt: Instant = Instant.now(),

    @Column(name = "finished_at")
    var finishedAt: Instant? = null,

    /** 활성 사용자 수 (배치 대상 후보). */
    @Column(name = "active_users", nullable = false)
    var activeUsers: Int = 0,

    /** 실제 처리한 viewer 수. */
    @Column(name = "viewers_processed", nullable = false)
    var viewersProcessed: Int = 0,

    /** LLM 호출 시도 수 (cache hit 포함). */
    @Column(name = "llm_calls", nullable = false)
    var llmCalls: Int = 0,

    /** 실패한 viewer 수. */
    @Column(name = "failures", nullable = false)
    var failures: Int = 0,

    /** 호출 상한 도달로 조기 종료했는지. */
    @Column(name = "hit_call_cap", nullable = false)
    var hitCallCap: Boolean = false,

    /** 실패 메시지 상위 N개 요약 (줄바꿈 구분, 500자). */
    @Column(name = "error_sample", length = 500)
    var errorSample: String? = null,
) {
    /** 소요 시간 ms (미완료 시 null). */
    val durationMs: Long?
        get() = finishedAt?.let { it.toEpochMilli() - startedAt.toEpochMilli() }
}
