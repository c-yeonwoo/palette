/**
 * 직군(CareerCategory) enum ↔ 라벨/이모지 단일 소스 (SoT).
 *
 * 백엔드(`kr.ai.palette.domain.profile.CareerCategory`)는 enum value 를 그대로
 * 내려주므로 UI 표시는 항상 이 헬퍼를 통과시킨다.
 *
 * ADR 0036 — 데이팅 도메인 확장 풀(22 카테고리).
 * - 초기 10개(IT_DEVELOPMENT…OTHER)는 호환 유지 — PROFESSIONAL 은 legacy bucket.
 * - 신규 가입자는 LAW/ACCOUNTING_TAX/RESEARCH 등 세부 항목으로 유도.
 */

export type JobCategory =
  // 초기 10
  | "IT_DEVELOPMENT"
  | "FINANCE"
  | "EDUCATION"
  | "MEDICAL"
  | "MEDIA"
  | "SERVICE"
  | "MANUFACTURING"
  | "PUBLIC_OFFICIAL"
  | "PROFESSIONAL"
  | "OTHER"
  // 확장
  | "DESIGN"
  | "PLANNING_STRATEGY"
  | "MARKETING"
  | "LAW"
  | "ACCOUNTING_TAX"
  | "RESEARCH"
  | "MILITARY_POLICE"
  | "SALES"
  | "CONSTRUCTION_REALESTATE"
  | "TRADE_LOGISTICS"
  | "ART_CULTURE"
  | "STARTUP_BUSINESS"
  | "FREELANCE"
  | "STUDENT";

/** 풀 라벨 + 짧은 라벨 + 이모지 SoT */
const META: Record<JobCategory, { label: string; short: string; emoji: string }> = {
  IT_DEVELOPMENT:          { label: "IT/개발",          short: "IT개발",   emoji: "💻" },
  DESIGN:                  { label: "디자인/크리에이티브", short: "디자인",  emoji: "🎨" },
  PLANNING_STRATEGY:       { label: "기획/전략",          short: "기획",    emoji: "🧭" },
  MARKETING:               { label: "마케팅/광고/홍보",   short: "마케팅",  emoji: "📣" },
  MEDIA:                   { label: "미디어/방송/엔터",   short: "미디어",  emoji: "🎬" },
  FINANCE:                 { label: "금융/은행/증권",     short: "금융",    emoji: "💰" },
  LAW:                     { label: "법조 (변호사·법무사)", short: "법조",  emoji: "⚖️" },
  ACCOUNTING_TAX:          { label: "회계/세무",          short: "회계세무", emoji: "📊" },
  PROFESSIONAL:            { label: "전문직",             short: "전문직",  emoji: "🎖️" },
  MEDICAL:                 { label: "의료/보건",          short: "의료",    emoji: "🏥" },
  EDUCATION:               { label: "교육 (교사·강사)",   short: "교육",    emoji: "📚" },
  RESEARCH:                { label: "연구/학술 (교수·연구원)", short: "연구", emoji: "🔬" },
  PUBLIC_OFFICIAL:         { label: "공무원/공공기관",    short: "공무원",  emoji: "🏛️" },
  MILITARY_POLICE:         { label: "군인/경찰/소방",     short: "군경",    emoji: "🚓" },
  SALES:                   { label: "영업/세일즈",        short: "영업",    emoji: "🤝" },
  SERVICE:                 { label: "서비스/유통/F&B",    short: "서비스",  emoji: "🍽️" },
  MANUFACTURING:           { label: "제조/엔지니어링",    short: "제조",    emoji: "🏭" },
  CONSTRUCTION_REALESTATE: { label: "건설/부동산",        short: "건설",    emoji: "🏗️" },
  TRADE_LOGISTICS:         { label: "무역/물류",          short: "물류",    emoji: "🚢" },
  ART_CULTURE:             { label: "예술/문화/스포츠",   short: "예술",    emoji: "🎭" },
  STARTUP_BUSINESS:        { label: "사업/창업/자영업",   short: "사업",    emoji: "🚀" },
  FREELANCE:               { label: "프리랜서",           short: "프리",    emoji: "🧑‍💻" },
  STUDENT:                 { label: "학생/취업준비",       short: "학생",    emoji: "🎓" },
  OTHER:                   { label: "기타",               short: "기타",    emoji: "•" },
};

/**
 * UI 노출 순서 — 직관적인 그룹핑(사무/디자인 → 미디어/금융 → 전문직 → 의료/연구/교육
 *  → 공공/판매 → 산업 → 사업/프리/학생 → legacy/기타).
 * PROFESSIONAL 은 legacy 라 옵션 리스트에서 숨기되 enum 값으로는 노출 가능.
 */
const ORDER: JobCategory[] = [
  "IT_DEVELOPMENT", "DESIGN", "PLANNING_STRATEGY", "MARKETING",
  "MEDIA", "FINANCE", "LAW", "ACCOUNTING_TAX",
  "MEDICAL", "EDUCATION", "RESEARCH",
  "PUBLIC_OFFICIAL", "MILITARY_POLICE",
  "SALES", "SERVICE", "MANUFACTURING",
  "CONSTRUCTION_REALESTATE", "TRADE_LOGISTICS",
  "ART_CULTURE", "STARTUP_BUSINESS", "FREELANCE", "STUDENT",
  "OTHER",
];

/** 풀 라벨 맵 (외부 호환용) */
export const JOB_CATEGORY_LABEL: Record<JobCategory, string> = Object.fromEntries(
  (Object.keys(META) as JobCategory[]).map(k => [k, META[k].label])
) as Record<JobCategory, string>;

/** 짧은 라벨 맵 (좁은 카드용) */
export const JOB_CATEGORY_SHORT: Record<JobCategory, string> = Object.fromEntries(
  (Object.keys(META) as JobCategory[]).map(k => [k, META[k].short])
) as Record<JobCategory, string>;

/** 옵션 리스트 — UI 순서 보장 + emoji 포함. legacy PROFESSIONAL 은 숨김. */
export const JOB_CATEGORY_OPTIONS: Array<{ value: JobCategory; label: string; short: string; emoji: string }> =
  ORDER
    .filter(v => v !== "PROFESSIONAL")
    .map(v => ({ value: v, label: META[v].label, short: META[v].short, emoji: META[v].emoji }));

/** enum value → 한글 라벨 (legacy PROFESSIONAL 포함, unknown 은 null) */
export function jobCategoryLabel(value: string | null | undefined, opts: { short?: boolean } = {}): string | null {
  if (!value) return null;
  const meta = META[value as JobCategory];
  if (!meta) return null;
  return opts.short ? meta.short : meta.label;
}
