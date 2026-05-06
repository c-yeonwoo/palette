/**
 * Palette — Profile Schema
 * 프로필 필드의 그룹핑, 레이블, 포맷 함수를 한 곳에 정의.
 * CategoryCard / InfoRow가 이 정의를 읽어 렌더링합니다.
 */

// ── 필드 값 변환 맵 ──────────────────────────────────────────
const BODY_TYPE_MAP:  Record<string, string> = { SLIM: "슬림", AVERAGE: "보통", ATHLETIC: "탄탄", MUSCULAR: "건장", CURVY: "통통" };
const SMOKING_MAP:   Record<string, string> = { NEVER: "비흡연", SOMETIMES: "가끔", OFTEN: "자주" };
const DRINKING_MAP:  Record<string, string> = { NEVER: "안 마심", SOMETIMES: "가끔", OFTEN: "자주" };
const RELIGION_MAP:  Record<string, string> = { NONE: "무교", CHRISTIANITY: "기독교", CATHOLICISM: "천주교", BUDDHISM: "불교", OTHER: "기타" };
const EDUCATION_MAP: Record<string, string> = { HIGH_SCHOOL: "고졸", ASSOCIATE: "전문대", BACHELOR: "대졸", MASTER: "석사", DOCTORATE: "박사" };
const CAREER_MAP:    Record<string, string> = {
  IT_DEVELOPMENT: "IT/개발", FINANCE: "금융/보험", EDUCATION: "교육",
  MEDICAL: "의료/보건", MEDIA: "미디어/광고", SERVICE: "서비스",
  MANUFACTURING: "제조/생산", PUBLIC_OFFICIAL: "공무원", PROFESSIONAL: "전문직", OTHER: "기타",
};

// ── 필드 메타 ─────────────────────────────────────────────────
export interface FieldMeta {
  label: string;
  /** raw 값을 표시 문자열로 변환 (없으면 그대로 표시) */
  format?: (v: unknown) => string;
  /** 편집 시 선택지 목록 */
  options?: { value: string; label: string }[];
  /** 편집 위젯 종류 */
  widget?: "chips" | "slider" | "text";
  /** 슬라이더 범위 */
  sliderMin?: number;
  sliderMax?: number;
  sliderUnit?: string;
}

export const FIELD_META: Record<string, FieldMeta> = {
  // 기본 정보
  height: {
    label: "키",
    format: (v) => (v ? `${v}cm` : ""),
    widget: "slider",
    sliderMin: 140,
    sliderMax: 210,
    sliderUnit: "cm",
  },
  bodyType: {
    label: "체형",
    format: (v) => BODY_TYPE_MAP[v as string] ?? (v as string),
    widget: "chips",
    options: Object.entries(BODY_TYPE_MAP).map(([value, label]) => ({ value, label })),
  },
  mbti: {
    label: "MBTI",
    widget: "text",
  },
  // 직업·학력
  jobCategory: {
    label: "직군",
    format: (v) => CAREER_MAP[v as string] ?? (v as string),
    widget: "chips",
    options: Object.entries(CAREER_MAP).map(([value, label]) => ({ value, label })),
  },
  company: {
    label: "직장",
    widget: "text",
  },
  education: {
    label: "학력",
    format: (v) => EDUCATION_MAP[v as string] ?? (v as string),
    widget: "chips",
    options: Object.entries(EDUCATION_MAP).map(([value, label]) => ({ value, label })),
  },
  school: {
    label: "학교",
    widget: "text",
  },
  major: {
    label: "전공",
    widget: "text",
  },
  // 라이프스타일
  smoking: {
    label: "흡연",
    format: (v) => SMOKING_MAP[v as string] ?? (v as string),
    widget: "chips",
    options: Object.entries(SMOKING_MAP).map(([value, label]) => ({ value, label })),
  },
  drinking: {
    label: "음주",
    format: (v) => DRINKING_MAP[v as string] ?? (v as string),
    widget: "chips",
    options: Object.entries(DRINKING_MAP).map(([value, label]) => ({ value, label })),
  },
  religion: {
    label: "종교",
    format: (v) => RELIGION_MAP[v as string] ?? (v as string),
    widget: "chips",
    options: Object.entries(RELIGION_MAP).map(([value, label]) => ({ value, label })),
  },
  // 위치
  location: {
    label: "거주지",
    widget: "text",
  },
  hometown: {
    label: "고향",
    widget: "text",
  },
};

// ── 그룹 정의 ─────────────────────────────────────────────────
export interface ProfileGroup {
  key: string;
  title: string;
  icon: string;  // Lucide icon name
  /** ProfileValues에서 꺼낼 필드 키 목록 (FIELD_META 키와 동일) */
  fields: readonly string[];
}

export const PROFILE_GROUPS = [
  {
    key: "basic",
    title: "기본 정보",
    icon: "UserRound",
    fields: ["height", "bodyType", "mbti"],
  },
  {
    key: "career",
    title: "직업·학력",
    icon: "GraduationCap",
    fields: ["jobCategory", "company", "education", "school", "major"],
  },
  {
    key: "lifestyle",
    title: "라이프스타일",
    icon: "Sparkles",
    fields: ["smoking", "drinking", "religion", "location", "hometown"],
  },
] as const satisfies readonly ProfileGroup[];

export type ProfileGroupKey = (typeof PROFILE_GROUPS)[number]["key"];

// ── ProfileValues 타입 ────────────────────────────────────────
/**
 * CategoryCard / InfoRow에 넘기는 값 맵.
 * key는 FIELD_META 키와 동일.
 */
export type ProfileValues = Partial<Record<keyof typeof FIELD_META, unknown>>;

/**
 * API 응답을 ProfileValues로 변환하는 헬퍼.
 * 화면별로 import해서 사용.
 */
export function toProfileValues(profile: {
  basicInfo?: { height?: number | null; bodyType?: string | null; mbti?: string | null };
  careerInfo?: { category?: string | null; company?: string | null };
  educationInfo?: { level?: string | null; school?: string | null; major?: string | null };
  lifestyleInfo?: { smoking?: string | null; drinking?: string | null; religion?: string | null };
  locationInfo?: { sido?: string | null; sigungu?: string | null; hometownSido?: string | null; hometownSigungu?: string | null };
}): ProfileValues {
  const loc = [profile.locationInfo?.sido, profile.locationInfo?.sigungu].filter(Boolean).join(" ");
  const hometown = [profile.locationInfo?.hometownSido, profile.locationInfo?.hometownSigungu].filter(Boolean).join(" ");

  return {
    height:      profile.basicInfo?.height,
    bodyType:    profile.basicInfo?.bodyType,
    mbti:        profile.basicInfo?.mbti,
    jobCategory: profile.careerInfo?.category,
    company:     profile.careerInfo?.company,
    education:   profile.educationInfo?.level,
    school:      profile.educationInfo?.school,
    major:       profile.educationInfo?.major,
    smoking:     profile.lifestyleInfo?.smoking,
    drinking:    profile.lifestyleInfo?.drinking,
    religion:    profile.lifestyleInfo?.religion,
    location:    loc || undefined,
    hometown:    hometown || undefined,
  };
}

/** raw 값 → 표시 문자열 */
export function formatFieldValue(fieldKey: string, rawValue: unknown): string {
  const meta = FIELD_META[fieldKey];
  if (!meta) return String(rawValue ?? "");
  if (meta.format) return meta.format(rawValue);
  return String(rawValue ?? "");
}
