/**
 * profile-visibility.ts — F13 정보 공개 가드
 *
 * 무료/유료/상호매칭 여부에 따라 프로필 필드를 마스킹.
 * F01 매칭 페이지에서 사용.
 */
// Type moved from mock-matches.ts
export type MatchProfile = {
  userId: string;
  name: string;
  age: number;
  location: string;
  colorType: string; // ColorTypeKey
  mbti?: string;
  jobCategory?: string;
  height?: number;
  bodyType?: string;
  smoking?: string;
  drinking?: string;
  religion?: string;
  photoUrls: string[];
  isVerified: boolean;
};

export interface VisibilityContext {
  viewerId: string;
  targetId: string;
  isMutual: boolean;   // 양방향 좋아요 여부
  hasPlus: boolean;    // Palette Plus 멤버십
  hasTicket: boolean;  // 매칭권 있음
}

export interface VisibleProfile {
  userId: string;
  name: string;           // 이니셜 or 풀네임
  age: number;
  location: string;
  colorType: string;
  mbti?: string;
  jobCategory?: string;
  height?: number;
  bodyType?: string;
  smoking?: string;
  drinking?: string;
  religion?: string;
  photoUrls: string[];    // 첫 장 + 추가 (조건부)
  isVerified: boolean;
  // 마스킹 상태
  additionalPhotosLocked: boolean;
  fullNameLocked: boolean;
}

/**
 * 정보 공개 규칙 (F13 표 기준)
 *
 * | 필드             | 무료          | 유료/조건부     |
 * |----------------|-------------|---------------|
 * | 메인 사진        | ✅ 공개        | —             |
 * | 추가 사진        | 1장 공개       | 나머지          |
 * | 이름             | 이니셜        | 상호매칭 후 풀네임 |
 * | 나이/지역/직업군   | ✅ 공개        | —             |
 * | 학교/회사/MBTI   | ✅ 공개        | —             |
 * | 이상형/시너지      | 일부 공개      | Plus면 풀 분석  |
 */
export function getVisibleProfile(
  profile: MatchProfile,
  ctx: VisibilityContext,
): VisibleProfile {
  const isSelf = ctx.viewerId === ctx.targetId;

  // 풀네임: 상호매칭 or Plus or 본인
  const fullNameLocked = !isSelf && !ctx.isMutual && !ctx.hasPlus;
  const name = fullNameLocked
    ? maskName(profile.name)
    : profile.name;

  // 추가 사진: 무료는 최대 2장 (메인 + 1)
  const additionalPhotosLocked = !ctx.hasPlus && !ctx.hasTicket && !ctx.isMutual;
  const photoUrls = additionalPhotosLocked
    ? profile.photoUrls.slice(0, 2)
    : profile.photoUrls;

  return {
    userId: profile.userId,
    name,
    age: profile.age,
    location: profile.location,
    colorType: profile.colorType,
    mbti: profile.mbti,
    jobCategory: profile.jobCategory,
    height: profile.height,
    bodyType: profile.bodyType,
    smoking: profile.smoking,
    drinking: profile.drinking,
    religion: profile.religion,
    photoUrls,
    isVerified: profile.isVerified,
    additionalPhotosLocked,
    fullNameLocked,
  };
}

function maskName(name: string): string {
  if (!name || name.length < 2) return name;
  const family = name[0];
  const initials = name.slice(1).split("").map(() => "*").join("");
  return `${family}${initials}`;
}

/** 무료 사용자에게 노출할 공통점 최대 개수 */
export const FREE_COMPATIBILITY_LIMIT = 2;
