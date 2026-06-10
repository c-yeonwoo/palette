package kr.ai.palette.domain.matchmaker

/**
 * 주선자 등급 및 소개 요청 분배율. ADR 0038 → ADR 0044 (가격 v2) 로 재조정.
 *
 * 분배율 (commissionRate) 의 의미:
 *   소개 요청 1건(100 물감) 당 주선자에게 transfer 되는 비율.
 *   예: Lv.5 다이아 = 40% → 40 물감(4,000원) 주선자, 60 물감(6,000원) 플랫폼.
 *
 * ADR 0044 의 단가 인상(30→100 물감) 으로 절대값은 더 후해지면서도 플랫폼 마진 +170% ↑.
 */
data class MatchmakerLevel(
    val level: Int,
    val commissionRate: Double
) {
    companion object {
        /**
         * 승급 스케줄. ADR 0038 강화 (이전 0/3/6/11/21 → 0/15/40/70/150).
         * 프론트 `MATCHMAKER_TIERS` SoT 와 정합. POLICY §1.2.
         */
        fun calculateLevel(stats: MatchmakerStats): MatchmakerLevel {
            return when (stats.successfulMatches) {
                in 0..14 -> MatchmakerLevel(1, 0.15)
                in 15..39 -> MatchmakerLevel(2, 0.20)
                in 40..69 -> MatchmakerLevel(3, 0.25)
                in 70..149 -> MatchmakerLevel(4, 0.30)
                else -> MatchmakerLevel(5, 0.40)
            }
        }

        fun initial(): MatchmakerLevel {
            return MatchmakerLevel(1, 0.15)
        }
    }
}
