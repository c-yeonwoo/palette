package kr.ai.palette.infrastructure.auth

import kr.ai.palette.domain.auth.OAuthUserInfo
import kr.ai.palette.domain.user.OAuthProvider
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Component

@Component
class OAuth2UserInfoExtractor {

    fun extract(oAuth2User: OAuth2User, registrationId: String): OAuthUserInfo {
        return when (registrationId.lowercase()) {
            "kakao" -> extractKakaoUser(oAuth2User)
            "naver" -> extractNaverUser(oAuth2User)
            "google" -> extractGoogleUser(oAuth2User)
            else -> throw IllegalArgumentException("Unsupported OAuth2 provider: $registrationId")
        }
    }

    private fun extractKakaoUser(oAuth2User: OAuth2User): OAuthUserInfo {
        val id = oAuth2User.attributes["id"]?.toString()
            ?: throw IllegalArgumentException("Kakao user id is missing")

        val kakaoAccount = oAuth2User.attributes["kakao_account"] as? Map<*, *>
        val profile = kakaoAccount?.get("profile") as? Map<*, *>

        return OAuthUserInfo(
            provider = OAuthProvider.KAKAO,
            providerId = id,
            email = kakaoAccount?.get("email") as? String,
            name = profile?.get("nickname") as? String,
            profileImageUrl = profile?.get("profile_image_url") as? String
        )
    }

    private fun extractNaverUser(oAuth2User: OAuth2User): OAuthUserInfo {
        val response = oAuth2User.attributes["response"] as? Map<*, *>
            ?: throw IllegalArgumentException("Naver response is missing")

        val id = response["id"]?.toString()
            ?: throw IllegalArgumentException("Naver user id is missing")

        return OAuthUserInfo(
            provider = OAuthProvider.NAVER,
            providerId = id,
            email = response["email"] as? String,
            name = response["name"] as? String,
            profileImageUrl = response["profile_image"] as? String
        )
    }

    private fun extractGoogleUser(oAuth2User: OAuth2User): OAuthUserInfo {
        val id = oAuth2User.attributes["sub"]?.toString()
            ?: throw IllegalArgumentException("Google user id is missing")

        return OAuthUserInfo(
            provider = OAuthProvider.GOOGLE,
            providerId = id,
            email = oAuth2User.attributes["email"] as? String,
            name = oAuth2User.attributes["name"] as? String,
            profileImageUrl = oAuth2User.attributes["picture"] as? String
        )
    }
}
