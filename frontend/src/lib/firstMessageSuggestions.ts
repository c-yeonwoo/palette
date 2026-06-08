/**
 * 첫 메시지 추천 — S-002.
 *
 * 매칭 성사 후 사용자가 처음 메시지를 보낼 때 막막함을 덜기 위해
 * 두 사람의 색 조합 기반 5개 후보 제안. 결정사 매니저가 코칭하던 영역을
 * 데이터 + LLM(향후) 으로 대체.
 *
 * 현재는 정적 풀 — 색의 personality 키워드 + 일반적인 첫 메시지 패턴 조합.
 * Phase 2: 두 사람 인터뷰 답변 기반 LLM 개인화 (S-003 백로그).
 *
 * 메시지 톤: 부담 없이 시작, 진정성 있게. 외모·외형 칭찬 X, 행동·취향 관찰 O.
 */
import type { ColorType } from "./colorCompatibility";

export interface MessageSuggestion {
  /** 메시지 본문 */
  text: string;
  /** 이 메시지의 톤·전략 (사용자 학습용) */
  rationale: string;
}

/** 색별 가장 잘 어울리는 "받는 사람" 톤 — 메시지 작성 시 참고. */
const RECEIVER_TONE: Record<ColorType, string> = {
  WARM_ORANGE: "활기차고 사교적인 분이라 가벼운 안부도 환영해요",
  CALM_BLUE: "신중한 분이라 진솔한 한 줄이 더 와닿아요",
  VIBRANT_RED: "직진을 좋아하는 분이라 분명한 의사가 좋아요",
  SOFT_PINK: "감수성이 높은 분이라 따뜻한 표현에 마음을 열어요",
  FRESH_GREEN: "균형감 있는 분이라 자연스러운 흐름을 선호해요",
  ELEGANT_PURPLE: "감각적인 분이라 취향을 묻는 질문이 좋아요",
  BRIGHT_YELLOW: "긍정적인 분이라 가벼운 유머가 잘 통해요",
  SOPHISTICATED_GRAY: "차분한 분이라 단정하고 진솔한 톤이 잘 맞아요",
};

/** 공통 baseline 5개 — 모든 조합에 노출. */
const BASELINE: MessageSuggestion[] = [
  {
    text: "안녕하세요! 소개로 연락드려요. 만나서 반가워요 :)",
    rationale: "가장 안전한 시작 — 부담 없고 깔끔",
  },
  {
    text: "프로필 잘 봤어요. 인사드리려고 메시지 남겨요. 시간 괜찮으실 때 천천히 답주셔도 돼요!",
    rationale: "상대의 시간을 존중하는 톤 — 부담 ↓",
  },
  {
    text: "안녕하세요! 소개 받았어요. 어떤 분이실지 궁금했는데 인사 먼저 드려요.",
    rationale: "호기심·관심 표현 — 자연스러운 진전",
  },
  {
    text: "처음 인사드려요. 혹시 주말에 시간 괜찮으시면 가벼운 차 한잔 어떠세요?",
    rationale: "데이트 제안 — 빠른 진행을 원할 때",
  },
  {
    text: "안녕하세요. 프로필에서 본 [관심사]가 인상 깊었어요. 한 번 얘기 나눠보고 싶어요!",
    rationale: "프로필 관찰 + 구체적 관심 — 진정성 ↑ (대괄호 부분 채우기)",
  },
];

/**
 * 두 사람 색 조합 기반 첫 메시지 후보.
 * 베타: BASELINE 5개 + 받는 사람 색별 톤 가이드 1개.
 */
export function suggestFirstMessages(
  myColor: ColorType | null | undefined,
  theirColor: ColorType | null | undefined,
): { suggestions: MessageSuggestion[]; receiverHint: string | null } {
  return {
    suggestions: BASELINE,
    receiverHint: theirColor ? RECEIVER_TONE[theirColor] : null,
  };
}
