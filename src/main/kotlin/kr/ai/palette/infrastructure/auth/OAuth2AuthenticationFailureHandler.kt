package kr.ai.palette.infrastructure.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import kr.ai.palette.infrastructure.beta.InvalidBetaCodeException
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.AuthenticationException
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler
import org.springframework.stereotype.Component
import org.springframework.web.util.UriComponentsBuilder

/**
 * OAuth 인증 실패 시 프론트의 OAuth redirect URI 로 에러 코드와 함께 리다이렉트.
 * 베타 게이트 실패는 별도 코드(`invalid_beta_code`) 로 식별.
 */
@Component
class OAuth2AuthenticationFailureHandler(
    @Value("\${app.oauth2.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private val redirectUri: String,
) : SimpleUrlAuthenticationFailureHandler() {

    override fun onAuthenticationFailure(
        request: HttpServletRequest,
        response: HttpServletResponse,
        exception: AuthenticationException,
    ) {
        val errorCode = resolveErrorCode(exception)
        val targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
            .queryParam("error", errorCode)
            .build().toUriString()
        redirectStrategy.sendRedirect(request, response, targetUrl)
    }

    private fun resolveErrorCode(ex: AuthenticationException): String {
        // OAuth2 처리 도중 발생한 우리쪽 예외는 cause/message 로 식별
        val root = generateSequence<Throwable>(ex) { it.cause }.toList()
        return when {
            root.any { it is InvalidBetaCodeException } -> "invalid_beta_code"
            ex is OAuth2AuthenticationException -> "oauth2_error"
            else -> "auth_failed"
        }
    }
}
