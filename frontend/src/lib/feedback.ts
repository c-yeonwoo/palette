/**
 * feedback.ts — F09 만남 후기 / 매너 평가 데이터 모델 & 유틸
 */

export type MannerKeyword =
  | "punctual"
  | "kind"
  | "good_talker"
  | "photo_match"
  | "respectful"
  | "fun"
  | "attentive"
  | "honest"
  | "late"
  | "rude"
  | "photo_mismatch"
  | "pushy"
  | "commercial";

export type OverallRating = "good" | "okay" | "bad";

export interface MeetFeedback {
  id: string;
  matchId: string;
  reviewerId: string;
  revieweeId: string;
  overall: OverallRating;
  keywords: MannerKeyword[];
  comment?: string;
  createdAt: string;
}

/** 키워드 메타 (한국어 라벨 + 긍/부 분류) */
export interface KeywordMeta {
  key: MannerKeyword;
  label: string;
  emoji: string;
  positive: boolean;
}

export const KEYWORD_META: KeywordMeta[] = [
  // 긍정 (8)
  { key: "punctual",    label: "시간 약속",   emoji: "⏰", positive: true  },
  { key: "kind",        label: "친절함",       emoji: "😊", positive: true  },
  { key: "good_talker", label: "대화가 잘 됨", emoji: "💬", positive: true  },
  { key: "photo_match", label: "사진과 동일",  emoji: "📸", positive: true  },
  { key: "respectful",  label: "매너 있음",    emoji: "🙏", positive: true  },
  { key: "fun",         label: "유쾌함",       emoji: "😄", positive: true  },
  { key: "attentive",   label: "배려심",       emoji: "💝", positive: true  },
  { key: "honest",      label: "솔직함",       emoji: "✨", positive: true  },
  // 부정 (5) — 한 번에 1개만 선택 가능
  { key: "late",          label: "시간 미준수", emoji: "⏱️", positive: false },
  { key: "rude",          label: "무례함",      emoji: "😔", positive: false },
  { key: "photo_mismatch",label: "사진과 다름", emoji: "🙈", positive: false },
  { key: "pushy",         label: "강요",        emoji: "🚫", positive: false },
  { key: "commercial",    label: "상업 목적",   emoji: "💼", positive: false },
];

export const POSITIVE_KEYWORDS = KEYWORD_META.filter((k) => k.positive);
export const NEGATIVE_KEYWORDS = KEYWORD_META.filter((k) => !k.positive);

/** 전체 표시 메시지 */
export const OVERALL_META: Record<
  OverallRating,
  { label: string; emoji: string; color: string }
> = {
  good: { label: "좋은 만남이었어요", emoji: "😊",  color: "hsl(var(--state-success))" },
  okay: { label: "보통이었어요",       emoji: "😐",  color: "hsl(var(--text-secondary))" },
  bad:  { label: "아쉬운 만남이었어요",emoji: "😕",  color: "hsl(var(--state-danger))" },
};

/** 매너 점수 산정 (키워드 가중합) */
export function calcMannerScore(feedbacks: MeetFeedback[]): number {
  if (feedbacks.length === 0) return 70; // 기본값
  let score = 70;
  for (const fb of feedbacks) {
    for (const kw of fb.keywords) {
      const meta = KEYWORD_META.find((m) => m.key === kw);
      if (!meta) continue;
      score += meta.positive ? 3 : -5;
    }
    if (fb.overall === "good") score += 5;
    if (fb.overall === "bad")  score -= 8;
  }
  return Math.min(100, Math.max(0, Math.round(score)));
}

/** 매너 인증 뱃지 조건: 긍정 키워드 누적 10개 이상 */
export function hasMannerBadge(feedbacks: MeetFeedback[]): boolean {
  const positiveCount = feedbacks
    .flatMap((f) => f.keywords)
    .filter((kw) => POSITIVE_KEYWORDS.some((p) => p.key === kw)).length;
  return positiveCount >= 10;
}

/** Mock 후기 5건 */
export const MOCK_FEEDBACKS: MeetFeedback[] = [
  {
    id: "fb-001",
    matchId: "match-001",
    reviewerId: "user-partner-001",
    revieweeId: "me-001",
    overall: "good",
    keywords: ["punctual", "good_talker", "photo_match", "fun"],
    comment: "정말 편하게 대화할 수 있었어요. 또 만나고 싶네요 :)",
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "fb-002",
    matchId: "match-001",
    reviewerId: "user-partner-002",
    revieweeId: "me-001",
    overall: "good",
    keywords: ["kind", "respectful", "attentive"],
    comment: "",
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "fb-003",
    matchId: "match-002",
    reviewerId: "user-partner-003",
    revieweeId: "me-001",
    overall: "okay",
    keywords: ["honest", "photo_match"],
    comment: "분위기는 괜찮았는데 공통 관심사가 부족했어요.",
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "fb-004",
    matchId: "match-002",
    reviewerId: "user-partner-004",
    revieweeId: "me-001",
    overall: "good",
    keywords: ["punctual", "kind", "fun", "good_talker"],
    comment: "",
    createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "fb-005",
    matchId: "match-003",
    reviewerId: "user-partner-005",
    revieweeId: "me-001",
    overall: "good",
    keywords: ["attentive", "honest", "respectful"],
    comment: "너무 배려해주셔서 감동받았어요 ✨",
    createdAt: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
  },
];
