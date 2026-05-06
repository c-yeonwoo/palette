import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "./utils";

/**
 * ListRow — 수평 정보 행 (설정 목록, 프로필 항목 등)
 *
 * <ListRow label="이메일" value="user@example.com" />
 * <ListRow label="알림" leading={<Bell />} trailing={<Toggle />} />
 * <ListRow label="프로필 편집" onClick={...} showChevron />
 */
interface ListRowProps {
  label: string;
  sublabel?: string;
  value?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  /** 행 하단에 border 표시 여부 (기본 true) */
  bordered?: boolean;
}

function ListRow({
  label,
  sublabel,
  value,
  leading,
  trailing,
  showChevron,
  onClick,
  disabled = false,
  className,
  bordered = true,
}: ListRowProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 px-0 py-3.5 text-left transition-colors",
        bordered && "border-b border-border-subtle last:border-b-0",
        onClick && !disabled && "hover:bg-surface-sunken -mx-4 px-4 rounded-md cursor-pointer",
        disabled && "opacity-40 pointer-events-none",
        className,
      )}
    >
      {leading && (
        <span className="flex-shrink-0 w-5 h-5 text-text-tertiary flex items-center justify-center">
          {leading}
        </span>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-text-primary leading-snug">{label}</p>
        {sublabel && (
          <p className="text-caption text-text-tertiary mt-0.5">{sublabel}</p>
        )}
      </div>

      {value !== undefined && (
        <span className="text-body-sm text-text-secondary flex-shrink-0">{value}</span>
      )}

      {trailing && <span className="flex-shrink-0">{trailing}</span>}

      {showChevron && (
        <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
      )}
    </Comp>
  );
}

export { ListRow };
