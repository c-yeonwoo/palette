/**
 * 온보딩 칩 옵션 훅 (ADR 0057 2차).
 *
 * GET /api/v1/onboarding/options 로 어드민이 관리하는 활성 옵션을 받아온다.
 * 각 칩은 { code, label } — 화면은 label 을 보여주고 code 를 저장한다.
 *
 * 폴백: API 실패/빈 응답이면 FieldOptionSeeder 와 동일한 기본값을 그대로 쓴다
 * (네트워크 의존 없이 온보딩이 항상 동작 + 테스트가 동기적으로 렌더되도록).
 */
import { useEffect, useState } from "react";
import { api } from "../api/apiClient";

export interface FieldOption {
  code: string;
  label: string;
  gender?: string | null;
}

export type OptionSets = Record<string, FieldOption[]>;

interface OnboardingOptionsResponse {
  options?: OptionSets;
}

// FieldOptionSeeder.kt 와 1:1 — 어드민이 비우거나 API 가 죽어도 현행 동작 보존.
export const FALLBACK_OPTIONS: OptionSets = {
  bodyType: [
    { code: "SLIM", label: "슬림" },
    { code: "AVERAGE", label: "보통" },
    { code: "ATHLETIC", label: "탄탄" },
    { code: "MUSCULAR", label: "건장" },
    { code: "CURVY", label: "통통" },
  ],
  religion: [
    { code: "NONE", label: "무교" },
    { code: "CHRISTIANITY", label: "기독교" },
    { code: "CATHOLICISM", label: "천주교" },
    { code: "BUDDHISM", label: "불교" },
    { code: "OTHER", label: "기타" },
  ],
  smoking: [
    { code: "NEVER", label: "비흡연" },
    { code: "SOMETIMES", label: "가끔" },
    { code: "OFTEN", label: "자주" },
  ],
  drinking: [
    { code: "NEVER", label: "안 마심" },
    { code: "SOMETIMES", label: "가끔" },
    { code: "OFTEN", label: "자주" },
  ],
  datePreference: [
    { code: "FOOD", label: "맛집 투어" },
    { code: "CAFE", label: "카페·디저트" },
    { code: "ACTIVITY", label: "액티비티·운동" },
    { code: "TRAVEL", label: "여행·드라이브" },
    { code: "EXHIBITION", label: "전시·공연" },
    { code: "MOVIE", label: "영화·넷플릭스" },
    { code: "HOME", label: "집 데이트" },
    { code: "WALK", label: "산책·피크닉" },
    { code: "DRINK", label: "술 한잔" },
    { code: "FESTIVAL", label: "페스티벌·팝업" },
  ],
  importantValue: [
    { code: "PERSONALITY", label: "성격/성향" },
    { code: "APPEARANCE", label: "외모" },
    { code: "EDUCATION", label: "학력" },
    { code: "CAREER", label: "능력/커리어" },
    { code: "FAMILY", label: "집안/가족" },
    { code: "JOB", label: "직업" },
    { code: "WEALTH", label: "경제력" },
    { code: "VALUES", label: "가치관" },
  ],
  dealBreaker: [
    { code: "SMOKING", label: "흡연자" },
    { code: "HEAVY_DRINKING", label: "과음하는 사람" },
    { code: "DISLIKES_PETS", label: "반려동물을 싫어하는 사람" },
    { code: "LONG_DISTANCE", label: "장거리 연애" },
    { code: "DIFFERENT_RELIGION", label: "종교가 다른 사람" },
    { code: "NO_MARRIAGE_PLAN", label: "결혼 의사가 없는 사람" },
    { code: "CHILDREN_PLAN", label: "자녀 계획이 맞지 않는 사람" },
    { code: "UNSTABLE_JOB", label: "직업이 불안정한 사람" },
    { code: "CONTACTS_EX", label: "전 연인과 연락하는 사람" },
    { code: "LARGE_AGE_GAP", label: "나이 차이가 많이 나는 사람" },
  ],
  // 자유 서술형 — code 가 곧 한글(현행 저장 방식)
  personality: [
    "유머있는", "다정한", "지적인", "활발한", "차분한",
    "섬세한", "솔직한", "적극적인", "배려심많은", "독립적인",
  ].map((v) => ({ code: v, label: v })),
  interest: [
    "운동", "맛집", "영화", "여행", "독서", "음악", "카페", "전시", "공연", "사진",
    "요리", "와인", "캠핑", "드라이브", "게임", "반려동물", "패션", "글쓰기", "그림", "재테크",
  ].map((v) => ({ code: v, label: v })),
  appearanceStyle: [
    { code: "PUPPY", label: "강아지상", gender: "FEMALE" },
    { code: "CAT", label: "고양이상", gender: "FEMALE" },
    { code: "RABBIT", label: "토끼상", gender: "FEMALE" },
    { code: "FOX", label: "여우상", gender: "FEMALE" },
    { code: "DEER", label: "사슴상", gender: "FEMALE" },
    { code: "BEAR", label: "곰상", gender: "FEMALE" },
    { code: "HAMSTER", label: "햄스터상", gender: "FEMALE" },
    { code: "DINOSAUR", label: "공룡상", gender: "FEMALE" },
    { code: "TOFU", label: "두부상", gender: "FEMALE" },
    { code: "SOFT_TOFU", label: "순두부상", gender: "FEMALE" },
    { code: "INNOCENT", label: "청순상", gender: "FEMALE" },
    { code: "CHIC", label: "시크상", gender: "FEMALE" },
    { code: "BAGEL", label: "베이글상", gender: "FEMALE" },
    { code: "DOLL", label: "인형상", gender: "FEMALE" },
    { code: "HARMLESS", label: "무해상", gender: "FEMALE" },
    { code: "FRESH", label: "청량상", gender: "FEMALE" },
    { code: "ANNOUNCER", label: "아나운서상", gender: "FEMALE" },
    { code: "ARAB", label: "아랍상", gender: "FEMALE" },
    { code: "BOSS", label: "일진상", gender: "FEMALE" },
    { code: "MOTHER_IN_LAW_APPROVED", label: "상견례 프리패스상", gender: "FEMALE" },
    { code: "PUPPY", label: "강아지상", gender: "MALE" },
    { code: "CAT", label: "고양이상", gender: "MALE" },
    { code: "WOLF", label: "늑대상", gender: "MALE" },
    { code: "BEAR", label: "곰상", gender: "MALE" },
    { code: "HAMSTER", label: "햄스터상", gender: "MALE" },
    { code: "DINOSAUR", label: "공룡상", gender: "MALE" },
    { code: "STUDENT_COUNCIL", label: "전교회장상", gender: "MALE" },
    { code: "ATHLETIC", label: "체대상", gender: "MALE" },
    { code: "NERD", label: "너드상", gender: "MALE" },
    { code: "TOFU", label: "두부상", gender: "MALE" },
    { code: "WARM", label: "훈남상", gender: "MALE" },
    { code: "DANDY", label: "댄디상", gender: "MALE" },
    { code: "BEAST", label: "짐승상", gender: "MALE" },
    { code: "ANNOUNCER", label: "아나운서상", gender: "MALE" },
    { code: "ARAB", label: "아랍상", gender: "MALE" },
    { code: "MOTHER_IN_LAW_APPROVED", label: "상견례 프리패스상", gender: "MALE" },
  ],
};

/**
 * 옵션 세트를 반환. 초기값은 폴백 → 마운트 후 fetch 성공 시 해당 세트만 교체.
 * (어드민이 특정 세트를 통째로 비우면 그 세트는 폴백 유지 — 빈 UI 방지)
 */
export function useOnboardingOptions(): { options: OptionSets; loading: boolean } {
  const [options, setOptions] = useState<OptionSets>(FALLBACK_OPTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<OnboardingOptionsResponse>("/api/v1/onboarding/options");
        const fetched = res?.options;
        if (!cancelled && fetched && typeof fetched === "object") {
          // 비어있지 않은 세트만 폴백 위에 덮어쓴다.
          const merged: OptionSets = { ...FALLBACK_OPTIONS };
          for (const [key, list] of Object.entries(fetched)) {
            if (Array.isArray(list) && list.length > 0) merged[key] = list;
          }
          setOptions(merged);
        }
      } catch {
        // 폴백 유지 — 온보딩은 항상 진행 가능해야 함
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading };
}

/** datePreference 카드의 부가 설명 — 라벨은 어드민 관리, 설명은 코드별 정적 폴백. */
export const DATE_PREF_DESC: Record<string, string> = {
  FOOD: "맛집 찾아다니기",
  CAFE: "감성 카페·디저트",
  ACTIVITY: "운동·클라이밍·볼링 등",
  TRAVEL: "당일치기·드라이브",
  EXHIBITION: "전시·공연·뮤지컬",
  MOVIE: "영화관·집에서 넷플릭스",
  HOME: "집에서 편하게",
  WALK: "산책·한강·피크닉",
  DRINK: "분위기 좋은 술 한잔",
  FESTIVAL: "페스티벌·팝업스토어",
  // 구버전 호환
  ACTIVE: "여행, 운동, 액티비티",
  INDOOR: "집, 카페, 영화관",
  CULTURE: "전시, 공연, 맛집 투어",
  NATURE: "산책, 드라이브, 피크닉",
};
