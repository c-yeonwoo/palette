/**
 * ColorTypeAura — 유저 컬러타입을 아바타 주변 오라(글로우/링)로 표현
 *
 * <ColorTypeAura colorType="blue" size={80}>
 *   <img src={profileUrl} ... />
 * </ColorTypeAura>
 *
 * 동작:
 *   - size: 오라 컨테이너 px 크기 (아바타 이미지보다 아우터)
 *   - intensity: "soft" | "medium" | "strong" (글로우 강도)
 *   - ring: true이면 컬러 링(테두리)도 표시
 */
import React from "react";
import { cn } from "../ui/utils";
import { getColorTypeMeta, type ColorTypeKey } from "../../../lib/colorTypes";

interface ColorTypeAuraProps {
  colorType: ColorTypeKey | string | null | undefined;
  size?: number;
  intensity?: "soft" | "medium" | "strong";
  ring?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ColorTypeAura({
  colorType,
  size,
  intensity = "soft",
  ring = false,
  children,
  className,
}: ColorTypeAuraProps) {
  const meta = getColorTypeMeta(colorType);
  const h = meta.h;
  const s = meta.s;

  const glowAlpha = { soft: 0.08, medium: 0.12, strong: 0.16 }[intensity];
  const glowBlur  = { soft: "16px", medium: "24px", strong: "32px" }[intensity];
  const glowColor = `hsl(${h} ${s}% 58% / ${glowAlpha})`;
  const ringColor = `hsl(${h} ${s}% 52%)`;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Glow layer */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `0 0 ${glowBlur} ${glowColor}, 0 0 ${glowBlur} ${glowColor}`,
        }}
      />

      {/* Ring layer */}
      {ring && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            outline: `2.5px solid ${ringColor}`,
            outlineOffset: "2px",
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 w-full h-full rounded-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
