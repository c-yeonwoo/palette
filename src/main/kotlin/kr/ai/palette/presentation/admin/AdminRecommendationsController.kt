package kr.ai.palette.presentation.admin

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.exception.ResourceNotFoundException
import kr.ai.palette.persistence.recommendation.DailyRecommendationEntity
import kr.ai.palette.persistence.recommendation.DailyRecommendationJpaRepository
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.util.UUID

/**
 * 운영자 — AI 시그널 추천 이력 조회 (read-only).
 *
 * PR #7 범위: 조회만.
 * PR #9 에서 운영자 override (PIN/REPLACE/BLOCK) 액션 추가 예정.
 *
 * ADR: docs/DECISIONS/0009-stateful-recommendation.md
 */
@RestController
@RequestMapping("/api/v1/admin/recommendations")
class AdminRecommendationsController(
    private val dailyRecommendationRepo: DailyRecommendationJpaRepository,
    private val userRepository: UserRepository,
) {

    /** 특정 날짜의 전체 추천 — viewer 별로 그룹핑해서 반환 */
    @GetMapping
    fun listByDate(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate,
    ): ResponseEntity<List<ViewerRecommendationsGroup>> {
        val rows = dailyRecommendationRepo
            .findByRecommendedDateOrderByViewerUserIdAscPositionAsc(date)
        val groups = rows.groupBy { it.viewerUserId }.map { (viewerUUID, items) ->
            val viewer = userRepository.findById(UserId(viewerUUID))
            ViewerRecommendationsGroup(
                viewer = viewer?.let { UserBrief.from(it.id.value, it.publicInfo.nickname, it.privateInfo.email) }
                    ?: UserBrief(viewerUUID.toString(), null, "(unknown)"),
                date = date.toString(),
                items = items.map { row ->
                    val target = userRepository.findById(UserId(row.targetUserId))
                    RecommendationItem(
                        position = row.position,
                        target = target?.let { UserBrief.from(it.id.value, it.publicInfo.nickname, it.privateInfo.email) }
                            ?: UserBrief(row.targetUserId.toString(), null, "(unknown)"),
                        source = row.source.name,
                        createdAt = row.createdAt.toString(),
                    )
                }
            )
        }
        return ResponseEntity.ok(groups)
    }

    /** 특정 viewer 의 최근 N일 추천 이력 */
    @GetMapping("/viewer/{userId}")
    fun listByViewer(
        @PathVariable userId: UUID,
        @RequestParam(defaultValue = "30") days: Int,
    ): ResponseEntity<ViewerHistoryResponse> {
        val viewer = userRepository.findById(UserId(userId))
            ?: throw ResourceNotFoundException("사용자를 찾을 수 없습니다")
        val since = LocalDate.now().minusDays(days.coerceIn(1, 365).toLong())
        val rows = dailyRecommendationRepo
            .findByViewerUserIdAndRecommendedDateGreaterThanEqualOrderByRecommendedDateDescPositionAsc(userId, since)

        val items = rows.map { row ->
            val target = userRepository.findById(UserId(row.targetUserId))
            RecommendationHistoryItem(
                date = row.recommendedDate.toString(),
                position = row.position,
                target = target?.let { UserBrief.from(it.id.value, it.publicInfo.nickname, it.privateInfo.email) }
                    ?: UserBrief(row.targetUserId.toString(), null, "(unknown)"),
                source = row.source.name,
                createdAt = row.createdAt.toString(),
            )
        }
        return ResponseEntity.ok(
            ViewerHistoryResponse(
                viewer = UserBrief.from(viewer.id.value, viewer.publicInfo.nickname, viewer.privateInfo.email),
                sinceDate = since.toString(),
                totalCount = items.size,
                items = items,
            )
        )
    }

    /** 어떤 사용자가 누구에게 추천됐는지 (역방향) */
    @GetMapping("/target/{userId}")
    fun listByTarget(
        @PathVariable userId: UUID,
        @RequestParam(defaultValue = "30") days: Int,
    ): ResponseEntity<TargetExposureResponse> {
        val target = userRepository.findById(UserId(userId))
            ?: throw ResourceNotFoundException("사용자를 찾을 수 없습니다")
        val since = LocalDate.now().minusDays(days.coerceIn(1, 365).toLong())
        val rows = dailyRecommendationRepo
            .findByTargetUserIdAndRecommendedDateGreaterThanEqualOrderByRecommendedDateDescPositionAsc(userId, since)

        val items = rows.map { row ->
            val viewer = userRepository.findById(UserId(row.viewerUserId))
            TargetExposureItem(
                date = row.recommendedDate.toString(),
                position = row.position,
                viewer = viewer?.let { UserBrief.from(it.id.value, it.publicInfo.nickname, it.privateInfo.email) }
                    ?: UserBrief(row.viewerUserId.toString(), null, "(unknown)"),
                source = row.source.name,
            )
        }
        return ResponseEntity.ok(
            TargetExposureResponse(
                target = UserBrief.from(target.id.value, target.publicInfo.nickname, target.privateInfo.email),
                sinceDate = since.toString(),
                totalExposures = items.size,
                items = items,
            )
        )
    }
}

// ── DTO ──────────────────────────────────────────────────────────────────────

data class UserBrief(
    val userId: String,
    val email: String?,
    val nickname: String,
) {
    companion object {
        fun from(uuid: UUID, nickname: String, email: String?) = UserBrief(uuid.toString(), email, nickname)
    }
}

data class ViewerRecommendationsGroup(
    val viewer: UserBrief,
    val date: String,
    val items: List<RecommendationItem>,
)

data class RecommendationItem(
    val position: Int,
    val target: UserBrief,
    val source: String,
    val createdAt: String,
)

data class ViewerHistoryResponse(
    val viewer: UserBrief,
    val sinceDate: String,
    val totalCount: Int,
    val items: List<RecommendationHistoryItem>,
)

data class RecommendationHistoryItem(
    val date: String,
    val position: Int,
    val target: UserBrief,
    val source: String,
    val createdAt: String,
)

data class TargetExposureResponse(
    val target: UserBrief,
    val sinceDate: String,
    val totalExposures: Int,
    val items: List<TargetExposureItem>,
)

data class TargetExposureItem(
    val date: String,
    val position: Int,
    val viewer: UserBrief,
    val source: String,
)
