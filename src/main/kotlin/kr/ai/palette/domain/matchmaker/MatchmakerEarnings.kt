package kr.ai.palette.domain.matchmaker

data class MatchmakerEarnings(
    val totalPoints: Int,
    val withdrawnPoints: Int,
    val pendingPoints: Int
) {
    fun getAvailablePoints(): Int {
        return totalPoints - withdrawnPoints - pendingPoints
    }

    fun addReward(points: Int): MatchmakerEarnings {
        return copy(totalPoints = totalPoints + points)
    }

    fun withdraw(points: Int): MatchmakerEarnings {
        require(getAvailablePoints() >= points) { "출금 가능 포인트가 부족합니다" }
        return copy(withdrawnPoints = withdrawnPoints + points)
    }

    companion object {
        fun initial(): MatchmakerEarnings {
            return MatchmakerEarnings(
                totalPoints = 0,
                withdrawnPoints = 0,
                pendingPoints = 0
            )
        }
    }
}
