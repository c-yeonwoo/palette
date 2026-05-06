/**
 * match-score.ts — F01 궁합 점수 계산
 *
 * 현재는 mock 가중합 로직.
 * 추후 `/api/v1/matches/{id}/score` 응답으로 대체 가능하게
 * 인터페이스만 깔끔히 유지.
 *
 * 사용:
 *   import { calculateMatchScore } from "@/lib/match-score";
 *   const { score, label, details } = calculateMatchScore(me, partner);
 */
import { getCompatibilityScore, type ColorTypeKey } from "./colorTypes";

export interface ScoreInput {
  colorType: ColorTypeKey | string;
  mbti?: string;
  location?: string;
  smoking?: string;
  drinking?: string;
  religion?: string;
  interests?: string[];
}

export interface ScoreResult {
  score: number;         // 0-100
  label: string;        // "보색 시너지" | "유사 매칭" | "개성 충돌" | "흥미로운 조합"
  breakdown: {
    colorScore: number;
    lifestyleScore: number;
    locationScore: number;
  };
}

/** MBTI 보완도 (E↔I, N↔S, T↔F, J↔P) */
function mbtiScore(a?: string, b?: string): number {
  if (!a || !b || a.length !== 4 || b.length !== 4) return 50;
  let diff = 0;
  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i]) diff++;
  }
  // 2~3자 차이가 가장 보완적
  if (diff === 2 || diff === 3) return 85;
  if (diff === 4) return 70; // 완전 반대
  if (diff === 1) return 75;
  return 60; // 동일 MBTI
}

/** 라이프스타일 일치도 */
function lifestyleScore(a: ScoreInput, b: ScoreInput): number {
  let score = 60;
  if (a.smoking === b.smoking) score += 15;
  if (a.religion === b.religion) score += 10;
  // 음주 편차 —  "안마심"/"가끔"은 1단계, "가끔"/"자주"는 1단계
  const drinkOrder = ["안마심", "비흡연", "가끔", "자주"];
  const ai = drinkOrder.indexOf(a.drinking ?? "");
  const bi = drinkOrder.indexOf(b.drinking ?? "");
  if (ai !== -1 && bi !== -1) {
    const delta = Math.abs(ai - bi);
    score += delta === 0 ? 15 : delta === 1 ? 8 : 0;
  }
  return Math.min(score, 100);
}

/** 동네 일치도 */
function locationScore(a?: string, b?: string): number {
  if (!a || !b) return 50;
  const aTokens = a.split(" ");
  const bTokens = b.split(" ");
  // 구 단위 일치
  if (aTokens[1] && bTokens[1] && aTokens[1] === bTokens[1]) return 100;
  // 시 단위 일치
  if (aTokens[0] && bTokens[0] && aTokens[0] === bTokens[0]) return 75;
  return 50;
}

function scoreToLabel(score: number, colorScore: number): string {
  // 컬러 보색이면 특별 라벨
  if (colorScore >= 90 && score >= 80) return "보색 시너지";
  if (colorScore >= 80 && score >= 75) return "유사 매칭";
  if (score >= 85) return "최고의 조합";
  if (score >= 75) return "잘 어울려요";
  if (score >= 65) return "흥미로운 조합";
  return "개성 충돌";
}

export function calculateMatchScore(a: ScoreInput, b: ScoreInput): ScoreResult {
  const colorScore = getCompatibilityScore(
    a.colorType as ColorTypeKey,
    b.colorType as ColorTypeKey,
  );
  const lifestyle = lifestyleScore(a, b);
  const location = locationScore(a.location, b.location);
  const mbti = mbtiScore(a.mbti, b.mbti);

  // 가중합: 색 30%, 라이프스타일 30%, MBTI 25%, 지역 15%
  const score = Math.round(
    colorScore * 0.30 +
    lifestyle  * 0.30 +
    mbti       * 0.25 +
    location   * 0.15,
  );

  return {
    score: Math.min(Math.max(score, 0), 100),
    label: scoreToLabel(score, colorScore),
    breakdown: {
      colorScore,
      lifestyleScore: lifestyle,
      locationScore: location,
    },
  };
}
