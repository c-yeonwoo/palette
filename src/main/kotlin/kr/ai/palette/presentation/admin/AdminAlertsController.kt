package kr.ai.palette.presentation.admin

import kr.ai.palette.persistence.matchmaker.WithdrawalRequestJpaRepository
import kr.ai.palette.persistence.safety.ReportJpaRepository
import kr.ai.palette.persistence.user.UserJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 운영 알림 인박스 — 운영자가 "처리해야 할 것" 을 한 곳에 모아 보여준다.
 * 신규 테이블 없이 기존 데이터 집계: 승인 대기 가입 / 미처리 신고 / 보류 출금.
 * 각 그룹은 count + 최근 미리보기 + 이동 경로(route)를 가진다. 클릭 시 해당 관리 화면으로 이동.
 *
 * 관리자 전용 — SecurityConfig hasRole("ADMIN").
 */
@RestController
@RequestMapping("/api/v1/admin/alerts")
class AdminAlertsController(
    private val userJpaRepository: UserJpaRepository,
    private val reportJpaRepository: ReportJpaRepository,
    private val withdrawalRequestJpaRepository: WithdrawalRequestJpaRepository,
) {
    @GetMapping
    fun alerts(): ResponseEntity<AdminAlertsResponse> {
        val users = userJpaRepository.findAll()
        val nameById = users.associate { it.id to it.nickname }

        // 1) 승인 대기 가입 (PENDING_APPROVAL)
        val pendingUsers = users
            .filter { it.status.name == "PENDING_APPROVAL" }
            .sortedByDescending { it.createdAt }
        val approvalItems = pendingUsers.take(5).map {
            AdminAlertItem(
                id = it.id.toString(),
                label = "${it.nickname} (${it.realName})",
                sublabel = "가입 ${it.createdAt.toString().take(10)}",
                at = it.createdAt.toString(),
            )
        }

        // 2) 미처리 신고 (PENDING)
        val pendingReports = reportJpaRepository.findAll()
            .filter { it.status == "PENDING" }
            .sortedByDescending { it.createdAt }
        val reportItems = pendingReports.take(5).map {
            AdminAlertItem(
                id = it.id.toString(),
                label = "${REASON_LABEL[it.reason] ?: it.reason} 신고",
                sublabel = "대상: ${nameById[it.reportedUserId] ?: "—"}",
                at = it.createdAt.toString(),
            )
        }

        // 3) 보류 출금 (HOLD)
        val pendingWithdrawals = withdrawalRequestJpaRepository.findAll()
            .filter { it.status == "HOLD" }
            .sortedByDescending { it.requestedAt }
        val withdrawalItems = pendingWithdrawals.take(5).map {
            AdminAlertItem(
                id = it.id.toString(),
                label = "${nameById[it.matchmakerUserId] ?: "—"} 출금 ${it.amount}P",
                sublabel = "요청 ${it.requestedAt.toString().take(10)}",
                at = it.requestedAt.toString(),
            )
        }

        val alerts = listOf(
            AdminAlert(
                key = "pendingApprovals",
                title = "승인 대기 가입",
                count = pendingUsers.size,
                route = "/admin/approvals",
                items = approvalItems,
            ),
            AdminAlert(
                key = "openReports",
                title = "미처리 신고",
                count = pendingReports.size,
                route = "/admin/reports",
                items = reportItems,
            ),
            AdminAlert(
                key = "pendingWithdrawals",
                title = "보류 중인 출금",
                count = pendingWithdrawals.size,
                route = "/admin/withdrawals",
                items = withdrawalItems,
            ),
        )

        return ResponseEntity.ok(
            AdminAlertsResponse(
                totalActionable = alerts.sumOf { it.count },
                alerts = alerts,
            )
        )
    }

    companion object {
        private val REASON_LABEL = mapOf(
            "FAKE_PROFILE" to "허위 프로필",
            "HARASSMENT" to "괴롭힘",
            "SPAM" to "스팸",
            "MINOR" to "미성년자",
            "EXTERNAL_PAYMENT_INDUCEMENT" to "외부송금 유도",
            "OTHER" to "기타",
        )
    }
}

data class AdminAlertsResponse(
    val totalActionable: Int,
    val alerts: List<AdminAlert>,
)

data class AdminAlert(
    val key: String,
    val title: String,
    val count: Int,
    val route: String,
    val items: List<AdminAlertItem>,
)

data class AdminAlertItem(
    val id: String,
    val label: String,
    val sublabel: String?,
    val at: String?,
)
