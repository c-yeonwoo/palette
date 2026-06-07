/**
 * 데이트 코드 — 두 축으로 사람을 좌표화.
 *
 * x축: ENERGY      — 0(차분/내향) ──── 100(활동/외향)
 * y축: PLANNING    — 0(즉흥/유연) ──── 100(계획/안정)
 *
 * Phase C에서 LLM이 산출하도록 확장 가능. 현재는 ColorType별 정적 매핑(인사이트
 * 카드의 시각화 용도). 색 정체성과 직관적으로 연결돼 한 단계 unlock 가치가 있음.
 *
 * ADR 0037 — 인사이트 점진 공개.
 */

import type { ColorType } from "./colorCompatibility";

export interface DateCode {
  energy: number;     // 0 차분 ~ 100 활동
  planning: number;   // 0 즉흥 ~ 100 계획
  label: string;      // 사분면 라벨
  vibe: string;       // 한 줄 설명 (데이트 톤)
}

const QUADRANT_LABEL = (energy: number, planning: number): { label: string; vibe: string } => {
  // 4 사분면 ± 중앙 라벨링
  if (energy >= 50 && planning >= 50) return { label: "활기찬 큐레이터", vibe: "에너지 있고 계획적인 데이트를 좋아해요" };
  if (energy >= 50 && planning <  50) return { label: "즉흥 어드벤처러", vibe: "함께 떠나는 즉흥 모험이 즐거워요" };
  if (energy <  50 && planning >= 50) return { label: "차분한 설계자",   vibe: "차분하고 정성스럽게 준비한 시간을 좋아해요" };
  return { label: "유연한 사색가", vibe: "흐름에 맡기며 깊은 대화를 즐겨요" };
};

const RAW: Record<ColorType, { energy: number; planning: number }> = {
  WARM_ORANGE:        { energy: 78, planning: 55 }, // 활동·중간 계획
  CALM_BLUE:          { energy: 32, planning: 78 }, // 차분·계획
  VIBRANT_RED:        { energy: 88, planning: 40 }, // 활동·즉흥
  SOFT_PINK:          { energy: 45, planning: 60 }, // 중간·약간 계획
  FRESH_GREEN:        { energy: 55, planning: 38 }, // 중간·즉흥
  ELEGANT_PURPLE:     { energy: 38, planning: 65 }, // 차분·계획
  BRIGHT_YELLOW:      { energy: 82, planning: 30 }, // 활동·즉흥
  SOPHISTICATED_GRAY: { energy: 40, planning: 85 }, // 차분·매우 계획
};

export function dateCodeFor(colorType: ColorType | null | undefined): DateCode | null {
  if (!colorType) return null;
  const raw = RAW[colorType];
  if (!raw) return null;
  const { label, vibe } = QUADRANT_LABEL(raw.energy, raw.planning);
  return { ...raw, label, vibe };
}
