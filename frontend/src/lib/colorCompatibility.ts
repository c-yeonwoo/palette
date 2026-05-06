/**
 * Palette 색깔 궁합 시스템
 * 색깔 타입은 지인 주선 경험을 설명하는 브랜드 언어
 */

export type ColorType =
  | "WARM_ORANGE"
  | "CALM_BLUE"
  | "VIBRANT_RED"
  | "SOFT_PINK"
  | "FRESH_GREEN"
  | "ELEGANT_PURPLE"
  | "BRIGHT_YELLOW"
  | "SOPHISTICATED_GRAY";

export interface ColorMeta {
  name: string;
  hex: string;
  emoji: string;
  energy: string;         // 한 줄 에너지 설명
  personality: string;    // 성격 키워드
}

export const COLOR_META: Record<ColorType, ColorMeta> = {
  WARM_ORANGE: {
    name: "따뜻한 오렌지",
    hex: "#F97316",
    emoji: "🍊",
    energy: "따뜻함 · 외향적",
    personality: "활발하고 사교적인",
  },
  CALM_BLUE: {
    name: "차분한 블루",
    hex: "#3B82F6",
    emoji: "🌊",
    energy: "차분함 · 내향적",
    personality: "신중하고 사려 깊은",
  },
  VIBRANT_RED: {
    name: "활기찬 레드",
    hex: "#EF4444",
    emoji: "🔥",
    energy: "열정 · 강인함",
    personality: "열정적이고 추진력 있는",
  },
  SOFT_PINK: {
    name: "부드러운 핑크",
    hex: "#F9A8D4",
    emoji: "🌸",
    energy: "온화함 · 공감",
    personality: "따뜻하고 공감 능력이 높은",
  },
  FRESH_GREEN: {
    name: "싱그러운 그린",
    hex: "#22C55E",
    emoji: "🌿",
    energy: "균형 · 성장",
    personality: "안정적이고 성장을 추구하는",
  },
  ELEGANT_PURPLE: {
    name: "우아한 퍼플",
    hex: "#A855F7",
    emoji: "💜",
    energy: "깊이 · 신비로움",
    personality: "감수성이 풍부하고 독창적인",
  },
  BRIGHT_YELLOW: {
    name: "밝은 옐로",
    hex: "#EAB308",
    emoji: "☀️",
    energy: "긍정 · 활력",
    personality: "밝고 에너지 넘치는",
  },
  SOPHISTICATED_GRAY: {
    name: "세련된 그레이",
    hex: "#6B7280",
    emoji: "🩶",
    energy: "안정 · 신중함",
    personality: "침착하고 믿음직한",
  },
};

export type CompatibilityType = "complementary" | "analogous" | "contrast";

export interface CompatibilityResult {
  score: number;               // 0-100
  type: CompatibilityType;
  label: string;               // "보완색" | "유사색" | "대비색"
  tagline: string;             // 짧은 한 줄 설명
  description: string;         // 두 줄 설명
}

/** 보완색 쌍 (양방향) */
const COMPLEMENTARY_PAIRS: [ColorType, ColorType][] = [
  ["WARM_ORANGE",   "CALM_BLUE"],
  ["VIBRANT_RED",   "FRESH_GREEN"],
  ["SOFT_PINK",     "SOPHISTICATED_GRAY"],
  ["ELEGANT_PURPLE","BRIGHT_YELLOW"],
];

/** 유사색 그룹 */
const ANALOGOUS_GROUPS: ColorType[][] = [
  ["WARM_ORANGE", "VIBRANT_RED", "BRIGHT_YELLOW"],       // 따뜻한 계열
  ["CALM_BLUE", "ELEGANT_PURPLE", "FRESH_GREEN"],        // 차분한 계열
  ["SOFT_PINK", "SOPHISTICATED_GRAY", "ELEGANT_PURPLE"], // 부드러운 계열
];

function isComplementary(a: ColorType, b: ColorType): boolean {
  return COMPLEMENTARY_PAIRS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
}

function isAnalogous(a: ColorType, b: ColorType): boolean {
  return ANALOGOUS_GROUPS.some(
    (group) => group.includes(a) && group.includes(b)
  );
}

const COMPLEMENTARY_DESCRIPTIONS: Partial<Record<string, string>> = {
  "WARM_ORANGE:CALM_BLUE":
    "따뜻함과 차분함이 만나 서로의 빈 곳을 채워주는 관계예요. 오렌지의 활기가 블루의 깊이를 밝히고, 블루의 안정이 오렌지를 중심 잡아줘요.",
  "VIBRANT_RED:FRESH_GREEN":
    "열정과 균형이 만나 시너지를 만드는 관계예요. 레드의 추진력을 그린의 안정감이 단단하게 받쳐줘요.",
  "SOFT_PINK:SOPHISTICATED_GRAY":
    "온기와 신중함이 어우러지는 관계예요. 핑크의 따뜻한 공감이 그레이의 차분한 신뢰와 만나 깊어져요.",
  "ELEGANT_PURPLE:BRIGHT_YELLOW":
    "깊이와 밝음이 대조를 이루는 관계예요. 퍼플의 감수성을 옐로의 긍정 에너지가 환하게 비춰줘요.",
};

function getComplementaryDescription(a: ColorType, b: ColorType): string {
  const key = [a, b].sort().join(":");
  return COMPLEMENTARY_DESCRIPTIONS[key]
    ?? "서로 다른 에너지가 만나 조화를 이루는 관계예요. 차이가 오히려 서로를 더 풍요롭게 만들어줘요.";
}

/**
 * 두 색깔 타입 간의 궁합을 계산합니다.
 * a = 내 색깔, b = 상대 색깔
 */
export function getCompatibility(a: ColorType | null | undefined, b: ColorType | null | undefined): CompatibilityResult | null {
  if (!a || !b || a === b) return null;

  if (isComplementary(a, b)) {
    return {
      score: 85 + Math.floor(Math.random() * 11), // 85-95 (시드 없이 고정 원하면 해시 사용)
      type: "complementary",
      label: "보완색",
      tagline: "서로의 빈 곳을 채워주는 사이",
      description: getComplementaryDescription(a, b),
    };
  }

  if (isAnalogous(a, b)) {
    return {
      score: 65 + Math.floor(Math.random() * 16), // 65-80
      type: "analogous",
      label: "유사색",
      tagline: "비슷한 에너지로 편안한 사이",
      description:
        "같은 결의 에너지를 가졌어요. 함께 있으면 자연스럽고 편안한 관계가 될 거예요.",
    };
  }

  return {
    score: 50 + Math.floor(Math.random() * 16), // 50-65
    type: "contrast",
    label: "대비색",
    tagline: "서로를 자극하며 성장하는 사이",
    description:
      "예상치 못한 조합이지만, 서로에게 새로운 자극을 줄 수 있는 관계예요. 다름이 매력이 되는 사이예요.",
  };
}

/**
 * 점수를 결정론적으로 고정시키는 버전 (userId 기반 해시)
 */
export function getCompatibilityDeterministic(
  a: ColorType | null | undefined,
  b: ColorType | null | undefined,
  seed: string = ""
): CompatibilityResult | null {
  if (!a || !b || a === b) return null;

  // 간단한 해시로 seed 기반 랜덤값 생성
  let hash = 0;
  for (const ch of (a + b + seed)) {
    hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  }
  const rnd = Math.abs(hash) % 100;

  if (isComplementary(a, b)) {
    return {
      score: 85 + (rnd % 11),
      type: "complementary",
      label: "보완색",
      tagline: "서로의 빈 곳을 채워주는 사이",
      description: getComplementaryDescription(a, b),
    };
  }

  if (isAnalogous(a, b)) {
    return {
      score: 65 + (rnd % 16),
      type: "analogous",
      label: "유사색",
      tagline: "비슷한 에너지로 편안한 사이",
      description:
        "같은 결의 에너지를 가졌어요. 함께 있으면 자연스럽고 편안한 관계가 될 거예요.",
    };
  }

  return {
    score: 50 + (rnd % 16),
    type: "contrast",
    label: "대비색",
    tagline: "서로를 자극하며 성장하는 사이",
    description:
      "예상치 못한 조합이지만, 서로에게 새로운 자극을 줄 수 있는 관계예요. 다름이 매력이 되는 사이예요.",
  };
}

/** 궁합 타입별 강조 색상 (Tailwind 클래스) */
export const COMPAT_STYLE: Record<CompatibilityType, { bg: string; text: string; border: string }> = {
  complementary: { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200" },
  analogous:     { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  contrast:      { bg: "bg-slate-50",  text: "text-slate-600",  border: "border-slate-200" },
};
