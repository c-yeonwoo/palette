package kr.ai.palette.presentation.profile

import kr.ai.palette.domain.auth.AuthUser
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/**
 * 홈택스/직업 경량 검증 스텁 (P2-005).
 * 정식 연동 전 — UI 에 "준비 중" 상태만 노출.
 */
@RestController
@RequestMapping("/api/v1/profile/career-verification")
class CareerVerificationController {

    @GetMapping("/status")
    fun status(
        @AuthenticationPrincipal authUser: AuthUser,
    ): ResponseEntity<CareerVerificationStatusResponse> {
        return ResponseEntity.ok(
            CareerVerificationStatusResponse(
                available = false,
                verified = false,
                message = "직업 인증은 준비 중이에요. 현재는 프로필에 직군을 직접 입력해 주세요.",
            )
        )
    }
}

data class CareerVerificationStatusResponse(
    val available: Boolean,
    val verified: Boolean,
    val message: String,
)
