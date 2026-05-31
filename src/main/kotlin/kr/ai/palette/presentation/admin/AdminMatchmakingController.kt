package kr.ai.palette.presentation.admin

import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequest
import kr.ai.palette.domain.matchmaking.MatchmakingRequestId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.matchmaking.MatchmakingRequestStatus
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.exception.BusinessRuleViolationException
import kr.ai.palette.infrastructure.exception.ResourceNotFoundException
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * 운영자 — 매칭 요청 (주선자 풀) 조회 + 강제 변경 + 운영자 메모.
 *
 * 베타 단계 매칭 요청 수 적음 → findAll() + 메모리 페이징/필터. 1000+ 시 JPA Specification 전환.
 *
 * ADR: docs/DECISIONS/0012-admin-matching-pool.md
 */
@RestController
@RequestMapping("/api/v1/admin/matchmaking")
class AdminMatchmakingController(
    private val matchmakingRepo: MatchmakingRequestRepository,
    private val userRepository: UserRepository,
) {

    /** 매칭 요청 목록 — 페이징 + 검색(닉네임/이메일) + status 필터 + 정렬 */
    @GetMapping("/requests")
    fun list(
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) q: String?,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "updatedAt:desc") sort: String,
    ): ResponseEntity<AdminMatchmakingPageResponse> {
        val statusFilter = status?.takeIf { it != "ALL" }
            ?.let { runCatching { MatchmakingRequestStatus.valueOf(it) }.getOrNull() }

        val all = matchmakingRepo.findAll()
        val filtered = all.filter { r ->
            if (statusFilter != null && r.status != statusFilter) return@filter false
            if (q.isNullOrBlank()) return@filter true
            val needle = q.trim().lowercase()
            // 3 명의 닉네임/이메일 중 어디라도 매치
            val ids = listOf(r.requesterId, r.matchmakerId, r.targetUserId)
            ids.any { id ->
                val u = userRepository.findById(id) ?: return@any false
                u.publicInfo.nickname.lowercase().contains(needle) ||
                    (u.privateInfo.email?.lowercase()?.contains(needle) == true) ||
                    u.privateInfo.realName.lowercase().contains(needle)
            }
        }

        val sorted = sortRequests(filtered, sort)
        val pageSize = size.coerceIn(1, 100)
        val pageIndex = page.coerceAtLeast(0)
        val start = pageIndex * pageSize
        val items = if (start >= sorted.size) emptyList() else sorted.drop(start).take(pageSize)

        return ResponseEntity.ok(
            AdminMatchmakingPageResponse(
                items = items.map { AdminMatchmakingSummary.from(it, userRepository) },
                page = pageIndex,
                size = pageSize,
                totalCount = sorted.size,
                totalPages = if (sorted.isEmpty()) 0 else (sorted.size + pageSize - 1) / pageSize,
            )
        )
    }

    /** 단일 요청 상세 (3명 + decision + admin 메모) */
    @GetMapping("/requests/{id}")
    fun detail(@PathVariable id: UUID): ResponseEntity<AdminMatchmakingDetail> {
        val req = matchmakingRepo.findById(MatchmakingRequestId(id))
            ?: throw ResourceNotFoundException("매칭 요청을 찾을 수 없습니다 (id=$id)")
        return ResponseEntity.ok(AdminMatchmakingDetail.from(req, userRepository))
    }

    /** 강제 status 변경 + 운영자 메모 */
    @PatchMapping("/requests/{id}/status")
    @Transactional
    fun changeStatus(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable id: UUID,
        @RequestBody request: AdminChangeMatchmakingStatusRequest,
    ): ResponseEntity<AdminMatchmakingDetail> {
        val req = matchmakingRepo.findById(MatchmakingRequestId(id))
            ?: throw ResourceNotFoundException("매칭 요청을 찾을 수 없습니다 (id=$id)")

        val newStatus = runCatching { MatchmakingRequestStatus.valueOf(request.status) }.getOrElse {
            throw BusinessRuleViolationException("지원하지 않는 status: ${request.status}")
        }
        if (request.note.isBlank()) {
            throw BusinessRuleViolationException("운영자 변경 사유(note)는 필수입니다")
        }

        val updated = req.adminOverride(newStatus, request.note, authUser.userId)
        val saved = matchmakingRepo.save(updated)
        return ResponseEntity.ok(AdminMatchmakingDetail.from(saved, userRepository))
    }

    /** 운영자 메모만 갱신 (status 그대로) */
    @PatchMapping("/requests/{id}/note")
    @Transactional
    fun updateNote(
        @AuthenticationPrincipal authUser: AuthUser,
        @PathVariable id: UUID,
        @RequestBody request: AdminUpdateNoteRequest,
    ): ResponseEntity<AdminMatchmakingDetail> {
        val req = matchmakingRepo.findById(MatchmakingRequestId(id))
            ?: throw ResourceNotFoundException("매칭 요청을 찾을 수 없습니다 (id=$id)")
        if (request.note.isBlank()) {
            throw BusinessRuleViolationException("메모는 비워둘 수 없습니다")
        }
        val updated = req.adminAttachNote(request.note, authUser.userId)
        val saved = matchmakingRepo.save(updated)
        return ResponseEntity.ok(AdminMatchmakingDetail.from(saved, userRepository))
    }

    private fun sortRequests(reqs: List<MatchmakingRequest>, sort: String): List<MatchmakingRequest> {
        val (key, dir) = sort.split(":").let { it[0] to (it.getOrNull(1) ?: "desc") }
        val cmp: Comparator<MatchmakingRequest> = when (key) {
            "createdAt" -> compareBy { it.createdAt }
            "status" -> compareBy { it.status.name }
            else -> compareBy { it.updatedAt }
        }
        return if (dir == "asc") reqs.sortedWith(cmp) else reqs.sortedWith(cmp.reversed())
    }
}

// ── DTO ──────────────────────────────────────────────────────────────────────

data class AdminMatchmakingPageResponse(
    val items: List<AdminMatchmakingSummary>,
    val page: Int,
    val size: Int,
    val totalCount: Int,
    val totalPages: Int,
)

data class AdminMatchmakingSummary(
    val id: String,
    val status: String,
    val requester: UserBrief,
    val matchmaker: UserBrief,
    val target: UserBrief,
    val hasAdminNote: Boolean,
    val createdAt: String,
    val updatedAt: String,
) {
    companion object {
        fun from(r: MatchmakingRequest, users: UserRepository) = AdminMatchmakingSummary(
            id = r.id.value.toString(),
            status = r.status.name,
            requester = brief(r.requesterId, users),
            matchmaker = brief(r.matchmakerId, users),
            target = brief(r.targetUserId, users),
            hasAdminNote = !r.adminNote.isNullOrBlank(),
            createdAt = r.createdAt.toString(),
            updatedAt = r.updatedAt.toString(),
        )
    }
}

data class AdminMatchmakingDetail(
    val id: String,
    val status: String,
    val requester: UserBrief,
    val matchmaker: UserBrief,
    val target: UserBrief,
    val requesterMessage: String?,
    val matchmaker_decision: DecisionView?,
    val target_decision: DecisionView?,
    val adminNote: String?,
    val adminLastUpdatedAt: String?,
    val adminLastUpdatedBy: String?,
    val createdAt: String,
    val updatedAt: String,
) {
    companion object {
        fun from(r: MatchmakingRequest, users: UserRepository) = AdminMatchmakingDetail(
            id = r.id.value.toString(),
            status = r.status.name,
            requester = brief(r.requesterId, users),
            matchmaker = brief(r.matchmakerId, users),
            target = brief(r.targetUserId, users),
            requesterMessage = r.requesterMessage,
            matchmaker_decision = r.matchmakerDecision?.let {
                DecisionView(it.decidedAt.toString(), it.message, it.approved)
            },
            target_decision = r.targetUserDecision?.let {
                DecisionView(it.decidedAt.toString(), it.message, it.accepted)
            },
            adminNote = r.adminNote,
            adminLastUpdatedAt = r.adminLastUpdatedAt?.toString(),
            adminLastUpdatedBy = r.adminLastUpdatedBy?.value?.toString(),
            createdAt = r.createdAt.toString(),
            updatedAt = r.updatedAt.toString(),
        )
    }
}

data class DecisionView(
    val decidedAt: String,
    val message: String?,
    /** matchmaker = approved, target = accepted (true/false 공통) */
    val positive: Boolean,
)

data class AdminChangeMatchmakingStatusRequest(
    val status: String,
    val note: String,
)

data class AdminUpdateNoteRequest(
    val note: String,
)

private fun brief(userId: UserId, users: UserRepository): UserBrief {
    val u = users.findById(userId) ?: return UserBrief(userId.value.toString(), null, "(unknown)")
    return UserBrief.from(u.id.value, u.publicInfo.nickname, u.privateInfo.email)
}
