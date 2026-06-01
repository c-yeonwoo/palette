/**
 * match.ts — 매칭 관련 타입 정의
 * (이전 mock-matches.ts 에서 타입만 추출)
 */

export type ColorTypeKey =
  | "orange"
  | "blue"
  | "red"
  | "pink"
  | "green"
  | "purple"
  | "yellow"
  | "gray";

export type MatchmakerTier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface MatchmakerInfo {
  id: string;
  name: string;
  tier: MatchmakerTier;
  avatarUrl?: string;
  successCount: number;
  comment: string; // 주선 한마디
}

export interface MatchProfile {
  userId: string;
  name: string;
  age: number;
  location: string;
  colorType: ColorTypeKey;
  mbti?: string;
  jobCategory?: string;
  height?: number;
  bodyType?: string;
  smoking?: string;
  drinking?: string;
  religion?: string;
  photoUrls: string[];
  isVerified: boolean;
}

export interface CompatibilityPoint {
  type: "common" | "different";
  label: string;
  detail?: string;
}

export interface MatchDetail {
  matchId: string;
  me: MatchProfile;
  partner: MatchProfile;
  matchmaker: MatchmakerInfo;
  compatibilityPoints: CompatibilityPoint[];
  synergyLabel: string;
  status: "pending" | "liked" | "passed" | "mutual";
  createdAt: string;
}
