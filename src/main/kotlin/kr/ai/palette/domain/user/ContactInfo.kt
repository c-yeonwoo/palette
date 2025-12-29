package kr.ai.palette.domain.user

/**
 * 사용자 연락처 정보
 * 매칭 성사 시 교환되는 연락처 정보를 포함합니다.
 */
data class ContactInfo(
    val phoneNumber: String,                   // 핸드폰 번호 (필수)
    val kakaoTalkId: String?,                  // 카카오톡 ID (선택)
    val preferredContactMethod: ContactMethod? // 선호하는 연락 수단 (선택)
) {
    companion object {
        fun create(phoneNumber: String, kakaoTalkId: String? = null): ContactInfo {
            require(phoneNumber.isNotBlank()) {
                "핸드폰 번호는 필수입니다"
            }
            return ContactInfo(
                phoneNumber = phoneNumber,
                kakaoTalkId = kakaoTalkId,
                preferredContactMethod = if (kakaoTalkId != null) ContactMethod.KAKAOTALK else ContactMethod.PHONE
            )
        }
    }

    /**
     * 카카오톡 ID를 업데이트합니다.
     */
    fun updateKakaoTalkId(kakaoTalkId: String?): ContactInfo {
        return copy(
            kakaoTalkId = kakaoTalkId,
            preferredContactMethod = if (kakaoTalkId != null) ContactMethod.KAKAOTALK else ContactMethod.PHONE
        )
    }

    /**
     * 선호하는 연락 수단을 변경합니다.
     */
    fun updatePreferredContactMethod(method: ContactMethod): ContactInfo {
        return copy(preferredContactMethod = method)
    }
}

/**
 * 연락 수단
 */
enum class ContactMethod {
    KAKAOTALK,  // 카카오톡
    PHONE       // 전화번호
}
