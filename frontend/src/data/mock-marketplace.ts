/**
 * mock-marketplace.ts — F07 주선자 마켓플레이스 목업 데이터
 *
 * 12명의 주선자 카드 데이터.
 * 레벨 1~5, 전문 분야, 컬러 타입, 성사율 다양화.
 */

import type { ColorTypeKey } from "../lib/colorTypes";

export type MatchmakerLevel = 1 | 2 | 3 | 4 | 5;

export interface MarketplaceMatchmaker {
  id: string;
  nickname: string;
  /** 컬러 타입 (아바타 색상용) */
  colorType: ColorTypeKey;
  level: MatchmakerLevel;
  commissionRate: number;       // 30~50%
  successfulMatches: number;
  totalRequests: number;
  averageRating: number;        // 1.0~5.0
  totalReviews: number;
  bio: string;
  specialties: string[];
  /** 마지막 활동 ISO */
  lastActiveAt: string;
  /** 현재 모집 중 여부 */
  accepting: boolean;
}

const now = new Date();
const t = (days: number) =>
  new Date(now.getTime() - days * 24 * 3600 * 1000).toISOString();

export const MOCK_MARKETPLACE: MarketplaceMatchmaker[] = [
  {
    id: "mm-001",
    nickname: "박주선",
    colorType: "orange",
    level: 5,
    commissionRate: 50,
    successfulMatches: 28,
    totalRequests: 45,
    averageRating: 4.9,
    totalReviews: 24,
    bio: "IT 업계 10년차 직장인. 서울 강남/판교 친구 네트워크가 넓어요. 진지한 만남을 원하는 분 환영!",
    specialties: ["IT/개발", "30대", "서울", "진지한연애"],
    lastActiveAt: t(0),
    accepting: true,
  },
  {
    id: "mm-002",
    nickname: "김연결",
    colorType: "blue",
    level: 4,
    commissionRate: 45,
    successfulMatches: 16,
    totalRequests: 27,
    averageRating: 4.7,
    totalReviews: 14,
    bio: "의료계 종사자로 병원·제약 업계 지인이 많아요. 안정적인 직종끼리 만남을 선호하는 편 😊",
    specialties: ["의료", "30대", "경기", "결혼목적"],
    lastActiveAt: t(1),
    accepting: true,
  },
  {
    id: "mm-003",
    nickname: "이다연",
    colorType: "pink",
    level: 4,
    commissionRate: 45,
    successfulMatches: 14,
    totalRequests: 22,
    averageRating: 4.8,
    totalReviews: 12,
    bio: "패션/뷰티 업계 근무. 20~30대 활발하고 감각 있는 분들을 잘 알아요. 자연스러운 만남 선호!",
    specialties: ["20대", "30대", "서울", "자연스럽게"],
    lastActiveAt: t(0),
    accepting: true,
  },
  {
    id: "mm-004",
    nickname: "최공무",
    colorType: "gray",
    level: 3,
    commissionRate: 40,
    successfulMatches: 9,
    totalRequests: 18,
    averageRating: 4.5,
    totalReviews: 8,
    bio: "공무원 5년차. 안정적인 직종 종사자 지인이 많고, 진지하게 만남을 원하는 분들을 연결해드려요.",
    specialties: ["공무원", "30대", "지방", "결혼목적"],
    lastActiveAt: t(2),
    accepting: true,
  },
  {
    id: "mm-005",
    nickname: "정금융",
    colorType: "red",
    level: 3,
    commissionRate: 40,
    successfulMatches: 8,
    totalRequests: 15,
    averageRating: 4.3,
    totalReviews: 7,
    bio: "증권사·은행 네트워크. 금융권 종사자 분들과 좋은 만남을 만들어드립니다. 강남 쪽 활동 많아요.",
    specialties: ["금융/보험", "30대", "서울", "진지한연애"],
    lastActiveAt: t(1),
    accepting: true,
  },
  {
    id: "mm-006",
    nickname: "한교육",
    colorType: "green",
    level: 2,
    commissionRate: 35,
    successfulMatches: 4,
    totalRequests: 10,
    averageRating: 4.6,
    totalReviews: 4,
    bio: "교직원 네트워크. 교사/교수 지인이 많고, 선량하고 따뜻한 분들을 연결해드려요.",
    specialties: ["교육", "30대", "경기", "결혼목적"],
    lastActiveAt: t(3),
    accepting: true,
  },
  {
    id: "mm-007",
    nickname: "오전문",
    colorType: "purple",
    level: 5,
    commissionRate: 50,
    successfulMatches: 31,
    totalRequests: 52,
    averageRating: 4.8,
    totalReviews: 27,
    bio: "변호사·회계사 등 전문직 네트워크 탄탄. 전문직 이상 만남을 원하는 분들께 추천드려요.",
    specialties: ["전문직", "30대", "서울", "결혼목적"],
    lastActiveAt: t(0),
    accepting: false,
  },
  {
    id: "mm-008",
    nickname: "류이공",
    colorType: "yellow",
    level: 2,
    commissionRate: 35,
    successfulMatches: 3,
    totalRequests: 8,
    averageRating: 4.4,
    totalReviews: 3,
    bio: "스타트업·테크 업계 20대 네트워크. 활발하고 재미있는 분들 많이 알고 있어요!",
    specialties: ["IT/개발", "20대", "서울", "자연스럽게"],
    lastActiveAt: t(4),
    accepting: true,
  },
  {
    id: "mm-009",
    nickname: "서지역",
    colorType: "orange",
    level: 3,
    commissionRate: 40,
    successfulMatches: 11,
    totalRequests: 20,
    averageRating: 4.5,
    totalReviews: 10,
    bio: "부산·경남 지역 탄탄한 네트워크. 지방 거주 분들도 안심하고 부탁하세요!",
    specialties: ["30대", "지방", "자연스럽게"],
    lastActiveAt: t(2),
    accepting: true,
  },
  {
    id: "mm-010",
    nickname: "강마흔",
    colorType: "blue",
    level: 4,
    commissionRate: 45,
    successfulMatches: 18,
    totalRequests: 30,
    averageRating: 4.6,
    totalReviews: 16,
    bio: "40대 이상 네트워크 전문. 재혼·황혼 연애를 진지하게 생각하는 분들을 연결해드립니다.",
    specialties: ["40대이상", "서울", "결혼목적"],
    lastActiveAt: t(1),
    accepting: true,
  },
  {
    id: "mm-011",
    nickname: "임헬스",
    colorType: "red",
    level: 2,
    commissionRate: 35,
    successfulMatches: 5,
    totalRequests: 12,
    averageRating: 4.7,
    totalReviews: 5,
    bio: "헬스트레이너·PT강사·운동 좋아하는 친구들 많아요. 활동적인 분들께 최적!",
    specialties: ["20대", "30대", "서울", "자연스럽게"],
    lastActiveAt: t(0),
    accepting: true,
  },
  {
    id: "mm-012",
    nickname: "윤신뢰",
    colorType: "green",
    level: 1,
    commissionRate: 30,
    successfulMatches: 1,
    totalRequests: 4,
    averageRating: 5.0,
    totalReviews: 1,
    bio: "이제 막 시작한 신규 주선자입니다. 커미션은 낮지만 성심껏 노력할게요 🙏",
    specialties: ["20대", "경기", "자연스럽게"],
    lastActiveAt: t(5),
    accepting: true,
  },
];

/** 전문분야 필터 옵션 */
export const SPECIALTY_FILTER_OPTIONS = [
  "IT/개발", "금융/보험", "의료", "교육", "공무원", "전문직",
  "20대", "30대", "40대이상",
  "서울", "경기", "지방",
  "결혼목적", "진지한연애", "자연스럽게",
];

/** 레벨 메타 */
export const LEVEL_META: Record<MatchmakerLevel, { name: string; emoji: string }> = {
  1: { name: "씨앗",   emoji: "🌱" },
  2: { name: "새싹",   emoji: "🌿" },
  3: { name: "꽃",     emoji: "🌸" },
  4: { name: "나무",   emoji: "🌳" },
  5: { name: "숲",     emoji: "🌲" },
};
