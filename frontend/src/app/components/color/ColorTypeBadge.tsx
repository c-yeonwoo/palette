/**
 * ColorTypeBadge — 유저 컬러타입 뱃지
 *
 * 크기: sm | md | lg
 * 스타일: pill (기본) | dot | icon-only
 *
 * <ColorTypeBadge colorType="blue" />               → 블루 pill
 * <ColorTypeBadge colorType="pink" size="sm" />     → 핑크 small pill
 * <ColorTypeBadge colorType="orange" style="dot" /> → 오렌지 원형 도트
 */
import { cn } from "../ui/utils";
import { type ColorTypeKey, getColorTypeMeta } from "../../../lib/colorTypes";

interface ColorTypeBadgeProps {
  colorType: ColorTypeKey | string | null | undefined;
  size?: "sm" | "md" | "lg";
  style?: "pill" | "dot" | "soft";
  className?: string;
  showLabel?: boolean;
}

export function ColorTypeBadge({
  colorType,
  size = "md",
  style = "pill",
  className,
  showLabel = true,
}: ColorTypeBadgeProps) {
  const meta = getColorTypeMeta(colorType);
  const hslBase = `hsl(${meta.h} ${meta.s}% ${meta.l}%)`;
  const hslSoft = `hsl(${meta.h} ${meta.s}% 93%)`;
  const hslText = `hsl(${meta.h} ${meta.s}% 32%)`;

  if (style === "dot") {
    const sizeMap = { sm: "w-2 h-2", md: "w-3 h-3", lg: "w-4 h-4" };
    return (
      <span
        className={cn("inline-block rounded-full flex-shrink-0", sizeMap[size], className)}
        style={{ backgroundColor: hslBase }}
        aria-label={meta.label}
      />
    );
  }

  if (style === "soft") {
    const sizeMap = {
      sm: "px-2 py-0.5 text-caption rounded-md",
      md: "px-2.5 py-1 text-body-sm rounded-md",
      lg: "px-3 py-1.5 text-body rounded-md",
    };
    return (
      <span
        className={cn("inline-flex items-center gap-1 font-medium", sizeMap[size], className)}
        style={{ backgroundColor: hslSoft, color: hslText }}
      >
        {meta.label}
      </span>
    );
  }

  // pill (기본)
  const sizeMap = {
    sm: "px-2 py-0.5 text-caption rounded-pill gap-1",
    md: "px-2.5 py-1 text-body-sm rounded-pill gap-1.5",
    lg: "px-3 py-1.5 text-body rounded-pill gap-1.5",
  };
  const dotSize = { sm: "w-1.5 h-1.5", md: "w-2 h-2", lg: "w-2.5 h-2.5" };

  return (
    <span
      className={cn("inline-flex items-center font-medium text-white", sizeMap[size], className)}
      style={{ backgroundColor: hslBase }}
    >
      {showLabel && meta.label}
    </span>
  );
}
