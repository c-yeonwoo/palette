package kr.ai.palette.domain.user

data class OAuthInfo(
    val provider: OAuthProvider,
    val oauthId: String
)

enum class OAuthProvider {
    KAKAO,
    NAVER,
    GOOGLE,
    APPLE
}
