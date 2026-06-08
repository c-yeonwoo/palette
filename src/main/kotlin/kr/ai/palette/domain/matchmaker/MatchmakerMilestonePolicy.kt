package kr.ai.palette.domain.matchmaker

/**
 * 주선자 마일스톤 보너스 정책. ADR 0041 / B-003.
 *
 * 성사 누계가 임계값에 도달하면 1회성 보너스 포인트 지급.
 * 등급별 커미션(ADR 0038)과 별개 — 초기 활성도 부양 목적.
 *
 *  · 1건 첫 매칭 →  +500P
 *  · 5건       → +2,000P
 *  · 10건      → +5,000P
 *  · 20건      → +10,000P
 *  · 50건      → +25,000P
 *  · 100건     → +50,000P
 *  · 150건 (다이아 도달) → +100,000P
 *
 * 추가로 신규 친구가 가입할 때마다 +200P (별도 hook, B-002 와 호환).
 */
object MatchmakerMilestonePolicy {

    private val MILESTONES: Map<Int, Int> = mapOf(
        1   to     500,
        5   to   2_000,
        10  to   5_000,
        20  to  10_000,
        50  to  25_000,
        100 to  50_000,
        150 to 100_000,
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
