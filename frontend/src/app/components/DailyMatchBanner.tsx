/**
 * DailyMatchBanner — F08 데일리 컬러 매칭 배너
 *
 * 오늘 날짜 + 내 컬러 타입 → 추천 컬러 타입 + 사랑운 점수 + 메시지
 * 접기/펼치기 토글, 펼쳐진 상태에서 오늘의 추천 프로필 링크
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { getColorTypeMeta } from "../../lib/colorTypes";
import { getDailyFortune, getMyColorType } from "../../lib/daily-match";
import { cn } from "./ui/utils";

interface DailyMatchBannerProps {
  /** 추천 프로필 보기 클릭 콜백 */
  onViewRecommended?: () => void;
  className?: string;
}

export function DailyMatchBanner({ onViewRecommended, className }: DailyMatchBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const myColorType = getMyColorType();
  const { recommendedType, loveScore, message, subMessage } = getDailyFortune(myColorType);

  const myMeta  = getColorTypeMeta(myColorType);
  const recMeta = getColorTypeMeta(recommendedType);

  const myHsl  = `hsl(${myMeta.h} ${myMeta.s}% ${myMeta.l}%)`;
  const recHsl = `hsl(${recMeta.h} ${recMeta.s}% ${recMeta.l}%)`;

  // 점수 바 색상
  const barColor =
    loveScore >= 88 ? "hsl(var(--state-success))"
    : loveScore >= 75 ? "hsl(var(--brand))"
    : "hsl(var(--text-tertiary))";

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden shadow-card transition-all duration-300",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${myMeta.h} ${myMeta.s}% 95%), hsl(${recMeta.h} ${recMeta.s}% 95%))`,
      }}
    >
      {/* ── 접힌 헤더 ── */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* 두 컬러 원 */}
        <div className="flex items-center -space-x-1.5 flex-shrink-0">
          <div
            className="w-7 h-7 rounded-full border-2 border-white shadow-soft"
            style={{ backgroundColor: myHsl }}
          />
          <div
            className="w-7 h-7 rounded-full border-2 border-white shadow-soft"
            style={{ backgroundColor: recHsl }}
          />
        </div>

        <div className="flex-1 text-left">
          <p className="text-caption font-semibold text-text-primary flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand" />
            오늘의 컬러 궁합
          </p>
          <p className="text-caption text-text-secondary truncate">{message}</p>
        </div>

        {/* 점수 + 토글 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-body font-bold" style={{ color: barColor }}>
            {loveScore}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-tertiary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          )}
        </div>
      </button>

      {/* ── 펼쳐진 상세 ── */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* 내 타입 ↔ 추천 타입 */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-12 rounded-full border-3 border-white shadow-card"
                style={{ backgroundColor: myHsl }}
              />
              <span className="text-caption font-medium" style={{ color: myHsl }}>
                나 · {myMeta.label}
              </span>
            </div>

            {/* 그라디언트 연결 바 */}
            <div
              className="flex-1 h-2 rounded-pill max-w-[80px]"
              style={{
                background: `linear-gradient(to right, ${myHsl}, ${recHsl})`,
              }}
            />

            <div className="flex flex-col items-center gap-1">
              <div
                className="w-12 h-12 rounded-full border-3 border-white shadow-card"
                style={{ backgroundColor: recHsl }}
              />
              <span className="text-caption font-medium" style={{ color: recHsl }}>
                추천 · {recMeta.label}
              </span>
            </div>
          </div>

          {/* 사랑운 바 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-caption text-text-secondary">오늘의 사랑운</span>
              <span className="text-caption font-bold" style={{ color: barColor }}>
                {loveScore}점
              </span>
            </div>
            <div className="h-2 bg-white/50 rounded-pill overflow-hidden">
              <div
                className="h-full rounded-pill transition-all duration-700"
                style={{ width: `${loveScore}%`, backgroundColor: barColor }}
              />
            </div>
          </div>

          {/* 메시지 */}
          <p className="text-caption text-text-secondary text-center">{subMessage}</p>

          {/* CTA */}
          {onViewRecommended && (
            <button
              onClick={onViewRecommended}
              className="w-full py-2.5 rounded-xl text-body-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
              style={{
                background: `linear-gradient(to right, ${myHsl}, ${recHsl})`,
              }}
            >
              오늘의 추천 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
