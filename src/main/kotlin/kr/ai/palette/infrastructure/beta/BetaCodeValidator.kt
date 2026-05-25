package kr.ai.palette.infrastructure.beta

import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.context.request.RequestContextHolder
import org.springframework.web.context.request.ServletRequestAttributes

/**
 * 베타 코드 게이트.
 *
 * - `app.beta-code` 환경변수가 비어있으면 게이트 비활성 (모든 가입 허용)
 * - 값이 있으면 신규 가입 시 베타 코드 또는 베타 쿠키 필수
 *
 * OAuth는 콜백 시점에 RequestContextHolder로 쿠키 검증 (Email은 request body로 직접 검증).
 */
@Component
class BetaCodeValidator(
    @Value("\${app.beta-code:}")
    private val configuredCode: String,
) {
    /** 게이트 활성화 여부 */
    val isEnabled: Boolean
        get() = configuredCode.isNotBlank()

    /** 직접 입력한 코드 검증 (대소문자 무시, 공백 제거) */
    fun validate(code: String?): Boolean {
        if (!isEnabled) return true
        if (code.isNullOrBlank()) return false
        return code.trim().equals(configuredCode.trim(), ignoreCase = true)
    }

    /**
     * 현재 요청의 쿠키에서 베타 토큰 검증.
     * OAuth 콜백 등 request body가 없는 컨텍스트에서 사용.
     */
    fun validateFromCookie(): Boolean {
        if (!isEnabled) return true
        val request = currentRequest() ?: return false
        val cookie = request.cookies?.firstOrNull { it.name == COOKIE_NAME } ?: return false
        return validate(cookie.value)
    }

    /** 검증 통과 후 응답에 쿠키 발급 (1시간 TTL) */
    fun issueCookie(response: HttpServletResponse) {
        val cookie = Cookie(COOKIE_NAME, configuredCode).apply {
            path = "/"
            maxAge = COOKIE_TTL_SECONDS
            isHttpOnly = true
            // Production에선 secure=true 권장 (HTTPS 환경)
        }
        response.addCookie(cookie)
    }

    private fun currentRequest(): HttpServletRequest? =
        (RequestContextHolder.getRequestAttributes() as? ServletRequestAttributes)?.request

    companion object {
        const val COOKIE_NAME = "palette_beta_token"
        // 베타 가입 흐름은 시간이 걸릴 수 있음 (인증/사진 준비 등)
        // → 베타 기간 전체를 커버할 만큼 길게
        const val COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30 // 30일
    }
}

/** 베타 코드 검증 실패 시 throw */
class InvalidBetaCodeException(message: String = "유효하지 않은 베타 코드입니다") :
    RuntimeException(message)
