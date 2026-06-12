package kr.ai.palette.presentation.admin

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaking.MatchmakingRequestRepository
import kr.ai.palette.domain.user.UserRepository
import kr.ai.palette.infrastructure.exception.ResourceNotFoundException
import kr.ai.palette.persistence.billing.AdminBillingGrantJpaRepository
import kr.ai.palette.persistence.billing.TipTransactionJpaRepository
import kr.ai.palette.persistence.feed.CardOpenJpaRepository
import kr.ai.palette.persistence.matchmaker.WithdrawalRequestJpaRepository
import kr.ai.palette.persistence.matchmaking.MatchmakingRequestJpaRepository
import kr.ai.palette.persistence.payment.PaymentTransactionJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.ZoneId
import java.util.UUID

/**
 * 유저 액션 히스토리 — 한 사용자의 모든 결제·열람·매칭·출금·팁·운영자 충전을 시간 역순 통합 타임라인 (ADR 0010 확장).
 *
 * 출처:
 *  · CARD_OPEN        — 프로필 열람 (CardOpen)
 *  · PAYMENT          — 결제 (PaymentTransaction)
 *  · MATCH_REQUEST_*  — 매칭 요청 생성 / 주선자 승인·거절 / 수신자 승인·거절
 *  · WITHDRAWAL       — 출금 신청 + 정산
 *  · TIP_SENT / TIP_RECEIVED — 팁 송수신 (양방향, 90/10 분배)
 *  · ADMIN_GRANT      — 운영자 수동 충전
 *
 * 베타 단계 사용자 수 적음 → 각 repository.findBy{User}Id*() 후 메모리 머지·정렬.
 * 트래픽 폭증 시 단일 native UNION query 로 최적화 (BACKLOG).
 */
@RestController
@RequestMapping("/api/v1/admin/users")
class AdminUserActivityController(
    private val userRepository: UserRepository,
    private val cardOpenRepo: CardOpenJpaRepository,
    private val paymentRepo: PaymentTransactionJpaRepository,
    private val matchmakingRequestJpaRepo: MatchmakingRequestJpaRepository,
    private val matchmakingRequestRepository: MatchmakingRequestRepository,
    private val withdrawalRepo: WithdrawalRequestJpaRepository,
    private val tipRepo: TipTransactionJpaRepository,
    private val grantRepo: AdminBillingGrantJpaRepository,
) {

    @GetMapping("/{userId}/activity")
    fun activity(
        @PathVariable userId: UUID,
        @RequestParam(required = false, defaultValue = "200") limit: Int,
    ): ResponseEntity<UserActivityResponse> {
        val user = userRepository.findById(UserId(userId))
            ?: throw ResourceNotFoundException("사용자를 찾을 수 없습니다")

        val events = mutableListOf<ActivityEvent>()

        // 1) 카드 열람 (viewer 본인)
        cardOpenRepo.findByViewerId(userId).forEach { co ->
            events += ActivityEvent(
                type = "CARD_OPEN",
                at = co.openedAt.atZone(KST).toInstant(),
                summary = "프로필 열람",
                counterpartUserId = co.targetUserId.toString(),
                amountPoints = null,
                meta = mapOf("cardOpenId" to co.id.toString()),
            )
        }

        // 2) 결제 (buyer 본인)
        paymentRepo.findAll()
            .filter { it.buyerUserId == userId.toString() }
            .forEach { p ->
                events += ActivityEvent(
                    type = "PAYMENT",
                    at = p.createdAt,
                    summary = "결제 ${"%,d".format(p.amount)}원 (${p.paymentMethod} · ${p.status})",
                    counterpartUserId = p.targetUserId.takeIf { it.isNotBlank() && it != userId.toString() },
                    amountPoints = null,
                    amountWon = p.amount,
                    meta = mapOf(
                        "method" to p.paymentMethod,
                        "provider" to p.provider,
                        "status" to p.status,
                    ),
                )
            }

        // 3) 매칭 요청 — requester / target / matchmaker 어느 역할로든
        val asRequester = matchmakingRequestJpaRepo.findByRequesterId(userId)
        val asTarget = matchmakingRequestJpaRepo.findByTargetUserId(userId)
        val asMatchmaker = matchmakingRequestJpaRepo.findAll().filter { it.matchmakerId == userId }
        (asRequester + asTarget + asMatchmaker).distinctBy { it.id }.forEach { r ->
            // 생성 이벤트
            val role = when (userId) {
                r.requesterId -> "REQUESTER"
                r.targetUserId -> "TARGET"
                r.matchmakerId -> "MATCHMAKER"
                else -> "?"
            }
            events += ActivityEvent(
                type = "MATCH_REQUEST_CREATED",
                at = r.createdAt.atZone(KST).toInstant(),
                summary = "매칭 요청 생성 ($role)",
                counterpartUserId = (if (role == "REQUESTER") r.targetUserId else r.requesterId).toString(),
                amountPoints = null,
                meta = mapOf(
                    "requestId" to r.id.toString(),
                    "status" to r.status,
                    "role" to role,
                ),
            )
            // 주선자 결정
            r.matchmakerDecidedAt?.let { decided ->
                events += ActivityEvent(
                    type = if (r.matchmakerApproved == true) "MATCH_MATCHMAKER_APPROVED" else "MATCH_MATCHMAKER_REJECTED",
                    at = decided.atZone(KST).toInstant(),
                    summary = if (r.matchmakerApproved == true) "주선자 승인" else "주선자 거절",
                    counterpartUserId = r.matchmakerId.toString(),
                    amountPoints = null,
                    meta = mapOf("requestId" to r.id.toString()),
                )
            }
            // 수신자 결정
            r.targetDecidedAt?.let { decided ->
                events += ActivityEvent(
                    type = if (r.targetAccepted == true) "MATCH_TARGET_ACCEPTED" else "MATCH_TARGET_REJECTED",
                    at = decided.atZone(KST).toInstant(),
                    summary = if (r.targetAccepted == true) "수신자 수락 — 매칭 성공" else "수신자 거절",
                    counterpartUserId = r.targetUserId.toString(),
                    amountPoints = null,
                    meta = mapOf("requestId" to r.id.toString()),
                )
            }
        }

        // 4) 출금
        withdrawalRepo.findByMatchmakerUserIdOrderByRequestedAtDesc(userId).forEach { w ->
            events += ActivityEvent(
                type = "WITHDRAWAL_REQUESTED",
                at = w.requestedAt,
                summary = "출금 신청 ${w.amount} 물감 (${w.status})",
                counterpartUserId = null,
                amountPoints = w.amount,
                meta = mapOf(
                    "status" to w.status,
                    "availableAt" to w.availableAt.toString(),
                ),
            )
            w.processedAt?.let { pa ->
                events += ActivityEvent(
                    type = "WITHDRAWAL_PROCESSED",
                    at = pa,
                    summary = "출금 ${w.status} — ${w.amount} 물감",
                    counterpartUserId = null,
                    amountPoints = w.amount,
                    meta = mapOf("status" to w.status),
                )
            }
        }

        // 5) 팁 송수신 (양방향)
        tipRepo.findByFromUserIdOrderByCreatedAtDesc(userId.toString()).forEach { t ->
            events += ActivityEvent(
                type = "TIP_SENT",
                at = t.createdAt,
                summary = "팁 송신 ${t.amountPoints} 물감 (주선자 ${t.matchmakerCredited} / 플랫폼 ${t.platformFee})",
                counterpartUserId = t.toUserId,
                amountPoints = -t.amountPoints,
                meta = mapOf("reason" to t.reason),
            )
        }
        tipRepo.findByToUserIdOrderByCreatedAtDesc(userId.toString()).forEach { t ->
            events += ActivityEvent(
                type = "TIP_RECEIVED",
                at = t.createdAt,
                summary = "팁 수신 ${t.matchmakerCredited} 물감 (송신 ${t.amountPoints})",
                counterpartUserId = t.fromUserId,
                amountPoints = t.matchmakerCredited,
                meta = mapOf("reason" to t.reason),
            )
        }

        // 6) 운영자 충전 (이 사용자가 받은 것만)
        grantRepo.findByRecipientUserIdOrderByGrantedAtDesc(
            userId.toString(),
            org.springframework.data.domain.PageRequest.of(0, limit),
        ).forEach { g ->
            events += ActivityEvent(
                type = "ADMIN_GRANT",
                at = g.grantedAt,
                summary = "운영자 충전 +${g.amountPoints} 물감 (${g.grantType}) — ${g.reason}",
                counterpartUserId = g.granterAdminUserId,
                amountPoints = g.amountPoints,
                meta = mapOf(
                    "grantType" to g.grantType,
                    "validDays" to (g.validDays?.toString() ?: "무기한"),
                ),
            )
        }

        // 시간 역순 정렬 + limit
        val sorted = events.sortedByDescending { it.at }.take(limit.coerceIn(10, 1000))

        return ResponseEntity.ok(
            UserActivityResponse(
                userId = userId.toString(),
                nickname = user.publicInfo.nickname,
                realName = user.privateInfo.realName,
                email = user.privateInfo.email,
                eventCount = sorted.size,
                truncated = events.size > sorted.size,
                events = sorted,
            )
        )
    }

    companion object {
        private val KST = ZoneId.of("Asia/Seoul")
    }
}

data class ActivityEvent(
    val type: String,
    val at: Instant,
    val summary: String,
    val counterpartUserId: String?,
    val amountPoints: Int?,
    val amountWon: Int? = null,
    val meta: Map<String, String>,
)

data class UserActivityResponse(
    val userId: String,
    val nickname: String,
    val realName: String,
    val email: String?,
    val eventCount: Int,
    val truncated: Boolean,
    val events: List<ActivityEvent>,
)

// LocalDateTime.atZone(ZoneId) 은 java.time 빌트인 — 별도 extension 필요 없음.
