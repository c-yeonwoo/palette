/**
 * ColorTestProgress — 컬러 타입 진단 상단 진행 표시
 *
 * 현재 문항 번호와 전체 문항 수를 표시하고,
 * 뒤로가기 버튼을 제공합니다.
 *
 * @example
 * <ColorTestProgress current={3} total={14} onBack={handleBack} />
 */

import { ChevronLeft } from "lucide-react";
import { cn } from "../ui/utils";

interface ColorTestProgressProps {
  /** 현재 문항 번호 (1-based) */
  current: number;
  /** 전체 문항 수 */
  total: number;
  /** 뒤로가기 콜백 (없으면 버튼 숨김) */
  onBack?: () => void;
}

/**
 * 상단 진행 표시 바 컴포넌트
 *
 * - 얇은 프로그레스 바 (brand 컬러)
 * - "Q{n} / 14" 텍스트
 * - 선택적 뒤로가기 버튼
 */
export function ColorTestProgress({
  current,
  total,
  onBack,
}: ColorTestProgressProps) {
  const progressPercent = Math.round((current / total) * 100);

  return (
    <div className="w-full">
      {/* 상단 헤더 영역 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        {/* 뒤로가기 버튼 */}
        <button
          type="button"
          onClick={onBack}
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-md",
            "text-text-secondary hover:text-text-primary",
            "hover:bg-surface-sunken transition-default",
            !onBack && "invisible pointer-events-none",
          )}
          aria-label="이전으로"
        >
          <ChevronLeft className="size-5" />
        </button>

        {/* 문항 번호 */}
        <span className="text-body-sm text-text-tertiary font-medium">
          <span className="text-brand font-semibold">Q{current}</span>
          {" / "}
          {total}
        </span>

        {/* 우측 공간 균형 */}
        <div className="w-8" aria-hidden />
      </div>

      {/* 프로그레스 바 */}
      <div
        className="h-0.5 w-full bg-surface-sunken"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`${total}개 중 ${current}번째 질문`}
      >
        <div
          className="h-full bg-brand transition-[width] duration-[280ms] ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
