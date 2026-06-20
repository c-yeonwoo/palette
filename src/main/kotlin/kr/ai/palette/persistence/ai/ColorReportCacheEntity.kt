package kr.ai.palette.persistence.ai

import jakarta.persistence.*
import java.time.Instant

/**
 * 프리미엄 팔레트 분석 리포트 캐시 (ADR 0070) — 유저당 1행.
 *
 * 유료 리포트는 LLM 비용이 들고 같은 프로필이면 결과도 같아야 하므로, 유저별로 한 번만 생성해 보관한다.
 * [inputHash] 는 리포트 입력(색·답변·이상형·MBTI·사주)의 SHA-256 — 프로필이 바뀌면 hash 가 달라져
 * 자동으로 갱신 생성된다(stale 리포트 방지). [reportJson] 은 ColorReportResult 직렬화 JSON.
 */
@Entity
@Table(name = "color_report_cache")
class ColorReportCacheEntity(
    @Id
    @Column(name = "user_id", nullable = false, length = 64)
    val userId: String,

    /** 리포트 입력 SHA-256 — 프로필 변경 감지용 */
    @Column(name = "input_hash", nullable = false, length = 64)
    var inputHash: String,

    /** ColorReportResult 직렬화 JSON */
    @Column(name = "report_json", nullable = false, columnDefinition = "TEXT")
    var reportJson: String,

    @Column(name = "model", nullable = false, length = 32)
    var model: String,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
