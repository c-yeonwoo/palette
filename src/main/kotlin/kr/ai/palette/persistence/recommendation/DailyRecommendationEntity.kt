package kr.ai.palette.persistence.recommendation

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * 일자별 AI 시그널 추천 결과 영속화.
 *
 * - 매일 AiSignalController 가 처음 호출될 때 자동 저장 (write-through)
 * - 추후 같은 viewer + date 호출 시 저장된 결과 그대로 반환 (결정성)
 * - 같은 viewer 의 60일 이내 추천 이력은 후보 필터에서 자동 제외
 * - 운영자 페이지에서 조회 가능 (`/api/v1/admin/recommendations`)
 *
 * ADR: docs/DECISIONS/0009-stateful-recommendation.md
 */
@Entity
@Table(
    name = "daily_recommendations",
    indexes = [
        Index(name = "idx_drec_viewer_date", columnList = "viewer_user_id, recommended_date"),
        Index(name = "idx_drec_viewer_target", columnList = "viewer_user_id, target_user_id"),
        Index(name = "idx_drec_date", columnList = "recommended_date"),
    ],
    uniqueConstraints = [
        UniqueConstraint(name = "uk_drec_viewer_date_position",
            columnNames = ["viewer_user_id", "recommended_date", "position"]),
    ],
)
class DailyRecommendationEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null,

    @Column(name = "viewer_user_id", columnDefinition = "BINARY(16)", nullable = false)
    var viewerUserId: UUID,

    @Column(name = "target_user_id", columnDefinition = "BINARY(16)", nullable = false)
    var targetUserId: UUID,

    @Column(name = "recommended_date", nullable = false)
    var recommendedDate: LocalDate,

    /** 1 = 첫 번째 (무료), 2 = 두 번째 (paid unlock) */
    @Column(name = "position", nullable = false)
    var position: Int,

    @Column(name = "source", nullable = false, length = 16)
    @Enumerated(EnumType.STRING)
    var source: RecommendationSourceEntity = RecommendationSourceEntity.AUTO,

    /**
     * 후보 티어 출처 (CS-010, ADR 0072) — 지인망(ACQUAINTANCE) vs 공개 발견 풀(PUBLIC).
     * `source`(AUTO/ADMIN_*)와 다른 축: 이건 "어느 풀에서 왔나", source 는 "누가 결정했나".
     * nullable — 컬럼 도입 이전 row 는 null(UNTAGGED 로 집계).
     */
    @Column(name = "candidate_source", length = 16)
    @Enumerated(EnumType.STRING)
    var candidateSource: CandidateSourceEntity? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    /** 운영자 override 시 기록 (REPLACE/PIN). source != AUTO 일 때 채워짐. */
    @Column(name = "override_reason", length = 500)
    var overrideReason: String? = null,

    @Column(name = "overridden_by", columnDefinition = "BINARY(16)")
    var overriddenBy: UUID? = null,

    @Column(name = "overridden_at")
    var overriddenAt: Instant? = null,

    /**
     * 추천 알고리즘 variant 식별 (ADR 0047 §B.4 관측).
     * 예: ORCHESTRATOR_V1 (B.2 PalettePickRecommendationService), LEGACY_RANDOM (회귀 비교용).
     * source=AUTO 일 때만 의미. ADMIN_PIN/REPLACE 면 운영자 결정이므로 추적 대상 아님.
     */
    @Column(name = "variant", length = 32)
    var variant: String? = null,
) {
    protected constructor() : this(
        viewerUserId = UUID.randomUUID(),
        targetUserId = UUID.randomUUID(),
        recommendedDate = LocalDate.now(),
        position = 1,
    )
}

enum class RecommendationSourceEntity {
    /** 자동 계산 (date+UID seed 랜덤) */
    AUTO,

    /** 운영자가 강제 추가 (PR #9) */
    ADMIN_PIN,

    /** 운영자가 자동 결과를 교체 (PR #9) */
    ADMIN_REPLACE,
}

/** 후보 티어 출처 (CS-010, ADR 0072) — 도메인 CandidateSource 의 영속 미러. */
enum class CandidateSourceEntity {
    /** 지인 네트워크(2·3촌) */
    ACQUAINTANCE,

    /** 콜드스타트 공개 발견 풀(수도권 거리순) */
    PUBLIC,
}
