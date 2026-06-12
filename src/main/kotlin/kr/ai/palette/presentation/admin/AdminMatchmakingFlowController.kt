package kr.ai.palette.presentation.admin

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.persistence.matchmaking.MatchmakingRequestEntity
import kr.ai.palette.persistence.matchmaking.MatchmakingRequestJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.UUID

/**
 * 소개 요청 (매칭) 플로우 모니터링 — 날짜별 (ADR 0047 운영 가시화 확장).
 *
 * 한 매칭 요청 1건의 전체 흐름을 한 row 로 노출:
 *   생성 → 주선자 결정(승인/거절) → 수신자 결정(승인/거절) → 최종 status
 *
 * 단계별 소요 시간 (분) 동시 노출 — 어느 단계가 병목인지 / 어느 주선자가 빠르게 응답하는지 가시화.
 */
@RestController
@RequestMapping("/api/v1/admin/matchmaking/flow")
class AdminMatchmakingFlowController(
    private val matchmakingRequestRepo: MatchmakingRequestJpaRepository,
    private val userRepository: UserRepository,
) {

    /**
     * @param date 기준 일자 (KST). 생략 시 오늘. created_at 이 이 날짜인 요청만 반환.
     * @param status 필터 (옵션). PENDING_MATCHMAKER · PENDING_TARGET · MATCHED · REJECTED · EXPIRED 등
     */
    @GetMapping
    fun byDate(
        @RequestParam(required = false) date: String?,
        @RequestParam(required = false) status: String?,
    ): ResponseEntity<MatchmakingFlowResponse> {
        val targetDate = if (date.isNullOrBlank()) LocalDate.now(KST) else runCatching { LocalDate.parse(date) }.getOrElse { LocalDate.now(KST) }
        val from = targetDate.atStartOfDay()
        val to = targetDate.plusDays(1).atStartOfDay()

        val rows = matchmakingRequestRepo.findAll()
            .filter { !it.createdAt.isBefore(from) && it.createdAt.isBefore(to) }
            .filter { status.isNullOrBlank() || it.status == status }
            .sortedByDescending { it.createdAt }

        // N+1 회피 — 등장하는 user id 일괄 lookup
        val userIds: Set<UUID> = buildSet {
            rows.forEach { r ->
                add(r.requesterId); add(r.targetUserId); add(r.matchmakerId)
            }
        }
        val userNames: Map<UUID, UserNameRef> = userIds.associateWith { uid ->
            val u = userRepository.findById(UserId(uid))
            if (u == null) UserNameRef("?", "(탈퇴/없음)") else UserNameRef(u.publicInfo.nickname, u.privateInfo.realName)
        }

        val flows = rows.map { r ->
            val createdAtInstant = r.createdAt.atZone(KST).toInstant()
            val matchmakerAtInstant = r.matchmakerDecidedAt?.atZone(KST)?.toInstant()
            val targetAtInstant = r.targetDecidedAt?.atZone(KST)?.toInstant()
            MatchmakingFlowRow(
                requestId = r.id.toString(),
                status = r.status,
                createdAt = createdAtInstant,
                requester = FlowUser(r.requesterId.toString(), userNames[r.requesterId]?.nickname.orEmpty(), userNames[r.requesterId]?.realName.orEmpty()),
                matchmaker = FlowUser(r.matchmakerId.toString(), userNames[r.matchmakerId]?.nickname.orEmpty(), userNames[r.matchmakerId]?.realName.orEmpty()),
                target = FlowUser(r.targetUserId.toString(), userNames[r.targetUserId]?.nickname.orEmpty(), userNames[r.targetUserId]?.realName.orEmpty()),
                matchmakerDecidedAt = matchmakerAtInstant,
                matchmakerApproved = r.matchmakerApproved,
                matchmakerMessage = r.matchmakerMessage,
                matchmakerLatencyMin = matchmakerAtInstant?.let { (it.toEpochMilli() - createdAtInstant.toEpochMilli()) / 60_000 },
                targetDecidedAt = targetAtInstant,
                targetAccepted = r.targetAccepted,
                targetMessage = r.targetMessage,
                targetLatencyMin = if (targetAtInstant != null && matchmakerAtInstant != null) {
                    (targetAtInstant.toEpochMilli() - matchmakerAtInstant.toEpochMilli()) / 60_000
                } else null,
                requesterMessage = r.requesterMessage,
                adminNote = r.adminNote,
            )
        }

        // 단계별 집계
        val summary = FlowSummary(
            total = flows.size,
            pendingMatchmaker = flows.count { it.matchmakerDecidedAt == null },
            matchmakerRejected = flows.count { it.matchmakerApproved == false },
            pendingTarget = flows.count { it.matchmakerApproved == true && it.targetDecidedAt == null },
            targetRejected = flows.count { it.targetAccepted == false },
            matched = flows.count { it.targetAccepted == true },
            avgMatchmakerLatencyMin = flows.mapNotNull { it.matchmakerLatencyMin }
                .takeIf { it.isNotEmpty() }
                ?.let { it.sum().toDouble() / it.size }
                ?.toInt(),
            avgTargetLatencyMin = flows.mapNotNull { it.targetLatencyMin }
                .takeIf { it.isNotEmpty() }
                ?.let { it.sum().toDouble() / it.size }
                ?.toInt(),
        )

        return ResponseEntity.ok(
            MatchmakingFlowResponse(
                date = targetDate.toString(),
                summary = summary,
                flows = flows,
            )
        )
    }

    companion object {
        private val KST = ZoneId.of("Asia/Seoul")
    }
}

data class UserNameRef(val nickname: String, val realName: String)

data class FlowUser(val userId: String, val nickname: String, val realName: String)

data class MatchmakingFlowRow(
    val requestId: String,
    val status: String,
    val createdAt: Instant,
    val requester: FlowUser,
    val matchmaker: FlowUser,
    val target: FlowUser,
    val matchmakerDecidedAt: Instant?,
    val matchmakerApproved: Boolean?,
    val matchmakerMessage: String?,
    /** 생성 → 주선자 결정까지 소요 분 */
    val matchmakerLatencyMin: Long?,
    val targetDecidedAt: Instant?,
    val targetAccepted: Boolean?,
    val targetMessage: String?,
    /** 주선자 결정 → 수신자 결정까지 소요 분 */
    val targetLatencyMin: Long?,
    val requesterMessage: String?,
    val adminNote: String?,
)

data class FlowSummary(
    val total: Int,
    val pendingMatchmaker: Int,
    val matchmakerRejected: Int,
    val pendingTarget: Int,
    val targetRejected: Int,
    val matched: Int,
    val avgMatchmakerLatencyMin: Int?,
    val avgTargetLatencyMin: Int?,
)

data class MatchmakingFlowResponse(
    val date: String,
    val summary: FlowSummary,
    val flows: List<MatchmakingFlowRow>,
)

// LocalDateTime.atZone(ZoneId) 은 java.time 빌트인 — 별도 extension 필요 없음.
