/**
 * Palette — Color Type 진단 문항 정의
 *
 * 14개 문항을 4개 차원(EI, FT, SN, AP)으로 분류합니다.
 * - EI (Q1~Q4): 외향(1) ↔ 내향(0)
 * - FT (Q5~Q8): 감성(1) ↔ 이성(0)
 * - SN (Q9~Q11): 모험(1) ↔ 안정(0)
 * - AP (Q12~Q14): 능동(1) ↔ 수용(0)
 *
 * 각 보기의 score는 해당 차원에서의 경향 강도 (0.0 ~ 1.0).
 */

/** 진단 차원 */
export type Dimension = "EI" | "FT" | "SN" | "AP";

/** 보기 하나 */
export interface Option {
  /** 보기 텍스트 */
  text: string;
  /**
   * 해당 차원 방향 점수 (0.0 ~ 1.0)
   * - EI: 0=내향, 1=외향
   * - FT: 0=이성, 1=감성
   * - SN: 0=안정, 1=모험
   * - AP: 0=수용, 1=능동
   */
  score: number;
}

/** 문항 하나 */
export interface Question {
  /** 문항 번호 (1-14) */
  id: number;
  /** 질문 텍스트 */
  text: string;
  /** 측정 차원 */
  dimension: Dimension;
  /** 보기 4개 (A~D 순서) */
  options: [Option, Option, Option, Option];
}

/** 14개 진단 문항 */
export const QUESTIONS: Question[] = [
  // ── EI (Q1~Q4): 외향 ↔ 내향 ──────────────────────────────
  {
    id: 1,
    text: "모임에서 나는 주로...",
    dimension: "EI",
    options: [
      { text: "자연스럽게 대화를 이끈다", score: 1.0 },
      { text: "마음 맞는 몇 명과 깊게 얘기한다", score: 0.6 },
      { text: "조용히 듣다가 필요할 때 말한다", score: 0.3 },
      { text: "관찰하다 적당한 타이밍에 자리를 뜬다", score: 0.0 },
    ],
  },
  {
    id: 2,
    text: "갑자기 모임 초대를 받으면?",
    dimension: "EI",
    options: [
      { text: "신난다, 바로 출발", score: 1.0 },
      { text: "누가 오는지 먼저 확인한다", score: 0.6 },
      { text: "집이 더 좋지만 가본다", score: 0.3 },
      { text: "다음에 보자 한다", score: 0.0 },
    ],
  },
  {
    id: 3,
    text: "에너지를 보충하는 방식은?",
    dimension: "EI",
    options: [
      { text: "사람들과 어울리며 재충전", score: 1.0 },
      { text: "가볍게 외출 + 카페", score: 0.6 },
      { text: "집에서 혼자 쉬기", score: 0.3 },
      { text: "완전한 고요함 속에서", score: 0.0 },
    ],
  },
  {
    id: 4,
    text: "처음 보는 자리에서 나는?",
    dimension: "EI",
    options: [
      { text: "먼저 말을 건다", score: 1.0 },
      { text: "분위기 보다가 낀다", score: 0.6 },
      { text: "상대가 먼저 오면 반기는 편", score: 0.3 },
      { text: "소개받을 때까지 기다린다", score: 0.0 },
    ],
  },

  // ── FT (Q5~Q8): 감성 ↔ 이성 ──────────────────────────────
  {
    id: 5,
    text: "친구의 고민을 들으면?",
    dimension: "FT",
    options: [
      { text: "우선 공감하고 같이 속상해한다", score: 1.0 },
      { text: "공감 + 현실적 조언 섞기", score: 0.6 },
      { text: "원인 파악 후 해결책 제시", score: 0.3 },
      { text: "바로 결론부터 말한다", score: 0.0 },
    ],
  },
  {
    id: 6,
    text: "영화 보다 눈물이 날 것 같다면?",
    dimension: "FT",
    options: [
      { text: "감추지 않는다", score: 1.0 },
      { text: "몰래 훔친다", score: 0.6 },
      { text: "꾹 참는다", score: 0.3 },
      { text: "거의 안 운다", score: 0.0 },
    ],
  },
  {
    id: 7,
    text: "결정할 때 주로 따르는 기준은?",
    dimension: "FT",
    options: [
      { text: "마음이 끌리는 방향", score: 1.0 },
      { text: "내 감정 + 객관 정보 혼합", score: 0.6 },
      { text: "데이터·논리 우선", score: 0.3 },
      { text: "최적 효율 계산", score: 0.0 },
    ],
  },
  {
    id: 8,
    text: "말이 상처가 됐을 때 나는?",
    dimension: "FT",
    options: [
      { text: "솔직하게 표현한다", score: 1.0 },
      { text: "말하긴 하지만 조심스럽게", score: 0.6 },
      { text: "속으로 삭히고 넘긴다", score: 0.3 },
      { text: "별로 신경 쓰지 않는다", score: 0.0 },
    ],
  },

  // ── SN (Q9~Q11): 모험 ↔ 안정 ─────────────────────────────
  {
    id: 9,
    text: "여행 스타일은?",
    dimension: "SN",
    options: [
      { text: "맛집·명소 철저한 계획", score: 0.0 },
      { text: "큰 일정만 잡고 현장 판단", score: 0.3 },
      { text: "대략만 정하고 즉흥으로", score: 0.7 },
      { text: "항공권만 끊고 아무것도 안 잡는다", score: 1.0 },
    ],
  },
  {
    id: 10,
    text: "루틴에 대한 나의 태도는?",
    dimension: "SN",
    options: [
      { text: "루틴이 삶의 중심", score: 0.0 },
      { text: "있으면 좋지만 유동적이어도 됨", score: 0.3 },
      { text: "루틴은 지루함, 변화가 좋다", score: 0.7 },
      { text: "매일 달라야 살아있는 느낌", score: 1.0 },
    ],
  },
  {
    id: 11,
    text: "새로운 기회가 생겼을 때?",
    dimension: "SN",
    options: [
      { text: "리스크 먼저 따진다", score: 0.0 },
      { text: "신중히 검토 후 결정", score: 0.3 },
      { text: "흥미로우면 일단 뛰어든다", score: 0.7 },
      { text: "무조건 해본다, 안 되면 그때 생각", score: 1.0 },
    ],
  },

  // ── AP (Q12~Q14): 능동 ↔ 수용 ────────────────────────────
  {
    id: 12,
    text: "목표가 생겼을 때 나는?",
    dimension: "AP",
    options: [
      { text: "즉시 실행 계획 세우고 추진", score: 1.0 },
      { text: "계획은 세우되 천천히", score: 0.6 },
      { text: "마음에 품고 기다린다", score: 0.3 },
      { text: "자연스럽게 흘러가길 바란다", score: 0.0 },
    ],
  },
  {
    id: 13,
    text: "대화에서 나는 주로?",
    dimension: "AP",
    options: [
      { text: "의견을 먼저 제시한다", score: 1.0 },
      { text: "의견 있으면 적극적으로 말한다", score: 0.6 },
      { text: "상대 이야기 먼저 듣는다", score: 0.3 },
      { text: "결론 날 때까지 조용히 듣는다", score: 0.0 },
    ],
  },
  {
    id: 14,
    text: "불합리한 상황에서 나는?",
    dimension: "AP",
    options: [
      { text: "바로 지적하고 바꾸려 한다", score: 1.0 },
      { text: "상황 보다가 말한다", score: 0.6 },
      { text: "적응하거나 우회로 찾는다", score: 0.3 },
      { text: "크게 신경 쓰지 않는다", score: 0.0 },
    ],
  },
];
