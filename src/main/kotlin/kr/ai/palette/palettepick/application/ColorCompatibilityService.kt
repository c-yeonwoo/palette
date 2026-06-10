package kr.ai.palette.palettepick.application

import kr.ai.palette.domain.profile.ColorTypeEnum
import org.springframework.stereotype.Service

/**
 * 색 궁합 점수 — 프론트엔드 `colorCompatibility.ts` 의 룰 백엔드 이식 (ADR 0047 §B.3).
 *
 * 매칭 score 의 colorCompatibility 축 (가중치 20%) — 결정적 점수.
 * 0..1 범위 정규화 (PalettePickScore.colorCompatibility 가 0..1 expects).
 *
 * - 보완색 (complementary): 0.9 — 서로 다른 에너지가 빈 곳을 채움 (예: ORANGE↔BLUE)
 * - 유사색 (analogous):     0.75 — 같은 결의 에너지 (예: ORANGE·RED·YELLOW 따뜻 계열)
 * - 동일색:                  0.50 — 같지만 너무 동일
 * - 대비색 (contrast):       0.60 — 그 외 조합, 자극·성장
 */
@Service
class ColorCompatibilityService {

    /** 0..1 정규화된 색 궁합 점수. null 색은 0.5 중립값. */
    fun score(a: ColorTypeEnum?, b: ColorTypeEnum?): Double {
        if (a == null || b == null) return 0.5
        if (a == b) return 0.5
        if (isComplementary(a, b)) return 0.9
        if (isAnalogous(a, b)) return 0.75
        return 0.6
    }

    private fun isComplementary(a: ColorTypeEnum, b: ColorTypeEnum): Boolean =
        COMPLEMENTARY_PAIRS.any { (x, y) -> (x == a && y == b) || (x == b && y == a) }

    private fun isAnalogous(a: ColorTypeEnum, b: ColorTypeEnum): Boolean =
        ANALOGOUS_GROUPS.any { group -> a in group && b in group }

    companion object {
        // 프론트 colorCompatibility.ts 와 동일 매핑 — 변경 시 양쪽 동기화 필요.
        private val COMPLEMENTARY_PAIRS: List<Pair<ColorTypeEnum, ColorTypeEnum>> = listOf(
            ColorTypeEnum.WARM_ORANGE to ColorTypeEnum.CALM_BLUE,
            ColorTypeEnum.VIBRANT_RED to ColorTypeEnum.FRESH_GREEN,
            ColorTypeEnum.SOFT_PINK to ColorTypeEnum.SOPHISTICATED_GRAY,
            ColorTypeEnum.ELEGANT_PURPLE to ColorTypeEnum.BRIGHT_YELLOW,
        )

        private val ANALOGOUS_GROUPS: List<Set<ColorTypeEnum>> = listOf(
            setOf(ColorTypeEnum.WARM_ORANGE, ColorTypeEnum.VIBRANT_RED, ColorTypeEnum.BRIGHT_YELLOW),
            setOf(ColorTypeEnum.CALM_BLUE, ColorTypeEnum.ELEGANT_PURPLE, ColorTypeEnum.FRESH_GREEN),
            setOf(ColorTypeEnum.SOFT_PINK, ColorTypeEnum.SOPHISTICATED_GRAY, ColorTypeEnum.ELEGANT_PURPLE),
        )
    }
}
