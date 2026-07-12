package kr.ai.palette.domain.profile

import java.time.Instant

data class ProfileSettings(
    val isAcceptingMatches: Boolean,
    val hiddenAt: Instant?,
    /** 내 지인(1촌)에게도 상세(소개글·성향·이상형)를 공개할지. 기본 false = 핵심정보만 공개 (ADR 0035) */
    val detailsVisibleToFriends: Boolean = false,
    /**
     * 지인 네트워크 밖의 사용자에게도 콜드스타트 공개 발견 풀에서 노출될지 (ADR 0072).
     * 기본 true — 초기 풀 유동성. isAcceptingMatches 와 별개(지인 매칭은 받되 공개 노출만 끄는 조합 허용).
     * OFF 여도 지인 티어(2촌)에는 계속 노출 — 신뢰망은 유지.
     */
    val publicDiscoverable: Boolean = true
) {
    fun isVisible(): Boolean = hiddenAt == null

    /**
     * 매칭 후보로 노출되거나 주선 요청을 받을 수 있는 상태인지.
     * (숨김 아님 + 소개/주선 받기 on) — 피드/AI시그널/주선요청에서 서버 강제 (ADR 0022).
     */
    fun canReceiveMatches(): Boolean = isVisible() && isAcceptingMatches

    /**
     * 콜드스타트 공개 발견 풀 후보로 노출 가능한지 (ADR 0072).
     * 매칭 받기 가능 + 공개 노출 opt-in.
     */
    fun canAppearInPublicPool(): Boolean = canReceiveMatches() && publicDiscoverable

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
                hiddenAt = null,
                publicDiscoverable = true
            )
        }
    }
}
