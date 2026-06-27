package kr.ai.palette.presentation.identity

import kr.ai.palette.application.identity.IdentityVerificationService
import kr.ai.palette.application.identity.NiceRequestResult
import kr.ai.palette.application.identity.NiceVerificationResult
import kr.ai.palette.domain.auth.AuthUser
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

/**
 * NICE 본인인증 API
 *
 * 프론트 → 백엔드 플로우:
 * 1. POST /api/v1/identity/nice/request   → 팝업 파라미터
 * 2. [NICE 팝업 오픈]
 * 3. NICE → GET /api/v1/identity/nice/callback  (NICE 서버가 호출)
 * 4. GET /api/v1/identity/nice/result/{requestNo} → 완료 여부 polling
 */
@RestController
@RequestMapping("/api/v1/identity/nice")
class NiceIdentityController(
    private val identityVerificationService: IdentityVerificationService,
    // dev-bypass 는 명시적으로 켤 때만 동작 (prod 기본 차단). 로그인 유저의 본인인증 우회 방지.
    @org.springframework.beans.factory.annotation.Value("\${app.nice-dev-bypass-enabled:false}")
    private val niceDevBypassEnabled: Boolean,
) {

    /**
     * NICE 팝업에 전달할 암호화 파라미터 생성
     * (로그인 상태 필수)
     */
    @PostMapping("/request")
    fun prepareRequest(
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<NiceRequestResponse> {
        val result = identityVerificationService.prepareRequest(authUser.userId.value.toString())
        return when (result) {
            is NiceRequestResult.Ready -> ResponseEntity.ok(
                NiceRequestResponse(
                    mode = "nice",
                    tokenVersionId = result.tokenVersionId,
                    encData = result.encData,
                    integrityValue = result.integrityValue,
                    requestNo = result.requestNo
                )
            )
            is NiceRequestResult.DevMode -> ResponseEntity.ok(
                NiceRequestResponse(
                    mode = "dev",
                    requestNo = result.requestNo
                )
            )
            is NiceRequestResult.Error -> ResponseEntity.status(503).body(
                NiceRequestResponse(mode = "error", errorMessage = result.message)
            )
        }
    }

    /**
     * NICE 서버가 인증 완료 후 호출하는 콜백 (returnurl)
     * HTML 응답 — 팝업창이 이 HTML을 렌더링하고 postMessage로 부모창에 알림
     */
    @GetMapping("/callback", produces = [MediaType.TEXT_HTML_VALUE])
    fun handleCallback(
        @RequestParam("token_version_id") tokenVersionId: String,
        @RequestParam("enc_data") encData: String,
        @RequestParam("integrity_value") integrityValue: String
    ): String {
        return identityVerificationService.handleCallback(tokenVersionId, encData, integrityValue)
    }

    /**
     * 인증 완료 여부 polling (프론트 → 백엔드)
     * NICE 팝업이 닫힌 후 호출
     */
    @GetMapping("/result/{requestNo}")
    fun getResult(
        @PathVariable requestNo: String,
        @AuthenticationPrincipal authUser: AuthUser
    ): ResponseEntity<NiceResultResponse> {
        val result = identityVerificationService.getResult(requestNo)
            ?: return ResponseEntity.ok(NiceResultResponse(status = "pending"))
        return ResponseEntity.ok(
            NiceResultResponse(
                status = if (result.success) "completed" else "failed",
                phoneNumber = result.phoneNumber,
                name = result.name,
                error = result.error
            )
        )
    }

    /**
     * DEV 환경 bypass — NICE 없이 인증 완료 처리
     */
    @PostMapping("/dev-bypass")
    fun devBypass(
        @AuthenticationPrincipal authUser: AuthUser,
        @RequestBody body: DevBypassRequest
    ): ResponseEntity<NiceVerificationResult> {
        if (!niceDevBypassEnabled) return ResponseEntity.status(404).build()
        val result = identityVerificationService.devBypass(
            userId = authUser.userId.value.toString(),
            phoneNumber = body.phoneNumber,
            name = body.name
        )
        return ResponseEntity.ok(result)
    }
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

data class NiceRequestResponse(
    val mode: String,                   // "nice" | "dev" | "error"
    val tokenVersionId: String? = null,
    val encData: String? = null,
    val integrityValue: String? = null,
    val requestNo: String? = null,
    val errorMessage: String? = null
)

data class NiceResultResponse(
    val status: String,   // "pending" | "completed" | "failed"
    val phoneNumber: String? = null,
    val name: String? = null,
    val error: String? = null
)

data class DevBypassRequest(
    val phoneNumber: String,
    val name: String
)
