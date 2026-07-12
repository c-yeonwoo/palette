/**
 * MatchPairMark — 두 유저의 컬러타입 호환성 시각화
 *
 * <MatchPairMark
 *   myColor="orange"
 *   theirColor="blue"
 *   score={92}
 *   label="최고의 조합"
 * />
 */
import { cn } from "../ui/utils";
import { getColorTypeMeta, KEY_TO_UPPER, type ColorTypeKey } from "../../../lib/colorTypes";
import { getCompatibilityDeterministic } from "../../../lib/colorCompatibility";

interface MatchPairMarkProps {
  myColor: ColorTypeKey | string | null | undefined;
  theirColor: ColorTypeKey | string | null | undefined;
  /** 0-100 점수. undefined이면 getCompatibilityScore로 자동 계산 */
  score?: number;
  /** 짧은 조합 설명. undefined이면 자동 생성 */
  label?: string;
  showScore?: boolean;
  className?: string;
}

/** 궁합 점수 — 색 이론 기반 단일 알고리즘(colorCompatibility.ts)에 위임. 같은 색은 70점 고정. */
function computeScore(myKey: ColorTypeKey, theirKey: ColorTypeKey): number {
  if (myKey === theirKey) return 70;
  const result = getCompatibilityDeterministic(KEY_TO_UPPER[myKey], KEY_TO_UPPER[theirKey]);
  return result?.score ?? 65;
}

function scoreToLabel(score: number): string {
  if (score >= 90) return "최고의 조합";
  if (score >= 80) return "잘 어울려요";
  if (score >= 70) return "좋은 조합";
  return "흥미로운 조합";
}

function scoreToAccentClass(score: number): string {
  if (score >= 90) return "text-state-success";
  if (score >= 80) return "text-primary";
  if (score >= 70) return "text-text-secondary";
  return "text-text-tertiary";
}

export function MatchPairMark({
  myColor,
  theirColor,
  score: scoreProp,
  label: labelProp,
  showScore = true,
  className,
}: MatchPairMarkProps) {
  const my    = getColorTypeMeta(myColor);
  const their = getColorTypeMeta(theirColor);

  const score = scoreProp ?? computeScore(my.key, their.key);
  const label = labelProp ?? scoreToLabel(score);

  const myHsl    = `hsl(${my.h} ${my.s}% ${my.l}%)`;
  const theirHsl = `hsl(${their.h} ${their.s}% ${their.l}%)`;
  const mySoft   = `hsl(${my.h} ${my.s}% 93%)`;
  const theirSoft= `hsl(${their.h} ${their.s}% 93%)`;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* 두 색 원형 + 연결선 */}
      <div className="flex items-center gap-0">
        {/* My color */}
        <div
          className="w-8 h-8 rounded-full border-2 border-background flex-shrink-0 z-10"
          style={{ backgroundColor: myHsl }}
          aria-label={my.label}
        />
        {/* 연결 그라디언트 바 */}
        <div
          className="w-6 h-2 -mx-1 z-0 rounded-pill"
          style={{
            background: `linear-gradient(to right, ${myHsl}, ${theirHsl})`,
          }}
        />
        {/* Their color */}
        <div
          className="w-8 h-8 rounded-full border-2 border-background flex-shrink-0 z-10"
          style={{ backgroundColor: theirHsl }}
          aria-label={their.label}
        />
      </div>

      {/* 텍스트 */}
      <div className="min-w-0">
        <p className="text-body-sm font-semibold text-text-primary">{label}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-caption" style={{ color: myHsl }}>{my.label}</span>
          <span className="text-caption text-text-tertiary">+</span>
          <span className="text-caption" style={{ color: theirHsl }}>{their.label}</span>
          {showScore && (
            <>
              <span className="text-caption text-text-tertiary mx-0.5">·</span>
              <span className={cn("text-caption font-bold", scoreToAccentClass(score))}>
                {score}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
