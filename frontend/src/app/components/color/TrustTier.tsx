/**
 * TrustTier — 신뢰도 등급 뱃지
 *
 * Bronze (0-40) / Silver (41-70) / Gold (71-100)
 *
 * <TrustTier score={85} />           → Gold 뱃지
 * <TrustTier score={55} showBar />   → Silver + 진행바
 * <TrustTier score={30} size="sm" /> → Bronze 소형 뱃지
 */
import { cn } from "../ui/utils";

export type TrustTierType = "bronze" | "silver" | "gold";

interface TrustTierProps {
  /** 0-100 신뢰도 점수 */
  score: number;
  size?: "sm" | "md" | "lg";
  /** 진행바 표시 여부 */
  showBar?: boolean;
  /** 점수 숫자 표시 여부 */
  showScore?: boolean;
  className?: string;
}

const TIER_META: Record<TrustTierType, {
  label: string;
  range: string;
  color: string;       // tailwind text class
  bg: string;          // tailwind bg class
  barColor: string;    // inline style color
}> = {
  bronze: {
    label: "Bronze",
    range: "0–40",
    color: "text-ct-orange-700",
    bg: "bg-ct-orange-50",
    barColor: "hsl(22 78% 40%)",
  },
  silver: {
    label: "Silver",
    range: "41–70",
    color: "text-ct-gray-700",
    bg: "bg-ct-gray-50",
    barColor: "hsl(220 10% 30%)",
  },
  gold: {
    label: "Gold",
    range: "71–100",
    color: "text-ct-yellow-700",
    bg: "bg-ct-yellow-50",
    barColor: "hsl(42 72% 38%)",
  },
};

function scoreToTier(score: number): TrustTierType {
  if (score >= 71) return "gold";
  if (score >= 41) return "silver";
  return "bronze";
}

export function TrustTier({
  score,
  size = "md",
  showBar = false,
  showScore = false,
  className,
}: TrustTierProps) {
  const tier = scoreToTier(score);
  const meta = TIER_META[tier];

  const badgeSizeMap = {
    sm: "px-2 py-0.5 text-caption rounded-md gap-1",
    md: "px-2.5 py-1 text-body-sm rounded-md gap-1.5",
    lg: "px-3 py-1.5 text-body rounded-lg gap-2",
  };

  const iconSizeMap = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const tierIcon = { bronze: "🥉", silver: "🥈", gold: "🥇" }[tier];

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      {/* 뱃지 */}
      <span className={cn("inline-flex items-center font-semibold", meta.bg, meta.color, badgeSizeMap[size])}>
        <span className={iconSizeMap[size]}>{tierIcon}</span>
        {meta.label}
        {showScore && <span className="ml-1 opacity-70 font-normal">{score}점</span>}
      </span>

      {/* 진행바 */}
      {showBar && (
        <div className="h-1 rounded-pill bg-surface-sunken overflow-hidden w-full min-w-[80px]">
          <div
            className="h-full rounded-pill transition-all duration-500"
            style={{
              width: `${score}%`,
              backgroundColor: meta.barColor,
            }}
          />
        </div>
      )}
    </div>
  );
}
