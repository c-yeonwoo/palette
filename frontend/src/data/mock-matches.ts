/**
 * mock-matches.ts — F01 매칭 상세 타입 계약
 *
 * 실제 매칭 데이터는 백엔드 연동 전까지 노출하지 않는다 (MatchDetailScreen 은 빈 상태).
 * 이 모듈은 매칭 도메인 타입만 정의한다. (mock 데이터 제거됨)
 * 실제 API 연동 시 동일 인터페이스(MatchDetail)를 유지하면 drop-in 교체 가능.
 */
import type { ColorTypeKey } from "../lib/colorTypes";

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
  name: string;          // 이니셜 처리 옵션은 profile-visibility 참고
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
  photoUrls: string[];   // [0]=메인
  isVerified: boolean;   // F04 본인인증
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
  synergyLabel: string; // "보색 시너지" | "유사 매칭" | "개성 충돌"
  status: "pending" | "liked" | "passed" | "mutual";
  createdAt: string;
}
