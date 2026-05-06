/**
 * profile-completion.ts — F10 온보딩 완성도 게이트
 *
 * 항목별 가중치 (합계 100):
 *   컬러 진단:       20
 *   사진 1장:        15
 *   기본정보 5개:    25 (5항목 × 5)
 *   한 줄 소개:      10
 *   사진 본인인증:   15
 *   추가 사진(4장):  8
 *   라이프스타일:    4
 *   이상형:          3
 *
 * 60점 미만 → 매칭 풀 제외
 */

export interface ProfileCompletionInput {
  hasColorType: boolean;
  photoCount: number;        // 업로드된 사진 수
  basicInfo: {
    birthYear?: string | null;
    gender?: string | null;
    height?: number | null;
    region?: string | null;
    jobCategory?: string | null;
  };
  introText?: string | null; // 한 줄 소개 (20자 이상 시 완료)
  isVerified: boolean;       // 사진 본인인증
  hasLifestyle: boolean;     // 라이프스타일 입력 여부
  hasIdealType: boolean;     // 이상형 입력 여부
}

export interface CompletionBreakdown {
  colorType:    number; // 0 or 20
  photo:        number; // 0 or 15
  basicInfo:    number; // 0~25 (5×5)
  intro:        number; // 0 or 10
  verified:     number; // 0 or 15
  extraPhotos:  number; // 0 or 8
  lifestyle:    number; // 0 or 4
  idealType:    number; // 0 or 3
  total:        number; // 0~100
}

const WEIGHTS = {
  colorType:   20,
  photoFirst:  15,
  basicItem:    5, // × 5
  intro:       10,
  verified:    15,
  extraPhotos:  8,
  lifestyle:    4,
  idealType:    3,
} as const;

export function calculateCompletion(
  input: ProfileCompletionInput,
): CompletionBreakdown {
  const colorType  = input.hasColorType ? WEIGHTS.colorType : 0;
  const photo      = input.photoCount >= 1 ? WEIGHTS.photoFirst : 0;
  const extraPhotos= input.photoCount >= 4 ? WEIGHTS.extraPhotos : 0;
  const verified   = input.isVerified ? WEIGHTS.verified : 0;
  const lifestyle  = input.hasLifestyle ? WEIGHTS.lifestyle : 0;
  const idealType  = input.hasIdealType ? WEIGHTS.idealType : 0;

  const { basicInfo } = input;
  const basicItems = [
    basicInfo.birthYear,
    basicInfo.gender,
    basicInfo.height,
    basicInfo.region,
    basicInfo.jobCategory,
  ].filter(Boolean).length;
  const basicInfoScore = basicItems * WEIGHTS.basicItem;

  const introText = input.introText ?? "";
  const intro = introText.trim().length >= 20 ? WEIGHTS.intro : 0;

  const total = colorType + photo + basicInfoScore + intro + verified + extraPhotos + lifestyle + idealType;

  return {
    colorType,
    photo,
    basicInfo: basicInfoScore,
    intro,
    verified,
    extraPhotos,
    lifestyle,
    idealType,
    total,
  };
}

/** 매칭 풀 포함 여부 (60점 이상) */
export function isEligibleForMatching(input: ProfileCompletionInput): boolean {
  return calculateCompletion(input).total >= 60;
}

/** 다음에 채워야 할 항목 힌트 (최대 3개) */
export function getNextActions(
  input: ProfileCompletionInput,
): { label: string; weight: number; key: string }[] {
  const actions: { label: string; weight: number; key: string }[] = [];

  if (!input.hasColorType)
    actions.push({ label: "컬러 타입 진단", weight: WEIGHTS.colorType, key: "colorType" });
  if (input.photoCount < 1)
    actions.push({ label: "프로필 사진 추가", weight: WEIGHTS.photoFirst, key: "photo" });
  if (!input.isVerified)
    actions.push({ label: "사진 본인인증", weight: WEIGHTS.verified, key: "verify" });

  const bi = input.basicInfo;
  if (!bi.birthYear || !bi.gender || !bi.height || !bi.region || !bi.jobCategory)
    actions.push({ label: "기본정보 입력", weight: WEIGHTS.basicItem * 5, key: "basicInfo" });

  if ((input.introText ?? "").trim().length < 20)
    actions.push({ label: "한 줄 소개 작성", weight: WEIGHTS.intro, key: "intro" });
  if (input.photoCount < 4)
    actions.push({ label: "사진 3장 추가", weight: WEIGHTS.extraPhotos, key: "extraPhotos" });
  if (!input.hasLifestyle)
    actions.push({ label: "라이프스타일 입력", weight: WEIGHTS.lifestyle, key: "lifestyle" });
  if (!input.hasIdealType)
    actions.push({ label: "이상형 입력", weight: WEIGHTS.idealType, key: "idealType" });

  // 점수 큰 순 정렬, 최대 3개
  return actions.sort((a, b) => b.weight - a.weight).slice(0, 3);
}

/** 테스트용 mock 완성도 입력 */
export const MOCK_COMPLETION_INPUT: ProfileCompletionInput = {
  hasColorType: true,
  photoCount: 2,
  basicInfo: {
    birthYear: "1995",
    gender: "MALE",
    height: 178,
    region: "서울",
    jobCategory: "IT_DEVELOPMENT",
  },
  introText: "안녕하세요! 따뜻한 커피와 책을 좋아하는 사람입니다.",
  isVerified: false,
  hasLifestyle: true,
  hasIdealType: false,
};
