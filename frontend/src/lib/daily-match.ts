/**
 * daily-match.ts — F08 데일리 컬러 매칭 로직
 *
 * 오늘 날짜 + 내 컬러 타입 → 추천 컬러 타입 + 사랑운 점수 + 메시지 결정론적 계산.
 *
 * 알고리즘:
 *   1. 오늘의 dayOfYear 계산
 *   2. 내 컬러 인덱스 + dayOfYear 합산 → mod 8 → 추천 타입 선택
 *      (단, 자기 자신은 제외)
 *   3. 사랑운 점수 = (dayOfYear * 37 + myTypeIndex * 13) % 41 + 60  (60~100)
 *   4. 메시지 풀에서 score 구간별 메시지 선택
 */

import type { ColorTypeKey } from "./colorTypes";

const COLOR_TYPE_ORDER: ColorTypeKey[] = [
  "orange", "blue", "red", "pink", "green", "purple", "yellow", "gray",
];

/** 오늘 날짜 기반으로 1~365 사이의 dayOfYear 반환 */
function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export interface DailyFortune {
  recommendedType: ColorTypeKey;
  loveScore: number;    // 60~100
  message: string;
  subMessage: string;
}

const MESSAGES: { min: number; max: number; message: string; subMessage: string }[] = [
  {
    min: 95, max: 100,
    message: "오늘은 운명적인 만남이 찾아올 수 있어요 💫",
    subMessage: "지금 바로 메시지를 보내보세요. 후회하지 않을 거예요!",
  },
  {
    min: 88, max: 94,
    message: "오늘 사랑운이 최고조예요 ✨",
    subMessage: "소개받은 분께 먼저 말을 걸어보면 어떨까요?",
  },
  {
    min: 80, max: 87,
    message: "오늘 새로운 인연과 특별한 순간을 만들 수 있어요 🌸",
    subMessage: "프로필을 한번 더 확인해보세요. 좋은 분이 기다리고 있을지도!",
  },
  {
    min: 72, max: 79,
    message: "오늘은 느긋하게 인연을 살펴보는 날이에요 🌿",
    subMessage: "서두르지 않아도 괜찮아요. 꼼꼼히 살펴보세요.",
  },
  {
    min: 60, max: 71,
    message: "오늘은 차분하게 내 취향을 정리하는 날이에요 🔵",
    subMessage: "어떤 분이 나에게 어울릴지 천천히 생각해봐요.",
  },
];

function pickMessage(score: number) {
  return (
    MESSAGES.find((m) => score >= m.min && score <= m.max) ?? MESSAGES[MESSAGES.length - 1]
  );
}

/**
 * 오늘의 컬러 포춘 계산.
 *
 * @param myColorType 내 컬러 타입 (없으면 "orange" fallback)
 */
export function getDailyFortune(myColorType: ColorTypeKey = "orange"): DailyFortune {
  const dayOfYear = getDayOfYear();
  const myIdx = COLOR_TYPE_ORDER.indexOf(myColorType);
  const safeMyIdx = myIdx === -1 ? 0 : myIdx;

  // 추천 타입 (자기 자신 제외)
  let recIdx = (safeMyIdx + (dayOfYear % 7) + 1) % 8;
  if (recIdx === safeMyIdx) recIdx = (recIdx + 1) % 8;
  const recommendedType = COLOR_TYPE_ORDER[recIdx];

  // 사랑운 점수 60~100
  const raw = (dayOfYear * 37 + safeMyIdx * 13) % 41;
  const loveScore = 60 + raw;

  const { message, subMessage } = pickMessage(loveScore);

  return { recommendedType, loveScore, message, subMessage };
}
