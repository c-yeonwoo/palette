package kr.ai.palette.presentation.billing

import kr.ai.palette.domain.auth.AuthUser
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * Apple IAP — Restore Purchases (PA-003, L-004).
 * sandbox/베타: receipt 존재 시 성공 응답. prod: App Store Server API 연동 전까지 receipt 필수 검증 stub.
 */
@RestController
@RequestMapping("/api/v1/billing/apple")
class AppleIapController(
    @Value("\${apple.iap.shared-secret:}") private val sharedSecret: String,
) {
    private val isStubMode: Boolean
        get() = sharedSecret.isBlank() || sharedSecret.startsWith("dummy")

    @PostMapping("/restore")
    fun restorePurchases(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody body: AppleRestoreRequest,
    ): ResponseEntity<AppleRestoreResponse> {
        if (body.receiptData.isBlank()) {
            return ResponseEntity.badRequest().build()
        }
        // TODO: App Store Server API 영수증 검증 + PaymentTransaction 영속화
        if (!isStubMode) {
            return ResponseEntity.status(501).build()
        }
        return ResponseEntity.ok(
            AppleRestoreResponse(
                restored = true,
                productIds = body.productIds.ifEmpty { listOf("palette.paint.bundle") },
                message = "베타: 복원 요청이 접수됐어요",
            )
        )
    }
}

data class AppleRestoreRequest(
    val receiptData: String,
    val productIds: List<String> = emptyList(),
)

data class AppleRestoreResponse(
    val restored: Boolean,
    val productIds: List<String>,
    val message: String,
)
