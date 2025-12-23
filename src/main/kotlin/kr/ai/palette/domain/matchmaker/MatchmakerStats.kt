package kr.ai.palette.domain.matchmaker

data class MatchmakerStats(
    val totalMatchRequests: Int,
    val approvedRequests: Int,
    val rejectedRequests: Int,
    val successfulMatches: Int,
    val failedMatches: Int
) {
    fun getSuccessRate(): Double {
        val total = successfulMatches + failedMatches
        if (total == 0) return 0.0
        return successfulMatches.toDouble() / total
    }

    fun incrementTotal(): MatchmakerStats {
        return copy(totalMatchRequests = totalMatchRequests + 1)
    }

    fun incrementApproved(): MatchmakerStats {
        return copy(approvedRequests = approvedRequests + 1)
    }

    fun incrementRejected(): MatchmakerStats {
        return copy(rejectedRequests = rejectedRequests + 1)
    }

    fun incrementSuccess(): MatchmakerStats {
        return copy(successfulMatches = successfulMatches + 1)
    }

    fun incrementFailed(): MatchmakerStats {
        return copy(failedMatches = failedMatches + 1)
    }

    companion object {
        fun initial(): MatchmakerStats {
            return MatchmakerStats(
                totalMatchRequests = 0,
                approvedRequests = 0,
                rejectedRequests = 0,
                successfulMatches = 0,
                failedMatches = 0
            )
        }
    }
}
