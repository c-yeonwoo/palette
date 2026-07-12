/**
 * Palette — Color Type 정의
 *
 * 8가지 색깔 메타포로 유저의 개성을 표현합니다.
 * 각 타입은 P1에서 정의한 --ct-* 토큰과 1:1 대응합니다.
 *
 * 사용:
 *   import { COLOR_TYPES, getColorTypeMeta } from "@/lib/colorTypes";
 */

import type { ColorType } from "./colorCompatibility";

export type ColorTypeKey =
  | "orange"
  | "blue"
  | "red"
  | "pink"
  | "green"
  | "purple"
  | "yellow"
  | "gray";

/**
 * 백엔드 enum(UPPERCASE, colorCompatibility.ts 의 ColorType) → CSS 토큰 키(lowercase) 매핑.
 * 단일 정의처 — 각 화면이 자체적으로 매핑 테이블을 재구현하지 않도록 여기서만 관리한다.
 */
export const UPPER_TO_KEY: Record<ColorType, ColorTypeKey> = {
  WARM_ORANGE: "orange",
  CALM_BLUE: "blue",
  VIBRANT_RED: "red",
  SOFT_PINK: "pink",
  FRESH_GREEN: "green",
  ELEGANT_PURPLE: "purple",
  BRIGHT_YELLOW: "yellow",
  SOPHISTICATED_GRAY: "gray",
};

/** UPPER_TO_KEY 의 역방향 (lowercase → 백엔드 enum). 궁합 계산 등 UPPERCASE 알고리즘에 넘길 때 사용. */
export const KEY_TO_UPPER: Record<ColorTypeKey, ColorType> = Object.fromEntries(
  Object.entries(UPPER_TO_KEY).map(([upper, key]) => [key, upper as ColorType])
) as Record<ColorTypeKey, ColorType>;

/** 백엔드 enum 값 또는 이미 lowercase 키인 값을 모두 받아 CSS 토큰 키로 정규화. 없으면 "orange" fallback. */
export function keyFromColorType(type: ColorType | ColorTypeKey | string | null | undefined): ColorTypeKey {
  if (!type) return "orange";
  if (type in UPPER_TO_KEY) return UPPER_TO_KEY[type as ColorType];
  if ((type as string).toLowerCase() in COLOR_TYPE_KEYS) return type as ColorTypeKey;
  return "orange";
}

const COLOR_TYPE_KEYS = new Set<string>([
  "orange", "blue", "red", "pink", "green", "purple", "yellow", "gray",
]);

export interface ColorTypeMeta {
  key: ColorTypeKey;
  /** 한국어 표시명 */
  label: string;
  /** 유저에게 보여줄 짧은 설명 */
  description: string;
  /** 성격 키워드 3개 */
  keywords: [string, string, string];
  /** P1 CSS 변수에서 추출한 HSL H값 */
  h: number;
  /** P1 CSS 변수에서 추출한 HSL S값 (%, 숫자만) */
  s: number;
  /** P1 CSS 변수에서 추출한 HSL L값 (%, 숫자만) — 500 shade 기준 */
  l: number;
  /** Tailwind bg 유틸리티 (500 shade) — @theme inline에 노출된 값 */
  bgClass: string;
  /** Tailwind text 유틸리티 (700 shade) */
  textClass: string;
  /** Tailwind bg 유틸리티 (50 shade) — soft background */
  softBgClass: string;
}

export const COLOR_TYPES: Record<ColorTypeKey, ColorTypeMeta> = {
  orange: {
    key: "orange",
    label: "오렌지",
    description: "열정적이고 에너지 넘치는",
    keywords: ["열정", "긍정", "활력"],
    h: 22, s: 92, l: 56,
    bgClass: "bg-ct-orange-500",
    textClass: "text-ct-orange-700",
    softBgClass: "bg-ct-orange-50",
  },
  blue: {
    key: "blue",
    label: "블루",
    description: "차분하고 신뢰감을 주는",
    keywords: ["신뢰", "안정", "지성"],
    h: 212, s: 78, l: 56,
    bgClass: "bg-ct-blue-500",
    textClass: "text-ct-blue-700",
    softBgClass: "bg-ct-blue-50",
  },
  red: {
    key: "red",
    label: "레드",
    description: "강렬하고 주도적인",
    keywords: ["추진력", "용기", "강렬함"],
    h: 4, s: 78, l: 58,
    bgClass: "bg-ct-red-500",
    textClass: "text-ct-red-700",
    softBgClass: "bg-ct-red-50",
  },
  pink: {
    key: "pink",
    label: "핑크",
    description: "따뜻하고 감성적인",
    keywords: ["따뜻함", "감성", "배려"],
    h: 340, s: 80, l: 66,
    bgClass: "bg-ct-pink-500",
    textClass: "text-ct-pink-700",
    softBgClass: "bg-ct-pink-50",
  },
  green: {
    key: "green",
    label: "그린",
    description: "균형 잡히고 성장 지향적인",
    keywords: ["균형", "성장", "자연스러움"],
    h: 152, s: 52, l: 46,
    bgClass: "bg-ct-green-500",
    textClass: "text-ct-green-700",
    softBgClass: "bg-ct-green-50",
  },
  purple: {
    key: "purple",
    label: "퍼플",
    description: "창의적이고 독창적인",
    keywords: ["창의성", "독창성", "신비로움"],
    h: 268, s: 56, l: 60,
    bgClass: "bg-ct-purple-500",
    textClass: "text-ct-purple-700",
    softBgClass: "bg-ct-purple-50",
  },
  yellow: {
    key: "yellow",
    label: "옐로우",
    description: "밝고 유쾌한",
    keywords: ["밝음", "유쾌함", "호기심"],
    h: 42, s: 92, l: 56,
    bgClass: "bg-ct-yellow-500",
    textClass: "text-ct-yellow-700",
    softBgClass: "bg-ct-yellow-50",
  },
  gray: {
    key: "gray",
    label: "그레이",
    description: "세련되고 실용적인",
    keywords: ["세련됨", "실용성", "차분함"],
    h: 220, s: 8, l: 48,
    bgClass: "bg-ct-gray-500",
    textClass: "text-ct-gray-700",
    softBgClass: "bg-ct-gray-50",
  },
};

export function getColorTypeMeta(key: ColorTypeKey | string | null | undefined): ColorTypeMeta {
  if (key && key in COLOR_TYPES) {
    return COLOR_TYPES[key as ColorTypeKey];
  }
  return COLOR_TYPES.orange; // fallback
}

