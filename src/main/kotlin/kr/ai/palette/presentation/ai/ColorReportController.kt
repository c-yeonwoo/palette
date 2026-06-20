package kr.ai.palette.presentation.ai

import kr.ai.palette.application.billing.BillingService
import kr.ai.palette.application.billing.InsufficientBalanceException
import kr.ai.palette.domain.auth.AuthUser
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 내 색 '심층 리포트' 잠금 해제 (ADR 0069).
 * 색 분석의 기본 요약(색·근거)은 무료, 심층(성향·이상형 인사이트·강점)은 물감으로 1회 해제하면 영구 공개.
 * 리포트 데이터 자체는 /api/v1/profile 의 colorType 으로 내려가고, 이 컨트롤러는 잠금 상태/해제만 담당.
 * (광고 보상 해제는 후속 — 광고 SDK 연동 시 추가.)
 */
@RestController
@RequestMapping("/api/v1/color-report")
class ColorReportController(
    private val billingService: BillingService,
) {
    private val log = LoggerFactory.getLogger(ColorReportController::class.java)

    @GetMapping
    fun status(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<Map<String, Any>> {
        val userId = authUser.userId.value.toString()
        return ResponseEntity.ok(
            mapOf(
                "unlocked" to billingService.isReportUnlocked(userId),
                "cost" to REPORT_UNLOCK_COST,
            )
        )
    }

    @PostMapping("/unlock")
    fun unlock(@AuthenticationPrincipal authUser: AuthUser): ResponseEntity<Map<String, Any>> {
        val userId = authUser.userId.value.toString()
        return try {
            val balance = billingService.unlockColorReport(userId, REPORT_UNLOCK_COST)
            log.info("색 리포트 잠금 해제 user={} cost={}P", userId, REPORT_UNLOCK_COST)
            ResponseEntity.ok(
                mapOf(
                    "unlocked" to true,
                    "balance" to billingService.totalPoints(balance),
                )
            )
        } catch (e: InsufficientBalanceException) {
            ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(
                mapOf(
                    "unlocked" to false,
                    "required" to e.required,
                    "current" to e.current,
                    "message" to "물감이 부족해요. 충전 후 다시 시도해주세요.",
                )
            )
        }
    }

    companion object {
        /** 내 심층 리포트 해제 비용 (물감). 남의 프로필 열람(10)보다 저렴 — 자기 분석이므로. */
        const val REPORT_UNLOCK_COST = 5
    }
}
