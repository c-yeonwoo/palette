package kr.ai.palette.presentation.beta

import jakarta.servlet.http.HttpServletResponse
import kr.ai.palette.infrastructure.beta.BetaCodeValidator
import kr.ai.palette.infrastructure.beta.InvalidBetaCodeException
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/auth/beta-code")
class BetaCodeController(
    private val validator: BetaCodeValidator,
) {

    /** 베타 코드 활성화 여부 확인 (프론트가 베타 게이트 화면 표시 여부 판단용) */
    @GetMapping("/status")
    fun status(): ResponseEntity<BetaStatusResponse> =
        ResponseEntity.ok(BetaStatusResponse(enabled = validator.isEnabled))

    /** 베타 코드 검증 → 성공 시 30일 HttpOnly(+Secure on HTTPS) 쿠키 발급 */
    @PostMapping("/verify")
    fun verify(
        @RequestBody request: VerifyBetaCodeRequest,
        response: HttpServletResponse,
    ): ResponseEntity<VerifyBetaCodeResponse> {
        if (!validator.validate(request.code)) {
            throw InvalidBetaCodeException()
        }
        validator.issueCookie(response)
        return ResponseEntity.ok(VerifyBetaCodeResponse(success = true))
    }
}

data class BetaStatusResponse(val enabled: Boolean)
data class VerifyBetaCodeRequest(val code: String)
data class VerifyBetaCodeResponse(val success: Boolean)
