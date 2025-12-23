package kr.ai.palette.domain.auth

import kr.ai.palette.domain.user.OAuthProvider

data class OAuthUserInfo(
    val provider: OAuthProvider,
    val providerId: String,
    val email: String?,
    val name: String?,
    val profileImageUrl: String?
) {
    fun getUniqueId(): String {
        return "${provider.name}_$providerId"
    }
}
