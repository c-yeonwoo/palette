package kr.ai.palette.domain.profile

data class AttachmentProfile(
    /** 연락/관계 불안도: 0(편안) ↔ 100(불안) */
    val contactAnxiety: Int = 50,
    /** 친밀감 회피도: 0(밀착 좋아요) ↔ 100(거리감 선호) */
    val intimacyAvoidance: Int = 50,
    /** 갈등 스타일: 0(즉시 해결) ↔ 100(시간 두기) */
    val conflictStyle: Int = 50,
    /** 감정 표현: 0(솔직하게 표현) ↔ 100(속으로 삭임) */
    val emotionExpression: Int = 50,
    /** 독립성: 0(함께가 좋아요) ↔ 100(개인 공간 중요) */
    val independenceLevel: Int = 50,
) {
    val attachmentType: AttachmentType
        get() = when {
            contactAnxiety < 40 && intimacyAvoidance < 40 -> AttachmentType.SECURE
            contactAnxiety >= 60 && intimacyAvoidance < 40 -> AttachmentType.ANXIOUS
            contactAnxiety < 40 && intimacyAvoidance >= 60 -> AttachmentType.AVOIDANT
            else -> AttachmentType.DISORGANIZED
        }
}

enum class AttachmentType(val label: String, val description: String, val emoji: String) {
    SECURE("안정형", "신뢰를 바탕으로 편안하게 가까워질 수 있어요", "🌿"),
    ANXIOUS("불안형", "상대방에게 확신을 많이 구하는 편이에요", "🌊"),
    AVOIDANT("회피형", "독립성을 중요하게 여기고 거리감이 필요해요", "🦋"),
    DISORGANIZED("혼란형", "친밀함을 원하지만 동시에 두려움도 느껴요", "🌪️"),
}
