import * as React from "react";
import { cn } from "./utils";

/**
 * StatBlock — 수치 + 레이블 메트릭 블록
 *
 * <StatBlock value="4.9" label="평균 평점" icon={<Star />} />
 * <StatBlock value={23} label="성공 쌍" emphasis />
 */
interface StatBlockProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  /** emphasis: value를 브랜드 색상으로 강조 */
  emphasis?: boolean;
  className?: string;
}

function StatBlock({ value, label, icon, emphasis = false, className }: StatBlockProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className={cn(
        "flex items-center gap-1 text-title font-bold",
        emphasis ? "text-primary" : "text-text-primary",
      )}>
        {icon && <span className="w-4 h-4 flex-shrink-0 text-primary">{icon}</span>}
        <span>{value}</span>
      </div>
      <span className="text-caption text-text-tertiary">{label}</span>
    </div>
  );
}

/**
 * StatRow — StatBlock을 수평으로 나열하는 컨테이너
 * divider-x가 자동으로 붙음
 */
function StatRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "grid divide-x divide-border-subtle border-y border-border-subtle",
      "[&>*]:py-4",
      className,
    )}
    style={{ gridTemplateColumns: `repeat(auto-fit, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

export { StatBlock, StatRow };
