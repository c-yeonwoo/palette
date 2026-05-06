/**
 * ColorTestOption — 컬러 타입 진단 보기 카드
 *
 * A/B/C/D 라벨과 텍스트를 표시하며,
 * 선택 상태에 따라 시각적으로 강조됩니다.
 *
 * @example
 * <ColorTestOption
 *   text="자연스럽게 대화를 이끈다"
 *   index={0}
 *   selected={selectedIndex === 0}
 *   onClick={() => setSelected(0)}
 * />
 */

import { Check } from "lucide-react";
import { cn } from "../ui/utils";

interface ColorTestOptionProps {
  /** 보기 텍스트 */
  text: string;
  /** 보기 인덱스 (0~3 → A/B/C/D) */
  index: number;
  /** 선택 여부 */
  selected: boolean;
  /** 클릭 콜백 */
  onClick: () => void;
}

/** 인덱스 → 알파벳 라벨 변환 */
const INDEX_LABELS = ["A", "B", "C", "D"] as const;

/**
 * 보기 카드 컴포넌트
 *
 * - 선택 전: 흰 배경 + shadow-hairline + border-border-subtle
 * - 선택 후: bg-brand-soft + ring-1 ring-brand/30 + text-brand
 * - A/B/C/D 라벨 (선택 시 brand 색상)
 * - 선택 시 우측 체크 아이콘
 */
export function ColorTestOption({
  text,
  index,
  selected,
  onClick,
}: ColorTestOptionProps) {
  const label = INDEX_LABELS[index] ?? "A";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // 기본 레이아웃
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left",
        "transition-[background-color,box-shadow,color] duration-[150ms] ease-[cubic-bezier(.2,.8,.2,1)]",
        "active:scale-[0.98] transition-transform",
        // 미선택 상태
        !selected && [
          "bg-surface",
          "shadow-[var(--shadow-hairline)]",
          "border border-border-subtle",
          "hover:shadow-[var(--shadow-soft)]",
          "hover:border-neutral-300",
        ],
        // 선택 상태
        selected && [
          "bg-brand-soft",
          "ring-1 ring-[hsl(var(--brand)/0.3)]",
          "border border-transparent",
        ],
      )}
      aria-pressed={selected}
    >
      {/* A/B/C/D 라벨 */}
      <span
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
          "text-caption font-semibold transition-colors duration-[150ms]",
          selected
            ? "bg-brand text-brand-foreground"
            : "bg-surface-sunken text-text-tertiary",
        )}
      >
        {label}
      </span>

      {/* 보기 텍스트 */}
      <span
        className={cn(
          "flex-1 text-body leading-snug transition-colors duration-[150ms]",
          selected ? "text-brand font-medium" : "text-text-primary",
        )}
      >
        {text}
      </span>

      {/* 선택 시 체크 아이콘 */}
      <span
        className={cn(
          "flex-shrink-0 transition-[opacity,transform] duration-[150ms]",
          selected ? "opacity-100 scale-100" : "opacity-0 scale-75",
        )}
        aria-hidden
      >
        <Check className="size-4 text-brand" strokeWidth={2.5} />
      </span>
    </button>
  );
}
