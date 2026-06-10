package kr.ai.palette.presentation.admin

import kr.ai.palette.persistence.billing.TipTransactionJpaRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

/**
 * 어드민 — 팁 트랜잭션 조회 (ADR 0044 §3 + ADR 0046 외부송금 가드).
 *
 * 큰 팁(예: 300 물감 이상) 은 외부 송금 우회를 막아낸 정상 흐름의 신호.
 * 반대로, 매칭 후 갑작스레 줄어드는 평균 팁 = 외부 송금 유도 의심.
 *
 * /api/v1/admin/&#42;&#42; 패스라 SecurityConfig hasRole("ADMIN") 강제.
 */
@RestController
@RequestMapping("/api/v1/admin/tips")
class AdminTipsController(
    private val tipTransactionJpaRepository: TipTransactionJpaRepository,
) {

    /**
     * 팁 트랜잭션 목록 (최근순 limit 200).
     * userId 필터: from / to 양쪽 어디든 매치.
     */
    @GetMapping
    fun list(
        @RequestParam(required = false) userId: String?,
    ): ResponseEntity<Map<String, Any?>> {
        val items = if (!userId.isNullOrBlank()) {
            val from = tipTransactionJpaRepository.findByFromUserIdOrderByCreatedAtDesc(userId.trim())
            val to = tipTransactionJpaRepository.findByToUserIdOrderByCreatedAtDesc(userId.trim())
            (from + to).distinctBy { it.id }.sortedByDescending { it.createdAt }
        } else {
            tipTransactionJpaRepository.findAll().sortedByDescending { it.createdAt }.take(200)
        }

        val totalAmount = items.sumOf { it.amountPoints }
        val totalMatchmaker = items.sumOf { it.matchmakerCredited }
        val totalPlatformFee = items.sumOf { it.platformFee }

        return ResponseEntity.ok(
            mapOf(
                "totalCount" to items.size,
                "totalAmountPoints" to totalAmount,
                "totalMatchmakerCredited" to totalMatchmaker,
                "totalPlatformFee" to totalPlatformFee,
                "tips" to items.map {
                    mapOf(
                        "id" to it.id,
                        "fromUserId" to it.fromUserId,
                        "toUserId" to it.toUserId,
                        "amountPoints" to it.amountPoints,
                        "matchmakerCredited" to it.matchmakerCredited,
                        "platformFee" to it.platformFee,
                        "reason" to it.reason,
                        "createdAt" to it.createdAt.toString(),
                    )
                },
            )
        )
    }
}
