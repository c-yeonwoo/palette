package kr.ai.palette.domain.user

import kr.ai.palette.domain.common.UserId

data class User(
    val id: UserId,
    val oauthInfo: OAuthInfo?,  // nullable for email-based users
    val password: String?,  // nullable for OAuth users, BCrypt hashed for email users
    val privateInfo: PrivateInfo,
    val publicInfo: PublicInfo,
    val accountType: AccountType,
    val isProfileCompleted: Boolean,
    val termsAgreement: TermsAgreement,
    val metadata: UserMetadata
) {
    fun canUseMatchingService(): Boolean {
        return accountType == AccountType.REGULAR && isProfileCompleted && !metadata.isDeleted()
    }

    fun canBeMatchmaker(): Boolean {
        // 주선자는 핸드폰 인증이 필수
        return !metadata.isDeleted() && privateInfo.isPhoneVerified
    }

    fun completeProfile(): User {
        require(accountType == AccountType.REGULAR) { "Only REGULAR users can complete profile" }
        return copy(isProfileCompleted = true)
    }

    fun updatePublicInfo(publicInfo: PublicInfo): User {
        return copy(publicInfo = publicInfo)
    }

    fun updatePrivateInfo(privateInfo: PrivateInfo): User {
        return copy(privateInfo = privateInfo)
    }

    fun updateLogin(): User {
        return copy(metadata = metadata.updateLogin())
    }

    fun delete(): User {
        return copy(metadata = metadata.delete())
    }

    fun verifyPhone(): User {
        return copy(privateInfo = privateInfo.verifyPhone())
    }
}
