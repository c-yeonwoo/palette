package kr.ai.palette.presentation.billing

import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.application.billing.InsufficientTicketException
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.billing.TicketBundleCatalog
import kr.ai.palette.domain.billing.TicketKind
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

data class BalanceResponse(
    val viewTickets: Int,
    val introRequestTickets: Int,
)

data class BundleDto(
    val kind: String,
    val quantity: Int,
    val priceWon: Int,
    val discountPercent: Int,
)

data class BundleCatalogResponse(
    val view: List<BundleDto>,
    val introRequest: List<BundleDto>,
)

data class ChargeRequest(
    val kind: String,   // "VIEW" | "INTRO_REQUEST"
    val quantity: Int,
)

data class TipRequest(
    val toUserId: String,
    val amountPoints: Int,
    val reason: String,
)

/**
 * 결제·티켓 잔액 API. ADR 0039.
 *
 * 베타 정책: 충전은 무료 stub (`POST /charge`). Phase 2 Toss 결제 연동 시
 * PaymentGateway 검증 통과 후에만 BillingService.grantTickets 호출.
 */
@RestController
@RequestMapping("/api/v1/billing")
class BillingController(
    private val billingService: BillingService,
) {

    @GetMapping("/balance")
    fun getBalance(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<BalanceResponse> {
        val b = billingService.getOrCreateBalance(authUser.userId.value.toString())
        return ResponseEntity.ok(
            BalanceResponse(viewTickets = b.viewTicketCount, introRequestTickets = b.introRequestTicketCount)
        )
    }

    @GetMapping("/bundles")
    fun getBundles(): ResponseEntity<BundleCatalogResponse> {
        fun map(b: kr.ai.palette.domain.billing.TicketBundle, unit: Int) = BundleDto(
            kind = b.kind.name,
            quantity = b.quantity,
            priceWon = b.priceWon,
            discountPercent = if (b.quantity > 1) b.discountPercent(unit) else 0,
        )
        return ResponseEntity.ok(
            BundleCatalogResponse(
                view = TicketBundleCatalog.VIEW_BUNDLES
                    .map { map(it, TicketBundleCatalog.VIEW_UNIT_PRICE_WON) },
                introRequest = TicketBundleCatalog.INTRO_REQUEST_BUNDLES
                    .map { map(it, TicketBundleCatalog.INTRO_REQUEST_UNIT_PRICE_WON) },
            )
        )
    }

    /**
     * 베타용 무료 충전. Phase 2 결제 연동 후엔 PaymentGateway 검증 통과 시에만 호출.
     */
    @PostMapping("/charge")
    fun charge(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody req: ChargeRequest,
    ): ResponseEntity<BalanceResponse> {
        val kind = runCatching { TicketKind.valueOf(req.kind) }.getOrNull()
            ?: return ResponseEntity.badRequest().build()
        if (req.quantity !in 1..100) return ResponseEntity.badRequest().build()
        val b = billingService.grantTickets(
            userId = authUser.userId.value.toString(),
            kind = kind,
            quantity = req.quantity,
        )
        return ResponseEntity.ok(
            BalanceResponse(viewTickets = b.viewTicketCount, introRequestTickets = b.introRequestTicketCount)
        )
    }

    @PostMapping("/tip")
    fun sendTip(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody req: TipRequest,
    ): ResponseEntity<Map<String, Any>> {
        return try {
            val tx = billingService.sendTip(
                fromUserId = authUser.userId.value.toString(),
                toUserId = req.toUserId,
                amountPoints = req.amountPoints,
                reason = req.reason,
            )
            ResponseEntity.ok(mapOf("id" to tx.id, "amountPoints" to tx.amountPoints))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("error" to (e.message ?: "invalid")))
        }
    }

    @ExceptionHandler(InsufficientTicketException::class)
    fun handleInsufficientTicket(e: InsufficientTicketException): ResponseEntity<Map<String, Any>> =
        ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(
            mapOf(
                "error" to "INSUFFICIENT_TICKET",
                "kind" to e.kind.name,
                "required" to e.required,
                "current" to e.current,
            )
        )
}
