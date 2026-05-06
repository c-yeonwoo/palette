import * as React from "react";
import { cn } from "./utils";

/**
 * SectionHeader — 섹션 제목 + 서브타이틀 + 우측 액션 영역
 *
 * <SectionHeader title="후기" subtitle="최근 3개월" action={<Button size="sm">더보기</Button>} />
 */
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <p className="text-body font-semibold text-text-primary leading-snug">{title}</p>
        {subtitle && (
          <p className="text-caption text-text-tertiary mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export { SectionHeader };
