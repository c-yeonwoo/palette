package kr.ai.palette.infrastructure.auth

import kr.ai.palette.domain.auth.OAuthUserInfo
import kr.ai.palette.domain.user.OAuthProvider
import kr.ai.palette.infrastructure.exception.UnsupportedOAuthProviderException
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.stereotype.Component

@Component
class OAuth2UserInfoExtractor {

    fun extract(oAuth2User: OAuth2User, registrationId: String): OAuthUserInfo {
        return when (registrationId.lowercase()) {
            "kakao" -> extractKakaoUser(oAuth2User)
            "naver" -> extractNaverUser(oAuth2User)
            "google" -> extractGoogleUser(oAuth2User)
            // Apple OAuth requires separate OIDC flow (Sign in with Apple).
            // Not yet supported — return error message for frontend to display.
            "apple" -> throw UnsupportedOAuthProviderException("apple")
            else -> throw UnsupportedOAuthProviderException(registrationId)
        }
    }

    private fun extractKakaoUser(oAuth2User: OAuth2User): OAuthUserInfo {
        val id = oAuth2User.attributes["id"]?.toString()
            ?: throw IllegalArgumentException("Kakao user id is missing")

        val kakaoAccount = oAuth2User.attributes["kakao_account"] as? Map<*, *>
            ?: throw IllegalArgumentException("Kakao account is missing")
        val profile = kakaoAccount["profile"] as? Map<*, *>

        // realName: 비즈니스 앱 심사 승인 전에는 null. NICE 본인인증 후 업데이트.
        val realName = kakaoAccount["name"] as? String

        // birthDate: 비즈니스 앱 심사 승인 전에는 null. NICE 인증 후 업데이트.
        val birthyear = kakaoAccount["birthyear"] as? String
        val birthday = kakaoAccount["birthday"] as? String
        val birthDate = if (birthyear != null && birthday != null) {
            try {
                val month = birthday.substring(0, 2).toInt()
                val day = birthday.substring(2, 4).toInt()
                java.time.LocalDate.of(birthyear.toInt(), month, day)
            } catch (e: Exception) { null }
        } else null

        val gender = kakaoAccount["gender"] as? String

        return OAuthUserInfo(
            provider = OAuthProvider.KAKAO,
            providerId = id,
            email = kakaoAccount["email"] as? String,
            name = profile?.get("nickname") as? String,
            profileImageUrl = profile?.get("profile_image_url") as? String,
            realName = realName,
            birthDate = birthDate,
            gender = gender
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
            profileImageUrl = response["profile_image"] as? String,
            realName = response["name"] as? String,
            birthDate = null,  // Naver doesn't provide birth date in standard scope
            gender = response["gender"] as? String
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
            profileImageUrl = oAuth2User.attributes["picture"] as? String,
            realName = oAuth2User.attributes["name"] as? String,
            birthDate = null,  // Google doesn't provide birth date in standard scope
            gender = null
        )
    }
}
