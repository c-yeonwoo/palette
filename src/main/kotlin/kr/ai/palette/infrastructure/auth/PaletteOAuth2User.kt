package kr.ai.palette.infrastructure.auth

import kr.ai.palette.domain.auth.AuthToken
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.oauth2.core.user.OAuth2User

class PaletteOAuth2User(
    private val oAuth2User: OAuth2User,
    val userId: String,
    val authToken: AuthToken,
    val isNewUser: Boolean,
    val missingRequiredFields: List<String> = emptyList()
) : OAuth2User {

    override fun getName(): String = userId

    override fun getAttributes(): MutableMap<String, Any> = oAuth2User.attributes

    override fun getAuthorities(): MutableCollection<out GrantedAuthority> = oAuth2User.authorities
}
