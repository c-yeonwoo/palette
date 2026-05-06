/**
 * Palette — Color Type 진단 채점 로직
 *
 * 응답 맵(questionId → 선택된 보기 인덱스 0~3)을 받아
 * 4개 차원 평균 점수를 구하고, 유클리드 거리로 가장 가까운 컬러 타입을 반환합니다.
 *
 * 아키타입 벡터 (EI, FT, SN, AP):
 *   orange: [0.95, 0.90, 0.80, 0.90]  — 외향·감성·모험·능동
 *   pink:   [0.85, 0.95, 0.20, 0.25]  — 외향·감성·안정·수용
 *   yellow: [0.90, 0.85, 0.70, 0.40]  — 외향·감성·모험·중간
 *   red:    [0.90, 0.15, 0.85, 0.95]  — 외향·이성·모험·능동
 *   blue:   [0.10, 0.15, 0.25, 0.30]  — 내향·이성·안정·수용
 *   gray:   [0.20, 0.20, 0.20, 0.80]  — 내향·이성·안정·능동
 *   green:  [0.20, 0.90, 0.25, 0.25]  — 내향·감성·안정·수용
 *   purple: [0.30, 0.80, 0.90, 0.70]  — 내향·감성·모험·능동
 */

import type { ColorTypeKey } from "../colorTypes";
import { QUESTIONS } from "./questions";

/** 4개 차원 점수 (각 0~1 범위의 평균) */
export interface DimensionScores {
  /** 외향(1) ↔ 내향(0) */
  EI: number;
  /** 감성(1) ↔ 이성(0) */
  FT: number;
  /** 모험(1) ↔ 안정(0) */
  SN: number;
  /** 능동(1) ↔ 수용(0) */
  AP: number;
}

/**
 * 응답 맵에서 4개 차원의 평균 점수를 계산합니다.
 *
 * @param answers - { [questionId]: selectedOptionIndex (0~3) }
 * @returns 차원별 0~1 평균 점수
 */
export function calculateDimensionScores(
  answers: Record<number, number>,
): DimensionScores {
  const sums: Record<string, number> = { EI: 0, FT: 0, SN: 0, AP: 0 };
  const counts: Record<string, number> = { EI: 0, FT: 0, SN: 0, AP: 0 };

  for (const question of QUESTIONS) {
    const selectedIndex = answers[question.id];
    if (selectedIndex === undefined) continue;

    const option = question.options[selectedIndex];
    if (!option) continue;

    sums[question.dimension] += option.score;
    counts[question.dimension]++;
  }

  return {
    EI: counts.EI > 0 ? sums.EI / counts.EI : 0.5,
    FT: counts.FT > 0 ? sums.FT / counts.FT : 0.5,
    SN: counts.SN > 0 ? sums.SN / counts.SN : 0.5,
    AP: counts.AP > 0 ? sums.AP / counts.AP : 0.5,
  };
}

/** 8가지 컬러 타입 아키타입 벡터 [EI, FT, SN, AP] */
const ARCHETYPES: Record<ColorTypeKey, [number, number, number, number]> = {
  orange: [0.95, 0.90, 0.80, 0.90],
  pink:   [0.85, 0.95, 0.20, 0.25],
  yellow: [0.90, 0.85, 0.70, 0.40],
  red:    [0.90, 0.15, 0.85, 0.95],
  blue:   [0.10, 0.15, 0.25, 0.30],
  gray:   [0.20, 0.20, 0.20, 0.80],
  green:  [0.20, 0.90, 0.25, 0.25],
  purple: [0.30, 0.80, 0.90, 0.70],
};

/**
 * 유클리드 거리가 최소인 컬러 타입을 반환합니다.
 *
 * @param scores - calculateDimensionScores()의 반환값
 * @returns 가장 가까운 ColorTypeKey
 */
export function scoreToColorType(scores: DimensionScores): ColorTypeKey {
  const userVec: [number, number, number, number] = [
    scores.EI,
    scores.FT,
    scores.SN,
    scores.AP,
  ];

  let minDist = Infinity;
  let result: ColorTypeKey = "orange";

  for (const [key, archetype] of Object.entries(ARCHETYPES) as [
    ColorTypeKey,
    [number, number, number, number],
  ][]) {
    const dist = Math.sqrt(
      archetype.reduce(
        (sum, val, i) => sum + Math.pow(val - userVec[i], 2),
        0,
      ),
    );

    if (dist < minDist) {
      minDist = dist;
      result = key;
    }
  }

  return result;
}
