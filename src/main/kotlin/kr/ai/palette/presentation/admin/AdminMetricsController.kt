package kr.ai.palette.presentation.admin

import kr.ai.palette.persistence.billing.AdminBillingGrantJpaRepository
import kr.ai.palette.persistence.billing.UserTicketBalanceJpaRepository
import kr.ai.palette.persistence.matchmaker.WithdrawalRequestJpaRepository
import kr.ai.palette.persistence.matchmaking.MatchmakingRequestJpaRepository
import kr.ai.palette.persistence.payment.PaymentTransactionJpaRepository
import kr.ai.palette.persistence.safety.BlockJpaRepository
import kr.ai.palette.persistence.safety.ReportJpaRepository
import kr.ai.palette.persistence.user.UserJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/**
 * 운영 메트릭 — admin 대시보드 KPI. ADR 0044 운영 인사이트.
 *
 * 집계 윈도우:
 *  · today: 오늘 자정(KST) ~ 현재
 *  · last7d: 최근 7일
 *  · total: 누적 (전체 row count — count(*) — 빠른 응답)
 *
 * 모든 admin API 는 SecurityConfig hasRole("ADMIN") 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/metrics")
class AdminMetricsController(
    private val userJpaRepository: UserJpaRepository,
    private val matchmakingRequestJpaRepository: MatchmakingRequestJpaRepository,
    private val paymentTransactionJpaRepository: PaymentTransactionJpaRepository,
    private val reportJpaRepository: ReportJpaRepository,
    private val withdrawalRequestJpaRepository: WithdrawalRequestJpaRepository,
    private val adminBillingGrantJpaRepository: AdminBillingGrantJpaRepository,
    private val userTicketBalanceJpaRepository: UserTicketBalanceJpaRepository,
    private val blockJpaRepository: BlockJpaRepository,
) {

    @GetMapping
    fun overview(): ResponseEntity<Map<String, Any?>> {
        val now = Instant.now()
        val zone = ZoneId.of("Asia/Seoul")
        val todayStart = LocalDate.now(zone).atStartOfDay(zone).toInstant()
        val weekStart = now.minusSeconds(7L * 86_400)

        // 전체 row 한 번 fetch 후 inline 카운트 — 베타 단계 단순함 우선.
        // 데이터 증가 시 native query (count where created_at > ?) 로 최적화 (TODO Phase 2).
        val users = userJpaRepository.findAll()
        val matches = matchmakingRequestJpaRepository.findAll()
        val payments = paymentTransactionJpaRepository.findAll()
        val reports = reportJpaRepository.findAll()
        val withdrawals = withdrawalRequestJpaRepository.findAll()
        val grants = adminBillingGrantJpaRepository.findAll()

        fun countByCreatedAt(items: List<Instant>, after: Instant): Int =
            items.count { it.isAfter(after) }

        // 사용자 생성 시점은 metadata.createdAt — UserEntity 의 metadata 필드 접근.
        val userCreatedAts: List<Instant> = users.mapNotNull { runCatching { it.createdAt }.getOrNull() }
        val matchCreatedAts: List<Instant> = matches.mapNotNull { runCatching { it.createdAt.atZone(zone).toInstant() }.getOrNull() }
        val matchCompletedCount = matches.count { it.status == "COMPLETED" }
        val matchCompletedToday = matches.count { it.status == "COMPLETED" && runCatching { it.updatedAt.atZone(zone).toInstant().isAfter(todayStart) }.getOrDefault(false) }
        val matchCompleted7d = matches.count { it.status == "COMPLETED" && runCatching { it.updatedAt.atZone(zone).toInstant().isAfter(weekStart) }.getOrDefault(false) }

        val paymentCreatedAts: List<Instant> = payments.map { it.createdAt }
        val paymentRevenueToday = payments.filter { it.createdAt.isAfter(todayStart) }.sumOf { it.amount }
        val paymentRevenue7d = payments.filter { it.createdAt.isAfter(weekStart) }.sumOf { it.amount }
        val paymentRevenueTotal = payments.sumOf { it.amount }

        val activeReports = reports.count { it.status == "PENDING" }
        val activeWithdrawals = withdrawals.count { it.status == "HOLD" }

        val grantsToday = grants.count { it.grantedAt.isAfter(todayStart) }
        val grantsTotal = grants.size

        // 트라이얼 사용 현황 — ADR 0045
        val balances = userTicketBalanceJpaRepository.findAll()
        val nowInst = Instant.now()
        val viewsTrialActive = balances.count { it.viewsTrialUntil != null && nowInst.isBefore(it.viewsTrialUntil) }
        val halfPriceUsed = balances.count { it.halfPricePackageUsed }
        val halfPriceUnused = balances.count {
            !it.halfPricePackageUsed && it.halfPricePackageUntil != null && nowInst.isBefore(it.halfPricePackageUntil)
        }
        val freeIntroRemaining = balances.sumOf { it.freeIntroRemaining }
        val palettePickTrialActive = balances.count { it.palettePickTrialUntil != null && nowInst.isBefore(it.palettePickTrialUntil) }

        // 차단 관계 카운트
        val totalBlocks = blockJpaRepository.findAll().size

        return ResponseEntity.ok(
            mapOf(
                "users" to mapOf(
                    "today" to countByCreatedAt(userCreatedAts, todayStart),
                    "last7d" to countByCreatedAt(userCreatedAts, weekStart),
                    "total" to users.size,
                ),
                "matchRequests" to mapOf(
                    "today" to countByCreatedAt(matchCreatedAts, todayStart),
                    "last7d" to countByCreatedAt(matchCreatedAts, weekStart),
                    "total" to matches.size,
                ),
                "matchSuccess" to mapOf(
                    "today" to matchCompletedToday,
                    "last7d" to matchCompleted7d,
                    "total" to matchCompletedCount,
                ),
                "payments" to mapOf(
                    "today" to countByCreatedAt(paymentCreatedAts, todayStart),
                    "last7d" to countByCreatedAt(paymentCreatedAts, weekStart),
                    "total" to payments.size,
                ),
                "revenue" to mapOf(
                    "today" to paymentRevenueToday,
                    "last7d" to paymentRevenue7d,
                    "total" to paymentRevenueTotal,
                ),
                "queues" to mapOf(
                    "pendingReports" to activeReports,
                    "holdWithdrawals" to activeWithdrawals,
                ),
                "adminGrants" to mapOf(
                    "today" to grantsToday,
                    "total" to grantsTotal,
                ),
                "trial" to mapOf(
                    "viewsTrialActive" to viewsTrialActive,
                    "halfPriceUsed" to halfPriceUsed,
                    "halfPriceUnused" to halfPriceUnused,
                    "freeIntroRemainingTotal" to freeIntroRemaining,
                    "palettePickTrialActive" to palettePickTrialActive,
                ),
                "blocks" to mapOf(
                    "total" to totalBlocks,
                ),
                "generatedAt" to now.toString(),
            )
        )
    }
}
