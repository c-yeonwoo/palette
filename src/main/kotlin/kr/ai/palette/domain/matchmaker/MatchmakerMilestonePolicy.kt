package kr.ai.palette.domain.matchmaker

/**
 * 주선자 마일스톤 보너스 정책. ADR 0041 / 0042.
 *
 * 성사 누계가 임계값에 도달하면 1회성 보너스 지급 (물감 단위, 1 물감 = 100원).
 * 등급별 커미션(ADR 0038)과 별개 — 초기 활성도 부양 목적.
 *
 *  · 1건 첫 매칭 →  +5 물감
 *  · 5건       → +20 물감
 *  · 10건      → +50 물감
 *  · 20건      → +100 물감
 *  · 50건      → +250 물감
 *  · 100건     → +500 물감
 *  · 150건 (다이아 도달) → +1,000 물감
 */
object MatchmakerMilestonePolicy {

    private val MILESTONES: Map<Int, Int> = mapOf(
        1   to      5,
        5   to     20,
        10  to     50,
        20  to    100,
        50  to    250,
        100 to    500,
        150 to  1_000,
    )

    /**
     * [successfulMatches] 가 마일스톤 임계값에 정확히 도달했을 때 지급할 포인트.
     * 임계값 아니면 0 — 단순 호출자가 if(>0) 로 분기.
     */
    fun bonusFor(successfulMatches: Int): Int = MILESTONES[successfulMatches] ?: 0

    /** 마일스톤 라벨 (알림 본문용). */
    fun labelFor(successfulMatches: Int): String = when (successfulMatches) {
        1   -> "첫 매칭"
        5   -> "5건 달성"
        10  -> "10건 달성"
        20  -> "20건 달성"
        50  -> "50건 달성"
        100 -> "100건 달성"
        150 -> "다이아몬드 등급 도달"
        else -> "$successfulMatches 건 달성"
    }
}
