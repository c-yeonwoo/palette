/**
 * 연애 스타일(introduction.datingStyle) 10문항 SoT — D-1/C-2 정리.
 *
 * 이전엔 MyProfileScreen 내부에만 매핑이 있어 ProfileDetailScreen 에선 enum 키
 * 그대로 노출됐다. 공통 lib 로 추출해 두 화면이 동일 라벨을 사용한다.
 */

export const DATING_STYLE_QUESTION_LABELS: Record<string, string> = {
  MEET_FREQUENCY: "만남 빈도",
  CONTACT_STYLE: "연락 스타일",
  DATE_STYLE: "데이트 스타일",
  DRINKING_DATE: "음주 스타일",
  OPPOSITE_FRIENDS: "이성 친구",
  LEAD_STYLE: "리드 스타일",
  CONFLICT_STYLE: "갈등 해결",
  AFFECTION_STYLE: "애정 표현",
  MARRIAGE_PLAN: "결혼 계획",
  SNS_PUBLIC: "SNS 공개",
};

export const DATING_STYLE_OPTION_LABELS: Record<string, string> = {
  WEEKLY_1_2: "주 1~2회",
  WEEKEND_TOGETHER: "주말은 같이 보내요",
  WHENEVER_POSSIBLE: "시간 될 때마다",
  FREQUENT: "자주 연락해요",
  DAILY_FEW: "하루 몇 번이면 충분",
  WHENEVER: "생각날 때 연락",
  OUTDOOR: "나들이·액티비티",
  INDOOR: "집·카페 인도어",
  MIX: "둘 다 좋아요",
  ENJOY: "술자리 즐겨요",
  SOMETIMES: "가끔 한 잔",
  NO_NEED: "없어도 충분해요",
  FREE: "자유롭게 OK",
  SOME_BOUNDARY: "어느 정도 선은 있어요",
  UNCOMFORTABLE: "적극적 연락은 불편해요",
  LEAD: "내가 리드하는 편",
  FOLLOW: "따라가는 편",
  ALTERNATE: "번갈아가며",
  TALK_NOW: "바로 대화해요",
  COOL_DOWN: "식히고 나서 얘기해요",
  LET_GO: "웬만하면 넘겨요",
  PHYSICAL: "스킨십으로",
  WORDS: "말·문자로",
  ACTIONS: "챙겨주는 것으로",
  SERIOUS_FAST: "빠르게 진지하게",
  SLOW_NATURAL: "천천히 자연스럽게",
  NOT_YET: "아직 생각 중",
  LOVE_IT: "커플 인증 좋아요",
  PRIVATE: "우리끼리만",
  FOLLOW_PARTNER: "상대 따라갈게요",
};

export function datingStyleQuestionLabel(key: string): string {
  return DATING_STYLE_QUESTION_LABELS[key] ?? key;
}

export function datingStyleOptionLabel(key: string): string {
  return DATING_STYLE_OPTION_LABELS[key] ?? key;
}
