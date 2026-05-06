/**
 * KeywordPicker — F09 키워드 다중 선택 칩
 *
 * 긍정(8) / 부정(5) 섹션 분리.
 * 부정 키워드는 최대 1개만 선택 가능 (오남용 방지).
 */
import { Check } from "lucide-react";
import { cn } from "../ui/utils";
import {
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  type MannerKeyword,
} from "../../../lib/feedback";

interface KeywordPickerProps {
  selected: MannerKeyword[];
  onChange: (keywords: MannerKeyword[]) => void;
}

export function KeywordPicker({ selected, onChange }: KeywordPickerProps) {
  const toggle = (key: MannerKeyword, isPositive: boolean) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      if (!isPositive) {
        // 부정 키워드: 기존 부정 제거 후 교체 (1개 제한)
        const withoutNeg = selected.filter((k) =>
          POSITIVE_KEYWORDS.some((p) => p.key === k),
        );
        onChange([...withoutNeg, key]);
      } else {
        onChange([...selected, key]);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 긍정 */}
      <section>
        <p className="text-caption font-semibold text-text-secondary mb-2">좋았던 점</p>
        <div className="flex flex-wrap gap-2">
          {POSITIVE_KEYWORDS.map(({ key, label, emoji }) => {
            const active = selected.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggle(key, true)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-all",
                  active
                    ? "bg-[hsl(var(--state-success)/0.12)] text-[hsl(var(--state-success))] ring-1 ring-[hsl(var(--state-success)/0.35)]"
                    : "bg-surface shadow-hairline text-text-secondary hover:bg-surface-sunken",
                )}
              >
                <span>{emoji}</span>
                {label}
                {active && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 부정 */}
      <section>
        <p className="text-caption font-semibold text-text-secondary mb-1">
          아쉬웠던 점{" "}
          <span className="font-normal text-text-tertiary">(1개만 선택)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {NEGATIVE_KEYWORDS.map(({ key, label, emoji }) => {
            const active = selected.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggle(key, false)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-body-sm font-medium transition-all",
                  active
                    ? "bg-[hsl(var(--state-warning)/0.10)] text-[hsl(35_95%_45%)] ring-1 ring-[hsl(35_95%_60%/0.4)]"
                    : "bg-surface shadow-hairline text-text-secondary hover:bg-surface-sunken",
                )}
              >
                <span>{emoji}</span>
                {label}
                {active && <Check className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
