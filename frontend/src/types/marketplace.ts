/**
 * marketplace.ts — 주선자 마켓플레이스 관련 타입 정의
 * (이전 mock-marketplace.ts 에서 타입만 추출)
 */

import type { ColorTypeKey } from "./match";

export type MatchmakerLevel = 1 | 2 | 3 | 4 | 5;

export interface MarketplaceMatchmaker {
  id: string;
  nickname: string;
  colorType: ColorTypeKey;
  level: MatchmakerLevel;
  commissionRate: number;
  successfulMatches: number;
  totalRequests: number;
  averageRating: number;
  totalReviews: number;
  bio: string;
  specialties: string[];
  lastActiveAt: string;
  accepting: boolean;
}

export const LEVEL_META: Record<MatchmakerLevel, { name: string; emoji: string }> = {
  1: { name: "씨앗", emoji: "🌱" },
  2: { name: "새싹", emoji: "🌿" },
  3: { name: "꽃", emoji: "🌸" },
  4: { name: "나무", emoji: "🌳" },
  5: { name: "숲", emoji: "🌲" },
};

export const SPECIALTY_FILTER_OPTIONS = [
  "IT/개발", "금융/보험", "의료", "교육", "공무원", "전문직",
  "20대", "30대", "40대이상",
  "서울", "경기", "지방",
  "결혼목적", "진지한연애", "자연스럽게",
];
