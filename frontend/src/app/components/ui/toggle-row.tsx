import * as React from "react";
import { cn } from "./utils";

/**
 * ToggleRow — 라벨 + 서브레이블 + Switch를 한 행으로 묶는 래퍼
 *
 * shadcn Switch를 직접 import하지 않고 external slot으로 받아
 * 모든 Switch 구현과 호환됩니다.
 *
 * <ToggleRow
 *   label="푸시 알림"
 *   description="매칭 요청 및 업데이트 알림을 받아요"
 *   control={<Switch checked={val} onCheckedChange={set} />}
 * />
 */
interface ToggleRowProps {
  label: string;
  description?: string;
  control: React.ReactNode;
  disabled?: boolean;
  bordered?: boolean;
  className?: string;
}

function ToggleRow({
  label,
  description,
  control,
  disabled = false,
  bordered = true,
  className,
}: ToggleRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3.5",
        bordered && "border-b border-border-subtle last:border-b-0",
        disabled && "opacity-40",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-text-primary leading-snug">{label}</p>
        {description && (
          <p className="text-caption text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

export { ToggleRow };
