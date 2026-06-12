import { type ReactNode } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { cn } from "./ui/utils";

const TONE = {
  muted: "text-muted-foreground",
  amber: "text-amber-700",
  primary: "text-primary",
} as const;

/**
 * 긴 안내문구를 한 줄 요약 + ⓘ 아이콘으로 압축하는 공통 힌트.
 * 탭/호버하면 Popover 로 상세를 펼친다 (모바일에서도 탭으로 동작).
 *
 *   <InfoHint summary="앱 내 팁으로만 감사 표시" tone="amber" title="안전 안내">
 *     상세 설명…
 *   </InfoHint>
 */
export function InfoHint({
  summary,
  title,
  tone = "muted",
  className,
  contentClassName,
  children,
}: {
  /** 항상 보이는 한 줄 요약 (생략 시 아이콘만) */
  summary?: string;
  /** Popover 안 굵은 제목 */
  title?: string;
  tone?: keyof typeof TONE;
  className?: string;
  contentClassName?: string;
  /** Popover 안 상세 내용 */
  children: ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 text-[11px] leading-tight hover:opacity-70 transition-opacity",
            TONE[tone],
            className,
          )}
        >
          {summary && <span>{summary}</span>}
          <Info className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-64 text-[11px] leading-relaxed text-muted-foreground", contentClassName)}
      >
        {title && <p className="font-semibold text-foreground mb-1">{title}</p>}
        {children}
      </PopoverContent>
    </Popover>
  );
}
