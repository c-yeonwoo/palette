/** 이상형 enum → 한글 라벨 (ProfileDetail / MyProfile 공유) */

export function getDatePreferenceLabel(pref: string): string {
  const map: Record<string, string> = {
    FOOD: "맛집 투어", CAFE: "카페·디저트", ACTIVITY: "액티비티·운동", TRAVEL: "여행·드라이브",
    EXHIBITION: "전시·공연", MOVIE: "영화·넷플릭스", HOME: "집 데이트", WALK: "산책·피크닉",
    DRINK: "술 한잔", FESTIVAL: "페스티벌·팝업",
    ACTIVE: "액티브", INDOOR: "인도어", CULTURE: "문화생활", NATURE: "자연 속으로",
    NIGHT: "야경/술자리", RELAXED: "여유롭게",
  };
  return map[pref] ?? pref;
}

export function getImportantValueLabel(value: string): string {
  const map: Record<string, string> = {
    PERSONALITY: "성격/성향", APPEARANCE: "외모", EDUCATION: "학력",
    CAREER: "능력/커리어", FAMILY: "집안/가족", JOB: "직업",
    WEALTH: "경제력", VALUES: "가치관",
  };
  return map[value] ?? value;
}

export function getAppearanceStyleLabel(style: string): string {
  const map: Record<string, string> = {
    PUPPY: "강아지상", CAT: "고양이상", RABBIT: "토끼상", FOX: "여우상", DEER: "사슴상",
    BEAR: "곰상", HAMSTER: "햄스터상", DINOSAUR: "공룡상", WOLF: "늑대상",
    TOFU: "두부상", SOFT_TOFU: "순두부상", INNOCENT: "청순상", CHIC: "시크상", BAGEL: "베이글상",
    DOLL: "인형상", HARMLESS: "무해상", FRESH: "청량상", ANNOUNCER: "아나운서상",
    ARAB: "아랍상", BOSS: "일진상", MOTHER_IN_LAW_APPROVED: "상견례 프리패스상",
    STUDENT_COUNCIL: "전교회장상", ATHLETIC: "체대상", NERD: "너드상",
    WARM: "훈남상", DANDY: "댄디상", BEAST: "짐승상",
  };
  return map[style] ?? style;
}

export function getDealBreakerLabel(dealBreaker: string): string {
  const map: Record<string, string> = {
    SMOKING: "흡연",
    EXCESSIVE_DRINKING: "과음",
    HEAVY_DRINKING: "과음",
    DIFFERENT_RELIGION: "종교 차이",
    LONG_DISTANCE: "장거리 연애",
    DIFFERENT_VALUES: "가치관 차이",
    NO_JOB: "무직",
    DEBT: "빚",
    DIVORCED: "이혼 경력",
    AGE_GAP: "나이 차이",
    LARGE_AGE_GAP: "나이 차이가 많이 나는 사람",
    PETS: "반려동물",
    CHILDREN: "아이 있음",
    DISLIKES_PETS: "반려동물을 싫어하는 사람",
    NO_MARRIAGE_PLAN: "결혼 의사가 없는 사람",
    CHILDREN_PLAN: "자녀 계획이 맞지 않는 사람",
    UNSTABLE_JOB: "직업이 불안정한 사람",
    CONTACTS_EX: "전 연인과 연락하는 사람",
  };
  return map[dealBreaker] ?? dealBreaker;
}

export interface IdealTypeLike {
  datePreferences?: string[];
  importantValues?: string[];
  personalities?: string[];
  appearanceStyles?: string[];
  dealBreakers?: string[];
  ageMin?: number | null;
  ageMax?: number | null;
  heightMin?: number | null;
  heightMax?: number | null;
}

export function buildIdealSummaryChips(idealType: IdealTypeLike): string[] {
  return [
    ...(idealType.appearanceStyles ?? []).map(getAppearanceStyleLabel),
    ...(idealType.personalities ?? []),
    ...(idealType.datePreferences ?? []).map(getDatePreferenceLabel),
    ...(idealType.importantValues ?? []).map(getImportantValueLabel),
  ].filter(Boolean).slice(0, 8);
}
