package kr.ai.palette.domain.matchmaker

data class MatchmakerLevel(
    val level: Int,
    val commissionRate: Double
) {
    companion object {
        fun calculateLevel(stats: MatchmakerStats): MatchmakerLevel {
            return when (stats.successfulMatches) {
                in 0..2 -> MatchmakerLevel(1, 0.30)
                in 3..5 -> MatchmakerLevel(2, 0.35)
                in 6..10 -> MatchmakerLevel(3, 0.40)
                in 11..20 -> MatchmakerLevel(4, 0.45)
                else -> MatchmakerLevel(5, 0.50)
            }
        }

        fun initial(): MatchmakerLevel {
            return MatchmakerLevel(1, 0.30)
        }
    }
}
