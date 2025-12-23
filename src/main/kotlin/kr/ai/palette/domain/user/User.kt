package kr.ai.palette.domain.user

import kr.ai.palette.domain.common.UserId

data class User(
    val id: UserId,
    val oauthInfo: OAuthInfo,
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
        return !metadata.isDeleted()
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
}
