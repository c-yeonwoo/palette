package kr.ai.palette.palettepick.domain

/**
 * 팔레트픽 다단계 점수 모델 (ADR 0047 §B.3).
 *
 * Stage 2 의 결정적 점수 — DB 만 사용, LLM 미호출.
 *  · color: 색 궁합 (보완 90 / 유사 75 / 대비 60 / 동일 50)
 *  · interests: 관심사 자카드 유사도 × 30
 *  · momentum: 최근 7일 활동 (로그인·매칭 시도) × 20
 *  · lifestyle: 음주·운동·종교 매치 × 20
 *
 * total = color + interests + momentum + lifestyle (max 160)
 * Stage 3 의 LLM 점수와 별개 — 둘이 조합되어 최종 랭킹.
 */
data class PalettePickScore(
    val color: Int = 0,
    val interests: Int = 0,
    val momentum: Int = 0,
    val lifestyle: Int = 0,
) {
    val total: Int get() = color + interests + momentum + lifestyle

    companion object {
        const val MAX_COLOR = 90
        const val MAX_INTERESTS = 30
        const val MAX_MOMENTUM = 20
        const val MAX_LIFESTYLE = 20
        const val MAX_TOTAL = MAX_COLOR + MAX_INTERESTS + MAX_MOMENTUM + MAX_LIFESTYLE
    }
}
