import * as React from "react";
import { cn } from "./utils";

/**
 * LevelBar — 매치메이커/유저 레벨 진행 바
 *
 * <LevelBar
 *   level={3}
 *   levelName="꽃"
 *   color="#EC4899"
 *   current={8}
 *   next={11}
 *   nextName="나무"
 * />
 */
interface LevelBarProps {
  level: number;
  levelName: string;
  color: string;        // hex or hsl — 인라인으로만 사용
  current: number;      // 현재 성공 수
  next?: number;        // 다음 레벨 요구치 (없으면 max)
  nextName?: string;
  className?: string;
}

function LevelBar({
  level,
  levelName,
  color,
  current,
  next,
  nextName,
  className,
}: LevelBarProps) {
  const isMax = next === undefined;
  const pct = isMax ? 100 : Math.min(100, Math.round((current / next) * 100));

  return (
    <div className={cn("space-y-2", className)}>
      {/* 레벨 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-caption font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {level}
          </span>
          <span className="text-body-sm font-semibold text-text-primary">{levelName}</span>
        </div>
        {!isMax && nextName && (
          <span className="text-caption text-text-tertiary">
            {current} / {next} → {nextName}
          </span>
        )}
        {isMax && (
          <span className="text-caption text-primary font-semibold">MAX</span>
        )}
      </div>

      {/* 프로그레스 바 */}
      <div className="h-1.5 rounded-pill bg-surface-sunken overflow-hidden">
        <div
          className="h-full rounded-pill transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export { LevelBar };
