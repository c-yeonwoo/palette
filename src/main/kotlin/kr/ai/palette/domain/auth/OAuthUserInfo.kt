package kr.ai.palette.domain.auth

import kr.ai.palette.domain.user.OAuthProvider
import java.time.LocalDate

data class OAuthUserInfo(
    val provider: OAuthProvider,
    val providerId: String,
    val email: String?,
    val name: String?,
    val profileImageUrl: String?,
    val realName: String?,  // 실명 (카카오의 name 필드)
    val birthDate: LocalDate?,  // 생년월일
    val gender: String?  // 성별 (male/female)
) {
    fun getUniqueId(): String {
        return "${provider.name}_$providerId"
    }
}
