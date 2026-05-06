/**
 * mock-matches.ts — F01 매칭 상세 페이지용 목 데이터
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

// ── MOCK DATA ────────────────────────────────────────────

const ME: MatchProfile = {
  userId: "me-001",
  name: "나",
  age: 28,
  location: "서울 강남구",
  colorType: "orange",
  mbti: "ENFP",
  jobCategory: "IT/개발",
  height: 175,
  bodyType: "보통",
  smoking: "비흡연",
  drinking: "가끔",
  religion: "무교",
  photoUrls: [],
  isVerified: true,
};

export const MOCK_MATCHES: MatchDetail[] = [
  {
    matchId: "match-001",
    me: ME,
    partner: {
      userId: "user-101",
      name: "지수",
      age: 26,
      location: "서울 강남구",
      colorType: "blue",
      mbti: "ISTJ",
      jobCategory: "금융/보험",
      height: 163,
      bodyType: "슬림",
      smoking: "비흡연",
      drinking: "가끔",
      religion: "무교",
      photoUrls: [
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      ],
      isVerified: true,
    },
    matchmaker: {
      id: "mm-001",
      name: "김민준",
      tier: "Gold",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
      successCount: 12,
      comment: "지수씨 진짜 다정하고 배려심 넘쳐요. 같이 있으면 편안한 사람이에요. 연락처 교환하고 나서도 계속 챙겨줬거든요.",
    },
    compatibilityPoints: [
      { type: "common", label: "같은 동네", detail: "강남구 거주" },
      { type: "common", label: "비흡연자", detail: "건강한 생활" },
      { type: "common", label: "종교 없음", detail: "가치관 일치" },
      { type: "different", label: "MBTI 보완형", detail: "ENFP ↔ ISTJ" },
      { type: "different", label: "업무 스타일", detail: "창의 ↔ 분석" },
    ],
    synergyLabel: "보색 시너지",
    status: "pending",
    createdAt: "2025-05-03T10:00:00Z",
  },
  {
    matchId: "match-002",
    me: ME,
    partner: {
      userId: "user-102",
      name: "하은",
      age: 27,
      location: "서울 마포구",
      colorType: "pink",
      mbti: "INFJ",
      jobCategory: "미디어/엔터",
      height: 160,
      bodyType: "슬림",
      smoking: "비흡연",
      drinking: "가끔",
      religion: "기독교",
      photoUrls: [
        "https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?w=400",
        "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400",
      ],
      isVerified: false,
    },
    matchmaker: {
      id: "mm-002",
      name: "박서연",
      tier: "Silver",
      successCount: 5,
      comment: "둘 다 감성적인 사람들인데 서로 잘 맞을 것 같아요.",
    },
    compatibilityPoints: [
      { type: "common", label: "감성적 성향", detail: "예술·음악 취미 공유" },
      { type: "common", label: "비흡연자" },
      { type: "different", label: "지역", detail: "강남 ↔ 마포" },
    ],
    synergyLabel: "유사 매칭",
    status: "pending",
    createdAt: "2025-05-02T15:30:00Z",
  },
  {
    matchId: "match-003",
    me: ME,
    partner: {
      userId: "user-103",
      name: "수현",
      age: 29,
      location: "서울 송파구",
      colorType: "green",
      mbti: "ENTJ",
      jobCategory: "전문직",
      height: 168,
      bodyType: "탄탄",
      smoking: "비흡연",
      drinking: "자주",
      religion: "무교",
      photoUrls: [
        "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400",
      ],
      isVerified: true,
    },
    matchmaker: {
      id: "mm-003",
      name: "이준호",
      tier: "Platinum",
      successCount: 24,
      comment: "수현씨 커리어 욕심 강하고 활발한데, 에너지가 잘 맞을 것 같아요.",
    },
    compatibilityPoints: [
      { type: "common", label: "무교", detail: "가치관 일치" },
      { type: "common", label: "운동 좋아함" },
      { type: "different", label: "음주 성향", detail: "가끔 ↔ 자주" },
      { type: "different", label: "MBTI", detail: "ENFP ↔ ENTJ" },
    ],
    synergyLabel: "흥미로운 조합",
    status: "liked",
    createdAt: "2025-05-01T09:00:00Z",
  },
];

export function getMockMatch(matchId: string): MatchDetail | undefined {
  return MOCK_MATCHES.find((m) => m.matchId === matchId);
}
