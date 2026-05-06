/**
 * MatchHero — F01 HERO 섹션
 * MatchPairMark 확장판 + 애니메이션 점수 카운터
 */
import { useEffect, useRef, useState } from "react";
import { getColorTypeMeta, type ColorTypeKey } from "../../../lib/colorTypes";
import { cn } from "../ui/utils";

interface MatchHeroProps {
  myColor: ColorTypeKey | string;
  theirColor: ColorTypeKey | string;
  score: number;
  label: string;       // "보색 시너지" etc.
  theirName: string;
  className?: string;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    // Reset on target change
    setValue(0);
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

export function MatchHero({ myColor, theirColor, score, label, theirName, className }: MatchHeroProps) {
  const my    = getColorTypeMeta(myColor);
  const their = getColorTypeMeta(theirColor);
  const animScore = useCountUp(score);

  const myHsl    = `hsl(${my.h} ${my.s}% ${my.l}%)`;
  const theirHsl = `hsl(${their.h} ${their.s}% ${their.l}%)`;
  const mySoft   = `hsl(${my.h} ${my.s}% 92% / 0.12)`;
  const theirSoft= `hsl(${their.h} ${their.s}% 92% / 0.12)`;

  const scoreColor = score >= 80
    ? "hsl(var(--state-success))"
    : score >= 65
    ? "hsl(var(--brand))"
    : "hsl(var(--text-secondary))";

  return (
    <div className={cn("relative flex flex-col items-center pt-8 pb-6 overflow-hidden", className)}>
      {/* 배경 오라 (두 컬러 그라디언트) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 60% at 30% 50%, ${mySoft}, transparent 70%),
                       radial-gradient(ellipse 60% 60% at 70% 50%, ${theirSoft}, transparent 70%)`,
        }}
        aria-hidden
      />

      {/* 두 컬러 원형 + 연결 아크 */}
      <div className="relative flex items-center gap-3 z-10 mb-5">
        {/* My circle */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-16 h-16 rounded-full border-4 border-background shadow-card"
            style={{ backgroundColor: myHsl }}
            aria-label={`나의 컬러 타입: ${my.label}`}
          />
          <span className="text-caption font-medium" style={{ color: myHsl }}>
            나 · {my.label}
          </span>
        </div>

        {/* 연결 그라디언트 바 */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-16 h-3 rounded-pill"
            style={{ background: `linear-gradient(to right, ${myHsl}, ${theirHsl})` }}
          />
        </div>

        {/* Their circle */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-16 h-16 rounded-full border-4 border-background shadow-card"
            style={{ backgroundColor: theirHsl }}
            aria-label={`상대방 컬러 타입: ${their.label}`}
          />
          <span className="text-caption font-medium" style={{ color: theirHsl }}>
            {theirName} · {their.label}
          </span>
        </div>
      </div>

      {/* 시너지 라벨 */}
      <p className="text-body-sm font-semibold text-text-secondary mb-2 z-10">{label}</p>

      {/* 점수 카운터 */}
      <div
        className="z-10 flex items-baseline gap-1"
        aria-label={`궁합 ${score}점`}
        aria-live="polite"
      >
        <span className="text-display-lg font-bold" style={{ color: scoreColor }}>
          {animScore}
        </span>
        <span className="text-title font-semibold" style={{ color: scoreColor }}>%</span>
      </div>
      <p className="text-caption text-text-tertiary mt-0.5 z-10">컬러 궁합 점수</p>
    </div>
  );
}
