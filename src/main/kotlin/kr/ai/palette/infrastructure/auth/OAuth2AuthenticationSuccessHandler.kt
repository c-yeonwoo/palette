package kr.ai.palette.infrastructure.auth

import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler
import org.springframework.stereotype.Component
import org.springframework.web.util.UriComponentsBuilder

@Component
class OAuth2AuthenticationSuccessHandler(
    @Value("\${app.oauth2.redirect-uri:http://localhost:3000/oauth2/redirect}")
    private val redirectUri: String
) : SimpleUrlAuthenticationSuccessHandler() {

    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {
        val oAuth2User = authentication.principal as PaletteOAuth2User

        val targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
            .queryParam("token", oAuth2User.authToken.accessToken)
            .queryParam("refreshToken", oAuth2User.authToken.refreshToken)
            .queryParam("isNewUser", oAuth2User.isNewUser)
            .build()
            .toUriString()

        redirectStrategy.sendRedirect(request, response, targetUrl)
    }
}
