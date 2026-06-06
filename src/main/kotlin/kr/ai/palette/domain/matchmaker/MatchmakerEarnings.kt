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

    /**
     * 플랫폼 내 포인트 사용 (예: 연결 제안/Nudge 50P).
     * 출금(withdraw)과 달리 잔액을 직접 소진하므로 totalPoints 에서 차감한다.
     * 레벨은 성사 건수 기반이라 totalPoints 차감이 등급에 영향을 주지 않는다.
     */
    fun spend(points: Int): MatchmakerEarnings {
        require(points > 0) { "사용 포인트는 0보다 커야 합니다" }
        require(getAvailablePoints() >= points) { "포인트가 부족합니다" }
        return copy(totalPoints = totalPoints - points)
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
