package kr.ai.palette.presentation.admin

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.exception.BusinessRuleViolationException
import kr.ai.palette.infrastructure.exception.ResourceNotFoundException
import kr.ai.palette.persistence.recommendation.AdminBlockedTargetEntity
import kr.ai.palette.persistence.recommendation.AdminBlockedTargetJpaRepository
import kr.ai.palette.persistence.recommendation.DailyRecommendationEntity
import kr.ai.palette.persistence.recommendation.DailyRecommendationJpaRepository
import kr.ai.palette.persistence.recommendation.RecommendationSourceEntity
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * 운영자 — AI 시그널 추천 이력 조회 + override (REPLACE/BLOCK).
 *
 * ADR: docs/DECISIONS/0009-stateful-recommendation.md, 0011-ai-matching-override.md
 */
@RestController
@RequestMapping("/api/v1/admin/recommendations")
class AdminRecommendationsController(
    private val dailyRecommendationRepo: DailyRecommendationJpaRepository,
    private val blockedTargetRepo: AdminBlockedTargetJpaRepository,
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
                        id = row.id,
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

    // ── override 액션 (ADR 0011) ──────────────────────────────────────────

    /** 카드 교체 — daily_recommendations 의 target 변경 + source = ADMIN_REPLACE */
    @PatchMapping("/{id}/replace")
    @Transactional
    fun replaceCard(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable id: Long,
        @RequestBody request: ReplaceCardRequest,
    ): ResponseEntity<RecommendationItem> {
        val row = dailyRecommendationRepo.findById(id).orElseThrow {
            ResourceNotFoundException("추천 row 를 찾을 수 없습니다 (id=$id)")
        }

        val newTarget = userRepository.findById(UserId(request.newTargetUserId))
            ?: throw BusinessRuleViolationException("새 target 사용자를 찾을 수 없습니다")

        // 자기 자신 / 같은 target 으로 교체 금지
        if (newTarget.id.value == row.viewerUserId) {
            throw BusinessRuleViolationException("viewer 본인을 추천할 수 없습니다")
        }
        if (newTarget.id.value == row.targetUserId) {
            throw BusinessRuleViolationException("이미 같은 사용자가 추천된 상태입니다")
        }
        if (request.reason.isBlank()) {
            throw BusinessRuleViolationException("교체 사유는 필수입니다")
        }

        row.targetUserId = newTarget.id.value
        row.source = RecommendationSourceEntity.ADMIN_REPLACE
        row.overrideReason = request.reason.trim().take(500)
        row.overriddenBy = authUser.userId.value
        row.overriddenAt = Instant.now()
        val saved = dailyRecommendationRepo.save(row)

        return ResponseEntity.ok(
            RecommendationItem(
                position = saved.position,
                target = UserBrief.from(newTarget.id.value, newTarget.publicInfo.nickname, newTarget.privateInfo.email),
                source = saved.source.name,
                createdAt = saved.createdAt.toString(),
            )
        )
    }

    /** viewer 의 차단 목록 조회 */
    @GetMapping("/blocks/viewer/{viewerId}")
    fun listBlocks(@PathVariable viewerId: UUID): ResponseEntity<List<BlockedTargetItem>> {
        val rows = blockedTargetRepo.findByViewerUserIdOrderByCreatedAtDesc(viewerId)
        val items = rows.map { row ->
            val target = userRepository.findById(UserId(row.targetUserId))
            BlockedTargetItem(
                id = row.id!!,
                target = target?.let { UserBrief.from(it.id.value, it.publicInfo.nickname, it.privateInfo.email) }
                    ?: UserBrief(row.targetUserId.toString(), null, "(unknown)"),
                reason = row.reason,
                createdAt = row.createdAt.toString(),
                expiresAt = row.expiresAt?.toString(),
            )
        }
        return ResponseEntity.ok(items)
    }

    /** viewer x target 차단 추가 */
    @PostMapping("/blocks")
    @Transactional
    fun addBlock(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody request: AddBlockRequest,
    ): ResponseEntity<BlockedTargetItem> {
        if (request.reason.isBlank()) {
            throw BusinessRuleViolationException("차단 사유는 필수입니다")
        }
        if (request.viewerUserId == request.targetUserId) {
            throw BusinessRuleViolationException("자기 자신 차단은 불가합니다")
        }

        val target = userRepository.findById(UserId(request.targetUserId))
            ?: throw BusinessRuleViolationException("target 사용자를 찾을 수 없습니다")

        val entity = AdminBlockedTargetEntity(
            viewerUserId = request.viewerUserId,
            targetUserId = request.targetUserId,
            reason = request.reason.trim().take(500),
            createdBy = authUser.userId.value,
            createdAt = Instant.now(),
            expiresAt = request.expiresAt,
        )
        val saved = blockedTargetRepo.save(entity)

        return ResponseEntity.ok(
            BlockedTargetItem(
                id = saved.id!!,
                target = UserBrief.from(target.id.value, target.publicInfo.nickname, target.privateInfo.email),
                reason = saved.reason,
                createdAt = saved.createdAt.toString(),
                expiresAt = saved.expiresAt?.toString(),
            )
        )
    }

    /** 차단 해제 */
    @DeleteMapping("/blocks/{id}")
    @Transactional
    fun removeBlock(@PathVariable id: Long): ResponseEntity<Unit> {
        if (!blockedTargetRepo.existsById(id)) {
            throw ResourceNotFoundException("차단 row 를 찾을 수 없습니다 (id=$id)")
        }
        blockedTargetRepo.deleteById(id)
        return ResponseEntity.noContent().build()
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
    val id: Long? = null,
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

// ── override (ADR 0011) ──────────────────────────────────────────────────────

data class ReplaceCardRequest(
    val newTargetUserId: UUID,
    val reason: String,
)

data class AddBlockRequest(
    val viewerUserId: UUID,
    val targetUserId: UUID,
    val reason: String,
    val expiresAt: LocalDate? = null,
)

data class BlockedTargetItem(
    val id: Long,
    val target: UserBrief,
    val reason: String,
    val createdAt: String,
    val expiresAt: String?,
)
