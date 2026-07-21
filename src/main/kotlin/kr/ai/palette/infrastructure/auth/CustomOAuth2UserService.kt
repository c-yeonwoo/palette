package kr.ai.palette.infrastructure.auth

import kr.ai.palette.domain.auth.AuthenticationResult
import kr.ai.palette.domain.auth.AuthenticationService
import kr.ai.palette.infrastructure.beta.InvalidBetaCodeException
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest
import org.springframework.security.oauth2.core.OAuth2AuthenticationException
import org.springframework.security.oauth2.core.OAuth2Error
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Service

@Service
class CustomOAuth2UserService(
    private val authenticationService: AuthenticationService,
    private val userInfoExtractor: OAuth2UserInfoExtractor
) : DefaultOAuth2UserService() {

    override fun loadUser(userRequest: OAuth2UserRequest): OAuth2User {
        val oAuth2User = super.loadUser(userRequest)
        val registrationId = userRequest.clientRegistration.registrationId

        // OAuth2 사용자 정보 추출
        val oauthUserInfo = userInfoExtractor.extract(oAuth2User, registrationId)

        // 인증 처리 (회원가입 or 로그인) — 베타 코드는 쿠키(+ OAuth bootstrap 필터)
        val result = try {
            authenticationService.authenticateOAuth(oauthUserInfo)
        } catch (e: InvalidBetaCodeException) {
            throw OAuth2AuthenticationException(
                OAuth2Error("invalid_beta_code", e.message, null),
                e,
            )
        }

        return when (result) {
            is AuthenticationResult.Success -> {
                // OAuth2User를 커스텀 Principal로 래핑
                PaletteOAuth2User(
                    oAuth2User = oAuth2User,
                    userId = result.authUser.userId.value.toString(),
                    authToken = result.authToken,
                    isNewUser = result.isNewUser,
                    missingRequiredFields = result.missingRequiredFields
                )
            }
            is AuthenticationResult.Failure -> {
                throw IllegalStateException("OAuth2 authentication failed: ${result.reason}")
            }
        }
    }
}
