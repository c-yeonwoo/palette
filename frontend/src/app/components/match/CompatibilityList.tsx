/**
 * CompatibilityList — F01 공통점 / 다른 점 리스트
 * variant: "common" → 초록 체크 / "different" → 오렌지 다이아몬드
 */
import { CheckCircle2, Diamond } from "lucide-react";
import type { CompatibilityPoint } from "../../../data/mock-matches";
import { cn } from "../ui/utils";

interface CompatibilityListProps {
  variant: "common" | "different";
  points: CompatibilityPoint[];
  className?: string;
}

export function CompatibilityList({ variant, points, className }: CompatibilityListProps) {
  const filtered = points.filter((p) => p.type === variant);
  if (filtered.length === 0) return null;

  const isCommon = variant === "common";
  const Icon = isCommon ? CheckCircle2 : Diamond;
  const iconClass = isCommon ? "text-state-success" : "text-brand";
  const title = isCommon ? "✦ 우리의 공통점" : "◈ 우리의 다른 점";
  const subtitle = isCommon
    ? "공감대가 높아요"
    : "서로 다른 점이 더 매력적이에요";

  return (
    <div className={cn("bg-surface shadow-card rounded-lg px-4 py-4", className)}>
      <div className="mb-3">
        <h3 className="text-body font-semibold text-text-primary">{title}</h3>
        <p className="text-caption text-text-tertiary mt-0.5">{subtitle}</p>
      </div>
      <ul className="space-y-2.5">
        {filtered.map((pt, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Icon
              className={cn("w-4 h-4 flex-shrink-0 mt-0.5", iconClass)}
              aria-hidden
            />
            <div className="min-w-0">
              <span className="text-body-sm font-medium text-text-primary">
                {pt.label}
              </span>
              {pt.detail && (
                <span className="ml-1.5 text-caption text-text-tertiary">
                  {pt.detail}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
