package kr.ai.palette.domain.profile

import java.time.Instant

data class ProfileSettings(
    val isAcceptingMatches: Boolean,
    val hiddenAt: Instant?
) {
    fun isVisible(): Boolean = hiddenAt == null

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
