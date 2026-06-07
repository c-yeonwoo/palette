/**
 * 직군(CareerCategory) enum ↔ 한글 라벨 단일 소스.
 *
 * 백엔드는 enum value (예: "IT_DEVELOPMENT")를 그대로 내려주므로,
 * UI 표시 시 항상 이 헬퍼를 통과시켜 한글 라벨로 변환한다.
 *
 * 옛 인라인 jobMap 매핑이 화면별로 흩어져 있어 (MainFeed/AiHub/ProfileDetail/ProfileEdit/MyProfile),
 * 누락된 화면에선 IT_DEVELOPMENT 같은 raw enum이 그대로 노출되는 문제가 있었음.
 * → 이 파일을 SoT로 두고 모든 사용처가 import.
 */

export type JobCategory =
  | "IT_DEVELOPMENT"
  | "FINANCE"
  | "EDUCATION"
  | "MEDICAL"
  | "MEDIA"
  | "SERVICE"
  | "MANUFACTURING"
  | "PUBLIC_OFFICIAL"
  | "PROFESSIONAL"
  | "OTHER";

/** 화면 노출용 한글 라벨 (피드 카드·상세·요약 등) */
export const JOB_CATEGORY_LABEL: Record<JobCategory, string> = {
  IT_DEVELOPMENT: "IT/개발",
  FINANCE: "금융/보험",
  EDUCATION: "교육",
  MEDICAL: "의료/보건",
  MEDIA: "미디어/엔터",
  SERVICE: "서비스/영업",
  MANUFACTURING: "제조/생산",
  PUBLIC_OFFICIAL: "공무원/공공기관",
  PROFESSIONAL: "전문직",
  OTHER: "기타",
};

/** 짧은 라벨 (좁은 칩/카드용 — 슬래시 앞쪽 키워드만) */
export const JOB_CATEGORY_SHORT: Record<JobCategory, string> = {
  IT_DEVELOPMENT: "IT개발",
  FINANCE: "금융",
  EDUCATION: "교육",
  MEDICAL: "의료",
  MEDIA: "미디어",
  SERVICE: "서비스",
  MANUFACTURING: "제조",
  PUBLIC_OFFICIAL: "공무원",
  PROFESSIONAL: "전문직",
  OTHER: "기타",
};

/** 옵션 리스트(셀렉트/필터 UI) — { value, label } 배열 */
export const JOB_CATEGORY_OPTIONS: Array<{ value: JobCategory; label: string }> =
  (Object.keys(JOB_CATEGORY_LABEL) as JobCategory[]).map(value => ({
    value,
    label: JOB_CATEGORY_LABEL[value],
  }));

/**
 * enum value → 한글 라벨. unknown 값이면 null (raw enum 노출 방지).
 * 좁은 공간(피드 카드 한 줄 등)엔 short=true 로 짧은 버전 사용.
 */
export function jobCategoryLabel(value: string | null | undefined, opts: { short?: boolean } = {}): string | null {
  if (!value) return null;
  const map = opts.short ? JOB_CATEGORY_SHORT : JOB_CATEGORY_LABEL;
  return map[value as JobCategory] ?? null;
}
