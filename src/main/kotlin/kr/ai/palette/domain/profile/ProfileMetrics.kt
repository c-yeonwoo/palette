package kr.ai.palette.domain.profile

data class ProfileMetrics(
    val completionRate: Int,
    val trustScore: Int,
    val viewCount: Int
) {
    init {
        require(completionRate in 0..100) { "Completion rate must be between 0 and 100" }
        require(trustScore >= 0) { "Trust score must be non-negative" }
        require(viewCount >= 0) { "View count must be non-negative" }
    }

    fun incrementViewCount(): ProfileMetrics {
        return copy(viewCount = viewCount + 1)
    }

    fun updateTrustScore(newScore: Int): ProfileMetrics {
        require(newScore >= 0) { "Trust score must be non-negative" }
        return copy(trustScore = newScore)
    }

    companion object {
        fun initial(): ProfileMetrics {
            return ProfileMetrics(
                completionRate = 0,
                trustScore = 0,
                viewCount = 0
            )
        }
    }
}
