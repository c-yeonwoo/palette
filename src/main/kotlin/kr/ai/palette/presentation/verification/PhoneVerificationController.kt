package kr.ai.palette.presentation.verification

import kr.ai.palette.application.verification.PhoneVerificationService
import kr.ai.palette.application.verification.SendVerificationCodeResult
import kr.ai.palette.application.verification.VerifyCodeResult
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

/**
 * 핸드폰 인증 API 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/verification/phone")
class PhoneVerificationController(
    private val phoneVerificationService: PhoneVerificationService
) {

    /**
     * 인증번호 발송 API
     */
    @PostMapping("/send")
    fun sendVerificationCode(
        @RequestBody request: SendVerificationCodeRequest
    ): ResponseEntity<SendVerificationCodeResponse> {
        return when (val result = phoneVerificationService.sendVerificationCode(request.phoneNumber, request.blockIfRegistered)) {
            is SendVerificationCodeResult.Success -> ResponseEntity.ok(
                SendVerificationCodeResponse(
                    success = true,
                    message = "인증번호가 발송되었습니다",
                    phoneNumber = result.phoneNumber,
                    expiresAt = result.expiresAt
                )
            )
            is SendVerificationCodeResult.Failure -> ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                SendVerificationCodeResponse(
                    success = false,
                    message = result.message,
                    phoneNumber = null,
                    expiresAt = null
                )
            )
        }
    }

    /**
     * 인증번호 검증 API
     */
    @PostMapping("/verify")
    fun verifyCode(
        @RequestBody request: VerifyCodeRequest
    ): ResponseEntity<VerifyCodeResponse> {
        return when (val result = phoneVerificationService.verifyCode(
            phoneNumber = request.phoneNumber,
            code = request.code,
            userId = request.userId
        )) {
            is VerifyCodeResult.Success -> ResponseEntity.ok(
                VerifyCodeResponse(
                    success = true,
                    message = "인증이 완료되었습니다",
                    phoneNumber = result.phoneNumber
                )
            )
            is VerifyCodeResult.Failure -> ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                VerifyCodeResponse(
                    success = false,
                    message = result.message,
                    phoneNumber = null
                )
            )
        }
    }
}

/**
 * 인증번호 발송 요청
 */
data class SendVerificationCodeRequest(
    val phoneNumber: String,
    /** 가입 흐름에서 true — 이미 가입된 번호면 발송 차단(중복 안내). 기본 false(번호 변경 등). */
    val blockIfRegistered: Boolean = false,
)

/**
 * 인증번호 발송 응답
 */
data class SendVerificationCodeResponse(
    val success: Boolean,
    val message: String,
    val phoneNumber: String?,
    val expiresAt: LocalDateTime?
)

/**
 * 인증번호 검증 요청
 */
data class VerifyCodeRequest(
    val phoneNumber: String,
    val code: String,
    val userId: String? = null
)

/**
 * 인증번호 검증 응답
 */
data class VerifyCodeResponse(
    val success: Boolean,
    val message: String,
    val phoneNumber: String?
)
