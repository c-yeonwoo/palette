/**
 * BetaWelcomeIntro — 베타 코드 통과 후 로그인 화면 전 잠깐 보이는 3-slide 인트로.
 *
 * 목적:
 *  - "왜 이 앱을 써야 하는지" 핵심 가치 각인
 *  - 다른 데이팅 앱과의 차별점 (지인 네트워크) 부각
 *  - 베타 진행 상태 안내
 *
 * 동작:
 *  - localStorage("palette_intro_seen") 으로 한 번만 노출
 *  - "시작하기" 클릭 시 onDone() → 로그인 화면으로
 *  - "건너뛰기" 도 동일하게 onDone()
 */

import { useState } from "react";
import { Button } from "./ui/button";

const INTRO_SEEN_KEY = "palette_intro_seen";

interface BetaWelcomeIntroProps {
  onDone: () => void;
}

const slides = [
  {
    emoji: "🎨",
    title: "나만의 색을 찾아요",
    desc: "AI 인터뷰로 3분이면 끝.\n8가지 컬러로 나의 매력을 표현해요.",
    bg: "from-orange-50 to-pink-50",
  },
  {
    emoji: "🫂",
    title: "지인이 보증하는 만남",
    desc: "모르는 사람보다 친구의 친구부터.\n익명 데이팅 앱과 가장 큰 차이예요.",
    bg: "from-blue-50 to-purple-50",
  },
  {
    emoji: "💝",
    title: "친구를 이어주는 보람",
    desc: "믿을 수 있는 지인이 직접 소개하는 만남.\n성사할수록 주선자 등급과 명예가 쌓여요.",
    bg: "from-green-50 to-yellow-50",
  },
];

export function BetaWelcomeIntro({ onDone }: BetaWelcomeIntroProps) {
  const [idx, setIdx] = useState(0);
  const isLast = idx === slides.length - 1;
  const slide = slides[idx];

  const handleDone = () => {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
    onDone();
  };

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br ${slide.bg} transition-colors duration-500`}>
      {/* 상단 건너뛰기 */}
      <div className="flex justify-end px-6 py-4">
        <button
          onClick={handleDone}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          건너뛰기
        </button>
      </div>

      {/* 슬라이드 본문 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-7xl mb-8 animate-bounce">{slide.emoji}</div>
        <h1 className="text-2xl font-bold text-foreground mb-4">{slide.title}</h1>
        <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
          {slide.desc}
        </p>
      </div>

      {/* 진행 인디케이터 */}
      <div className="flex justify-center gap-2 pb-6">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-8 bg-foreground" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* 하단 CTA */}
      <div className="px-6 pb-10 space-y-3">
        <Button
          onClick={isLast ? handleDone : () => setIdx(idx + 1)}
          className="w-full h-12 text-sm font-semibold"
        >
          {isLast ? "시작하기 🎨" : "다음"}
        </Button>
        {idx > 0 && (
          <button
            onClick={() => setIdx(idx - 1)}
            className="w-full text-sm text-muted-foreground"
          >
            이전
          </button>
        )}
      </div>
    </div>
  );
}

/** 인트로 봤는지 체크 (앱 부팅 시 사용) */
export function hasIntroSeen(): boolean {
  return localStorage.getItem(INTRO_SEEN_KEY) === "1";
}
