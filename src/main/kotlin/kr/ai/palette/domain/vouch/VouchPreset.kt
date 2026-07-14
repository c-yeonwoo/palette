package kr.ai.palette.domain.vouch

/**
 * 친구 보증 프리셋 칩 (L1). L0 = preset 없이 원탭 보증, L2 = optional message.
 */
enum class VouchPreset(val label: String) {
    EASYGOING("같이 있으면 편해요"),
    CARING("사람을 잘 챙겨요"),
    GOOD_CHAT("대화가 잘 통해요"),
    WORTH_INTRO("소개해줘도 될 사람이에요"),
    SERIOUS("진지해요");

    companion object {
        fun fromKey(key: String?): VouchPreset? =
            key?.trim()?.takeIf { it.isNotEmpty() }?.let { runCatching { valueOf(it) }.getOrNull() }
    }
}
