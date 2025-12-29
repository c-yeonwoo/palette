package kr.ai.palette.domain.user

data class PrivateInfo(
    val realName: String,
    val email: String?,
    val phoneNumber: String?,    // 기존 필드 (기존 사용자 호환성을 위해 nullable 유지)
    val contactInfo: ContactInfo? // 새로운 연락처 정보 (nullable for existing users)
) {
    /**
     * 연락처 정보를 업데이트합니다.
     */
    fun updateContactInfo(contactInfo: ContactInfo): PrivateInfo {
        return copy(
            phoneNumber = contactInfo.phoneNumber, // phoneNumber도 함께 업데이트
            contactInfo = contactInfo
        )
    }

    /**
     * 실제 연락처를 반환합니다.
     * contactInfo가 있으면 그것을 사용하고, 없으면 기존 phoneNumber를 사용합니다.
     */
    fun getEffectivePhoneNumber(): String? {
        return contactInfo?.phoneNumber ?: phoneNumber
    }

    /**
     * 카카오톡 ID를 반환합니다.
     */
    fun getKakaoTalkId(): String? {
        return contactInfo?.kakaoTalkId
    }
}
