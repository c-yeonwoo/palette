package kr.ai.palette.domain.profile

import java.time.Instant

data class ProfileSettings(
    val isAcceptingMatches: Boolean,
    val hiddenAt: Instant?
) {
    fun isVisible(): Boolean = hiddenAt == null

    /**
     * 매칭 후보로 노출되거나 주선 요청을 받을 수 있는 상태인지.
     * (숨김 아님 + 소개/주선 받기 on) — 피드/AI시그널/주선요청에서 서버 강제 (ADR 0022).
     */
    fun canReceiveMatches(): Boolean = isVisible() && isAcceptingMatches

    fun toggleAcceptingMatches(): ProfileSettings {
        return copy(isAcceptingMatches = !isAcceptingMatches)
    }

    fun hide(): ProfileSettings {
        return copy(hiddenAt = Instant.now())
    }

    fun show(): ProfileSettings {
        return copy(hiddenAt = null)
    }

    companion object {
        fun initial(): ProfileSettings {
            return ProfileSettings(
                isAcceptingMatches = true,
                hiddenAt = null
            )
        }
    }
}
