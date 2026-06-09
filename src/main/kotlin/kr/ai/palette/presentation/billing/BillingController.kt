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
    /** 유료 + 보너스 합계 — 사용자에게 노출되는 잔액 */
    val viewTickets: Int,
    val introRequestTickets: Int,
    /** 보너스 잔액 (만료 임박 표시용) */
    val bonusViewTickets: Int = 0,
    val bonusIntroRequestTickets: Int = 0,
    /** 보너스 만료 시각 (ISO-8601) — null 이면 보너스 없음 */
    val bonusExpiresAt: String? = null,
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
 * PA-002 — Toss 결제 confirm + 티켓 묶음 적립 요청.
 *
 * 프론트 흐름:
 *  1) `GET /bundles` 로 카탈로그 확인
 *  2) Toss SDK 결제 위젯 호출 (kind/quantity/priceWon 기반 orderId 생성)
 *  3) 결제 성공 → `POST /checkout/confirm` 으로 paymentKey 전달
 *  4) 백엔드가 Toss confirm + 멱등 체크 + grantPaidTickets
 */
data class CheckoutConfirmRequest(
    val kind: String,            // "VIEW" | "INTRO_REQUEST"
    val quantity: Int,           // 1 / 5 / 10
    val expectedAmount: Int,     // 위변조 방지 — 프론트가 인지한 금액
    val paymentKey: String,      // Toss SDK 가 발급
    val orderId: String,         // 프론트가 생성, 중복 차단용
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
    private val paymentGateway: kr.ai.palette.infrastructure.payment.PaymentGateway,
    private val paymentTransactionRepository: kr.ai.palette.persistence.payment.PaymentTransactionJpaRepository,
) {

    @GetMapping("/balance")
    fun getBalance(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<BalanceResponse> {
        val b = billingService.getOrCreateBalance(authUser.userId.value.toString())
        return ResponseEntity.ok(
            BalanceResponse(
                viewTickets = b.viewTicketCount + b.bonusViewTicketCount,
                introRequestTickets = b.introRequestTicketCount + b.bonusIntroRequestTicketCount,
                bonusViewTickets = b.bonusViewTicketCount,
                bonusIntroRequestTickets = b.bonusIntroRequestTicketCount,
                bonusExpiresAt = b.bonusExpiresAt?.toString(),
            )
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
            BalanceResponse(
                viewTickets = b.viewTicketCount + b.bonusViewTicketCount,
                introRequestTickets = b.introRequestTicketCount + b.bonusIntroRequestTicketCount,
                bonusViewTickets = b.bonusViewTicketCount,
                bonusIntroRequestTickets = b.bonusIntroRequestTicketCount,
                bonusExpiresAt = b.bonusExpiresAt?.toString(),
            )
        )
    }

    /**
     * PA-002 — Toss confirm + 티켓 묶음 적립.
     *
     * 흐름:
     *  1) PaymentGateway.confirm(orderId, paymentKey, expectedAmount) — 외부 검증
     *  2) PaymentTransaction 영구 저장 (멱등 UNIQUE: provider + receiptId)
     *  3) BillingService.grantPaidTickets — 잔액 +
     *
     * 베타: payment.gateway=mock 으로 항상 성공 (외부 결제 미연동).
     * 정식: payment.gateway=toss + toss.payments.secret-key 환경변수 주입 후 동작.
     */
    @PostMapping("/checkout/confirm")
    fun confirmCheckout(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody req: CheckoutConfirmRequest,
    ): ResponseEntity<Map<String, Any>> {
        val kind = runCatching { TicketKind.valueOf(req.kind) }.getOrNull()
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "INVALID_KIND"))
        if (req.quantity !in 1..100) {
            return ResponseEntity.badRequest().body(mapOf("error" to "INVALID_QUANTITY"))
        }
        if (req.expectedAmount <= 0 || req.expectedAmount > 1_000_000) {
            return ResponseEntity.badRequest().body(mapOf("error" to "INVALID_AMOUNT"))
        }
        val userId = authUser.userId.value.toString()

        // 멱등 1단계: 이미 처리된 영수증이면 잔액만 응답 (재시도 안전성)
        val existing = paymentTransactionRepository
            .findByProviderAndProviderReceiptId("TOSS", req.paymentKey)
        if (existing != null) {
            val b = billingService.getOrCreateBalance(userId)
            return ResponseEntity.ok(mapOf(
                "status" to "ALREADY_PROCESSED",
                "transactionId" to existing.id,
                "viewTickets" to b.viewTicketCount + b.bonusViewTicketCount,
                "introRequestTickets" to b.introRequestTicketCount + b.bonusIntroRequestTicketCount,
            ))
        }

        // 1) 외부 결제 시스템 검증
        val result = paymentGateway.confirm(
            orderId = req.orderId,
            paymentKey = req.paymentKey,
            expectedAmount = req.expectedAmount,
        )
        if (result is kr.ai.palette.infrastructure.payment.PaymentGatewayResult.Failure) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(
                mapOf("error" to "PAYMENT_FAILED", "reason" to result.reason)
            )
        }
        result as kr.ai.palette.infrastructure.payment.PaymentGatewayResult.Success

        // 2) 영수증 저장 (DB UNIQUE 가 동시성 중복 차단)
        val tx = try {
            paymentTransactionRepository.save(
                kr.ai.palette.persistence.payment.PaymentTransactionEntity(
                    id = result.transactionId,
                    buyerUserId = userId,
                    targetUserId = userId,   // 티켓 충전은 본인 대상
                    amount = req.expectedAmount,
                    paymentMethod = "TOSS",
                    provider = "TOSS",
                    providerReceiptId = req.paymentKey,
                )
            )
        } catch (e: org.springframework.dao.DataIntegrityViolationException) {
            // 동시 요청 둘 다 결제 검증 통과한 경우 → 한 쪽만 살림
            val b = billingService.getOrCreateBalance(userId)
            return ResponseEntity.ok(mapOf(
                "status" to "ALREADY_PROCESSED",
                "viewTickets" to b.viewTicketCount + b.bonusViewTicketCount,
                "introRequestTickets" to b.introRequestTicketCount + b.bonusIntroRequestTicketCount,
            ))
        }

        // 3) 티켓 적립
        val balance = billingService.grantPaidTickets(
            userId = userId,
            kind = kind,
            quantity = req.quantity,
            provider = "TOSS",
            providerReceiptId = req.paymentKey,
        )

        return ResponseEntity.ok(mapOf(
            "status" to "OK",
            "transactionId" to tx.id,
            "viewTickets" to balance.viewTicketCount + balance.bonusViewTicketCount,
            "introRequestTickets" to balance.introRequestTicketCount + balance.bonusIntroRequestTicketCount,
        ))
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
