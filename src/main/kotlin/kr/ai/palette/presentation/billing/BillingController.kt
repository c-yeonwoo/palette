package kr.ai.palette.presentation.billing

import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.application.billing.InsufficientBalanceException
import kr.ai.palette.domain.auth.AuthUser
import kr.ai.palette.domain.billing.PointBundle
import kr.ai.palette.domain.billing.PointBundleCatalog
import kr.ai.palette.domain.billing.PointPrice
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

data class BalanceResponse(
    /** 총 잔액 (P) — 사용자가 인지하는 단일 숫자 */
    val points: Int,
    /** 보너스 잔액 (만료 임박 표시용) */
    val bonusPoints: Int = 0,
    /** 보너스 만료 시각 (ISO-8601). null = 보너스 없음 */
    val bonusExpiresAt: String? = null,
    /** ADR 0045 — 트라이얼 상태 스냅샷 (프론트 배너 표시용) */
    val trial: TrialStatusDto? = null,
)

/** 트라이얼 상태 응답. ADR 0045. */
data class TrialStatusDto(
    val viewsTrialUntil: String?,
    val viewsUsedToday: Int,
    val viewsPerDayCap: Int,
    val halfPricePackageUntil: String?,
    val halfPricePackageUsed: Boolean,
    val freeIntroRemaining: Int,
    val freeIntroExpiresAt: String?,
    val palettePickTrialUntil: String?,
)

data class BundleDto(
    val pointsCredited: Int,
    /** 사용자가 결제할 금액 (트라이얼 반값 적용 후) */
    val priceWon: Int,
    val bonusPercent: Int,
    /** ADR 0045 — true 면 반값 트라이얼 적용 (UI 강조 + 취소선) */
    val isTrialHalfPrice: Boolean = false,
    /** 트라이얼 적용 전 정가 (취소선용). 비-트라이얼이면 priceWon 과 동일. */
    val originalPriceWon: Int = 0,
)

data class BundleCatalogResponse(
    val bundles: List<BundleDto>,
)

data class TipRequest(
    val toUserId: String,
    val amountPoints: Int,
    val reason: String,
)

/**
 * PA-002 / PA-020 — Toss confirm + 단일 잔액 충전.
 *
 * 프론트 흐름:
 *  1) `GET /bundles` 카탈로그 확인
 *  2) Toss SDK 결제 위젯 호출 (priceWon 기반 orderId 생성)
 *  3) 결제 성공 → `POST /checkout/confirm` 으로 paymentKey + 충전 P 전달
 *  4) 백엔드: Toss confirm → 멱등 → creditPaidPoints
 */
data class CheckoutConfirmRequest(
    /** 사용자가 결제하기로 한 P (백엔드가 카탈로그와 대조 검증) */
    val pointsCredited: Int,
    /** 사용자가 인지한 원화 금액 (위변조 방지) */
    val expectedAmount: Int,
    val paymentKey: String,
    val orderId: String,
)

/**
 * 결제·잔액 API. ADR 0042 (단일 잔액 모델).
 *
 * 베타 정책: `payment.gateway=mock` 시 confirm 항상 성공.
 * 정식: Toss confirm 검증 통과 시에만 잔액 적립.
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
        // 트라이얼 활성 상태 중 하나라도 있으면 노출 (만료 만으로 결정 — Boolean used 는 묶음만 의미 가짐)
        val anyTrial = b.viewsTrialUntil != null || b.halfPricePackageUntil != null ||
            b.freeIntroRemaining > 0 || b.palettePickTrialUntil != null
        return ResponseEntity.ok(
            BalanceResponse(
                points = billingService.totalPoints(b),
                bonusPoints = b.bonusPoints,
                bonusExpiresAt = b.bonusExpiresAt?.toString(),
                trial = if (anyTrial) TrialStatusDto(
                    viewsTrialUntil = b.viewsTrialUntil?.toString(),
                    viewsUsedToday = b.viewsUsedToday,
                    viewsPerDayCap = kr.ai.palette.application.billing.TrialPolicy.VIEWS_PER_DAY_CAP,
                    halfPricePackageUntil = b.halfPricePackageUntil?.toString(),
                    halfPricePackageUsed = b.halfPricePackageUsed,
                    freeIntroRemaining = b.freeIntroRemaining,
                    freeIntroExpiresAt = b.freeIntroExpiresAt?.toString(),
                    palettePickTrialUntil = b.palettePickTrialUntil?.toString(),
                ) else null,
            )
        )
    }

    @GetMapping("/bundles")
    fun getBundles(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<BundleCatalogResponse> {
        val userId = authUser.userId.value.toString()
        val list = PointBundleCatalog.BUNDLES.map { b: PointBundle ->
            // ADR 0045 — 110물감 묶음 + 트라이얼 활성 시 반값
            val halfPrice = billingService.canUseHalfPriceBundle(userId, b.pointsCredited)
            BundleDto(
                pointsCredited = b.pointsCredited,
                priceWon = if (halfPrice) b.priceWon / 2 else b.priceWon,
                bonusPercent = b.bonusPercent(),
                isTrialHalfPrice = halfPrice,
                originalPriceWon = b.priceWon,
            )
        }
        return ResponseEntity.ok(BundleCatalogResponse(bundles = list))
    }

    /**
     * PA-002 — Toss confirm + 잔액 적립.
     *
     * 흐름:
     *  1) 카탈로그 검증 — (pointsCredited, expectedAmount) 가 정의된 묶음에 존재해야 함
     *  2) 멱등 1차: 동일 paymentKey 이미 처리됐는지 조회 → ALREADY_PROCESSED
     *  3) PaymentGateway.confirm — 외부 검증
     *  4) PaymentTransaction 저장 (DB UNIQUE 가 동시성 중복 차단)
     *  5) BillingService.creditPaidPoints — 잔액 +
     */
    @PostMapping("/checkout/confirm")
    fun confirmCheckout(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody req: CheckoutConfirmRequest,
    ): ResponseEntity<Map<String, Any>> {
        val userId = authUser.userId.value.toString()

        // 1) 카탈로그 검증 — 자유 금액 결제 차단
        // ADR 0045 — 트라이얼 반값 묶음: 정가 OR 반값 둘 다 허용 (자격 검증).
        val bundle = PointBundleCatalog.BUNDLES.firstOrNull { it.pointsCredited == req.pointsCredited }
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "INVALID_BUNDLE"))
        val isHalfPrice = req.expectedAmount == bundle.priceWon / 2 &&
            billingService.canUseHalfPriceBundle(userId, req.pointsCredited)
        val isFullPrice = req.expectedAmount == bundle.priceWon
        if (!isHalfPrice && !isFullPrice) {
            return ResponseEntity.badRequest().body(mapOf("error" to "INVALID_AMOUNT"))
        }

        if (req.paymentKey.isBlank() || req.orderId.isBlank()) {
            return ResponseEntity.badRequest().body(mapOf("error" to "INVALID_REQUEST"))
        }

        // 2) 멱등 1차 — 이미 처리된 영수증이면 잔액만 응답 (재시도·새로고침 안전)
        val existing = paymentTransactionRepository
            .findByProviderAndProviderReceiptId("TOSS", req.paymentKey)
        if (existing != null) {
            val b = billingService.getOrCreateBalance(userId)
            return ResponseEntity.ok(mapOf(
                "status" to "ALREADY_PROCESSED",
                "transactionId" to existing.id,
                "points" to billingService.totalPoints(b),
            ))
        }

        // 3) 외부 결제 시스템 검증
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

        // 4) 영수증 저장 (DB UNIQUE 가 동시 요청 한 쪽만 살림)
        val tx = try {
            paymentTransactionRepository.save(
                kr.ai.palette.persistence.payment.PaymentTransactionEntity(
                    id = result.transactionId,
                    buyerUserId = userId,
                    targetUserId = userId,
                    amount = req.expectedAmount,
                    paymentMethod = "TOSS",
                    provider = "TOSS",
                    providerReceiptId = req.paymentKey,
                )
            )
        } catch (e: org.springframework.dao.DataIntegrityViolationException) {
            val b = billingService.getOrCreateBalance(userId)
            return ResponseEntity.ok(mapOf(
                "status" to "ALREADY_PROCESSED",
                "points" to billingService.totalPoints(b),
            ))
        }

        // 5) 잔액 적립
        val balance = billingService.creditPaidPoints(
            userId = userId,
            points = bundle.pointsCredited,
            provider = "TOSS",
            providerReceiptId = req.paymentKey,
        )

        // 6) ADR 0045 — 반값 묶음 결제였다면 트라이얼 1회 소진 마킹 (계정당 1회)
        if (isHalfPrice) {
            billingService.markHalfPriceBundleUsed(userId)
        }

        return ResponseEntity.ok(mapOf(
            "status" to "OK",
            "transactionId" to tx.id,
            "points" to billingService.totalPoints(balance),
            "credited" to bundle.pointsCredited,
            "halfPriceUsed" to isHalfPrice,
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

    @ExceptionHandler(InsufficientBalanceException::class)
    fun handleInsufficientBalance(e: InsufficientBalanceException): ResponseEntity<Map<String, Any>> =
        ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(
            mapOf(
                "error" to "INSUFFICIENT_BALANCE",
                "required" to e.required,
                "current" to e.current,
                "unit" to "P",
                "pricesP" to mapOf(
                    "friendOfFriendView" to PointPrice.FRIEND_OF_FRIEND_VIEW,
                    "furtherView" to PointPrice.FURTHER_VIEW,
                    "introRequest" to PointPrice.INTRO_REQUEST,
                ),
            )
        )
}
