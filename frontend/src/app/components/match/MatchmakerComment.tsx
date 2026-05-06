/**
 * MatchmakerComment — F01 주선자 한마디 카드
 */
import { Quote } from "lucide-react";
import type { MatchmakerInfo, MatchmakerTier } from "../../../data/mock-matches";
import { cn } from "../ui/utils";

const TIER_COLORS: Record<MatchmakerTier, string> = {
  Bronze:   "hsl(22 60% 45%)",
  Silver:   "hsl(220 10% 60%)",
  Gold:     "hsl(42 86% 46%)",
  Platinum: "hsl(268 56% 55%)",
};

const TIER_LABELS: Record<MatchmakerTier, string> = {
  Bronze:   "🥉 브론즈",
  Silver:   "🥈 실버",
  Gold:     "🥇 골드",
  Platinum: "💎 플래티넘",
};

interface MatchmakerCommentProps {
  matchmaker: MatchmakerInfo;
  /** true이면 "더보기" 버튼 표시 (F02 대화방으로 이동) */
  onMore?: () => void;
  className?: string;
}

export function MatchmakerComment({ matchmaker, onMore, className }: MatchmakerCommentProps) {
  const tierColor = TIER_COLORS[matchmaker.tier];

  return (
    <div className={cn("bg-surface shadow-card rounded-lg px-4 py-4", className)}>
      {/* 헤더: 아바타 + 이름 + 등급 */}
      <div className="flex items-center gap-3 mb-3">
        {matchmaker.avatarUrl ? (
          <img
            src={matchmaker.avatarUrl}
            alt={matchmaker.name}
            className="w-10 h-10 rounded-full object-cover shadow-soft flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-body font-bold shadow-soft"
            style={{ backgroundColor: tierColor }}
          >
            {matchmaker.name[0]}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-text-primary leading-snug">
            {matchmaker.name} 주선자
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-caption font-semibold"
              style={{ color: tierColor }}
            >
              {TIER_LABELS[matchmaker.tier]}
            </span>
            <span className="text-caption text-text-tertiary">
              성사 {matchmaker.successCount}건
            </span>
          </div>
        </div>
      </div>

      {/* 따옴표 박스 */}
      <div className="relative pl-5">
        <Quote
          className="absolute left-0 top-0.5 w-3.5 h-3.5 text-text-tertiary"
          aria-hidden
        />
        <p className="text-body-sm text-text-secondary leading-relaxed line-clamp-3">
          {matchmaker.comment}
        </p>
      </div>

      {onMore && (
        <button
          onClick={onMore}
          className="mt-3 text-caption font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          주선자와 대화하기 →
        </button>
      )}
    </div>
  );
}
