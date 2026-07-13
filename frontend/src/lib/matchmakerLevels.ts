/**
 * 주선자 등급 — 단일 소스 (Single Source of Truth)
 *
 * 이전엔 ConnectorDashboard / MatchmakerRewardScreen / MatchmakerPublicProfileScreen /
 * mock-marketplace / DesignSystemScreen 5곳에 제각각 정의돼 이름·순서가 어긋나 있었다.
 * 모든 화면은 이 파일만 참조한다.
 *
 * 등급: 브론즈 → 실버 → 골드 → 플래티넘 → 다이아몬드
 * 성사 건수 구간 / 커미션율은 정책값(ADR 참고).
 */

import { Medal, Gem, Crown, type LucideIcon } from "lucide-react";

export type MatchmakerLevel = 1 | 2 | 3 | 4 | 5;

export interface MatchmakerTier {
  level: MatchmakerLevel;
  name: string;          // 등급명
  Icon: LucideIcon;      // 등급 상징 (lucide — 브랜드 v2, 이모지 대체)
  commission: number;    // 커미션율 (%)
  minMatches: number;    // 진입 성사 건수
  maxMatches: number;    // 구간 상한 (최고 등급은 Infinity)
  color: string;         // 등급 식별 색 (데이터값 · 아이콘 색으로도 사용)
}

export const MATCHMAKER_TIERS: Record<MatchmakerLevel, MatchmakerTier> = {
  1: { level: 1, name: "브론즈",     Icon: Medal, commission: 15, minMatches: 0,   maxMatches: 14,                      color: "#B87333" },
  2: { level: 2, name: "실버",       Icon: Medal, commission: 20, minMatches: 15,  maxMatches: 39,                      color: "#9AA3AE" },
  3: { level: 3, name: "골드",       Icon: Medal, commission: 25, minMatches: 40,  maxMatches: 69,                      color: "#C79A3A" },
  4: { level: 4, name: "플래티넘",   Icon: Gem,   commission: 30, minMatches: 70,  maxMatches: 149,                     color: "#6E8CA0" },
  5: { level: 5, name: "다이아몬드", Icon: Crown, commission: 40, minMatches: 150, maxMatches: Number.POSITIVE_INFINITY, color: "#45B6CC" },
};

/** 1~5 순서 배열 */
export const MATCHMAKER_TIER_LIST: MatchmakerTier[] =
  [1, 2, 3, 4, 5].map((l) => MATCHMAKER_TIERS[l as MatchmakerLevel]);

/** 레벨 번호 → 등급 (범위 밖이면 클램프) */
export function tierFor(level: number): MatchmakerTier {
  const l = Math.min(Math.max(Math.round(level || 1), 1), 5) as MatchmakerLevel;
  return MATCHMAKER_TIERS[l];
}

/** 다음 등급 (최고 등급이면 null) */
export function nextTier(level: number): MatchmakerTier | null {
  const l = Math.round(level || 1);
  return l >= 5 ? null : MATCHMAKER_TIERS[(l + 1) as MatchmakerLevel];
}
