package kr.ai.palette.domain.auth

import kr.ai.palette.domain.common.UserId
import kr.ai.palette.domain.user.OAuthProvider

interface AuthenticationService {
    /**
     * OAuth2 로그인/회원가입 처리
     * - 신규 사용자: 자동 회원가입 후 토큰 발급
     * - 기존 사용자: 토큰 발급
     */
    /**
     * @param betaCode 네이티브/Apple 등 body로 전달된 베타 코드 (쿠키 미의존 경로). null이면 쿠키만 검사.
     */
    fun authenticateOAuth(oauthUserInfo: OAuthUserInfo, betaCode: String? = null): AuthenticationResult

    /**
     * Access Token 갱신
     */
    fun refreshToken(refreshToken: String): AuthToken

    /**
     * Access Token 검증 및 사용자 정보 조회
     */
    fun validateToken(accessToken: String): AuthUser

    /**
     * 로그아웃 (Refresh Token 무효화)
     */
    fun logout(userId: UserId)
}

sealed class AuthenticationResult {
    data class Success(
        val authToken: AuthToken,
        val authUser: AuthUser,
        val isNewUser: Boolean,
        val missingRequiredFields: List<String> = emptyList()
    ) : AuthenticationResult()

    data class Failure(
        val reason: AuthenticationFailureReason
    ) : AuthenticationResult()
}

enum class AuthenticationFailureReason {
    INVALID_OAUTH_TOKEN,
    INVALID_REFRESH_TOKEN,
    EXPIRED_REFRESH_TOKEN,
    USER_NOT_FOUND,
    ACCOUNT_DISABLED,
    NETWORK_ERROR
}
