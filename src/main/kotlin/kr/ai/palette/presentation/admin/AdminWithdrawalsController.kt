package kr.ai.palette.presentation.admin

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.matchmaker.MatchmakerRepository
import kr.ai.palette.persistence.matchmaker.WithdrawalRequestJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.time.Instant
import java.util.UUID

/**
 * 운영자 출금 관리 (어뷰징 방지 — ADR 0023).
 * holding 기간 중 의심 거래를 거절(예약 해제)할 수 있다.
 * admin API 는 SecurityConfig 에서 hasRole(ADMIN) 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/withdrawals")
class AdminWithdrawalsController(
    private val withdrawalRequestJpaRepository: WithdrawalRequestJpaRepository,
    private val matchmakerRepository: MatchmakerRepository,
) {

    /** holding 중(HOLD) 출금 요청 목록 — 검토 큐 */
    @GetMapping("/pending")
    fun pending(): ResponseEntity<List<Map<String, Any?>>> {
        val list = withdrawalRequestJpaRepository
            .findByStatusOrderByRequestedAtAsc("HOLD")
            .map {
                mapOf(
                    "id" to it.id.toString(),
                    "matchmakerUserId" to it.matchmakerUserId.toString(),
                    "amount" to it.amount,
                    "requestedAt" to it.requestedAt.toString(),
                    "availableAt" to it.availableAt.toString(),
                )
            }
        return ResponseEntity.ok(list)
    }

    /** 출금 거절 — 예약(pending) 해제 + REJECTED */
    @PatchMapping("/{id}/reject")
    @Transactional
    fun reject(
        @PathVariable id: UUID,
        @RequestBody(required = false) body: RejectWithdrawalRequest?
    ): ResponseEntity<Map<String, Any?>> {
        val wr = withdrawalRequestJpaRepository.findById(id).orElse(null)
            ?: return ResponseEntity.notFound().build()
        if (wr.status != "HOLD") {
            return ResponseEntity.badRequest().body(mapOf("error" to "HOLD 상태만 거절할 수 있습니다 (현재: ${wr.status})"))
        }

        val matchmaker = matchmakerRepository.findByUserId(UserId(wr.matchmakerUserId))
        if (matchmaker != null && matchmaker.earnings.pendingPoints >= wr.amount) {
            matchmakerRepository.save(
                matchmaker.copy(earnings = matchmaker.earnings.releaseWithdrawal(wr.amount))
            )
        }
        wr.status = "REJECTED"
        wr.processedAt = Instant.now()
        wr.note = body?.reason
        withdrawalRequestJpaRepository.save(wr)

        return ResponseEntity.ok(mapOf("success" to true, "id" to id.toString(), "status" to "REJECTED"))
    }
}

data class RejectWithdrawalRequest(val reason: String?)
