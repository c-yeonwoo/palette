package kr.ai.palette.infrastructure.beta

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

/**
 * OAuth 시작 시 `?betaCode=` 쿼리가 있으면 검증 후 베타 쿠키를 재발급.
 * 네이티브/WebView에서 HttpOnly 쿠키가 유실된 경우에도 카카오 가입이 막히지 않도록 함.
 */
@Component
class BetaCodeOAuthBootstrapFilter(
    private val validator: BetaCodeValidator,
) : OncePerRequestFilter() {

    override fun shouldNotFilter(request: HttpServletRequest): Boolean {
        val path = request.requestURI ?: return true
        return !path.startsWith("/oauth2/authorization/")
    }

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val code = request.getParameter("betaCode")
        if (validator.isEnabled && validator.validate(code)) {
            validator.issueCookie(response)
        }
        filterChain.doFilter(request, response)
    }
}
