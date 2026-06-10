package kr.ai.palette.palettepick.domain

/**
 * 팔레트픽 다단계 점수 모델 (ADR 0047 §B.3) — 양방향 매칭 핵심.
 *
 * **4축 weighted sum (max 100)**:
 *  · mutualIdealFit (50%) — **매칭의 본질** — A·B 양방향 이상형↔자기소개 적합도 곱셈
 *  · introSimilarity (15%) — 자기소개 결 유사도
 *  · colorCompatibility (20%) — 색 궁합 (보완 90 / 유사 75 / 대비 60 / 동일 50)
 *  · momentum (15%) — 활동 모멘텀 (최근 7일 로그인·매칭 시도)
 *
 * mutualIdealFit 은 **곱셈** — 한 쪽만 적합하면(짝사랑) 페널티.
 * 다른 축은 가중 합산. LLM 단계(B.2) 점수와 별개 — orchestrator 가 결합.
 */
data class PalettePickScore(
    /** 0..1 — 상호 이상형 적합도 (cos(A.ideal,B.intro) × cos(B.ideal,A.intro), -1..1 range raw, clamp >0) */
    val mutualIdealFit: Double = 0.0,
    /** 0..1 — 자기소개 코사인 유사도 (raw cosine, clamp 0..1) */
    val introSimilarity: Double = 0.0,
    /** 0..1 — 색 궁합 정규화 (보완 0.9 / 유사 0.75 / 대비 0.6 / 동일 0.5) */
    val colorCompatibility: Double = 0.0,
    /** 0..1 — 최근 7일 활동 정규화 (로그인·매칭 시도 카운트 → tanh 등 스무딩) */
    val momentum: Double = 0.0,
) {
    /**
     * 가중 합산 (max 100).
     */
    val total: Int get() = (
        mutualIdealFit * WEIGHT_MUTUAL_IDEAL +
        introSimilarity * WEIGHT_INTRO_SIM +
        colorCompatibility * WEIGHT_COLOR +
        momentum * WEIGHT_MOMENTUM
    ).coerceIn(0.0, 100.0).toInt()

    companion object {
        const val WEIGHT_MUTUAL_IDEAL = 50.0  // 매칭의 본질
        const val WEIGHT_INTRO_SIM = 15.0
        const val WEIGHT_COLOR = 20.0
        const val WEIGHT_MOMENTUM = 15.0
    }
}
