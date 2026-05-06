/**
 * EditFieldSheet — 필드 인라인 편집 바텀시트
 *
 * <EditFieldSheet
 *   fieldKey="smoking"
 *   currentValue="NEVER"
 *   onSave={(val) => updateField("smoking", val)}
 *   onClose={() => setSheet(null)}
 * />
 *
 * 키/나이 같은 슬라이더 필드는 widget="slider" 자동 감지.
 * 나머지는 Chip 그리드.
 */
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Chip } from "../ui/chip";
import { Slider } from "../ui/slider";
import { Input } from "../ui/input";
import { FIELD_META, formatFieldValue } from "../../../lib/profileSchema";
import { cn } from "../ui/utils";

interface EditFieldSheetProps {
  fieldKey: string;
  currentValue?: unknown;
  onSave: (value: unknown) => void;
  onClose: () => void;
}

export function EditFieldSheet({ fieldKey, currentValue, onSave, onClose }: EditFieldSheetProps) {
  const meta = FIELD_META[fieldKey];

  /* slider 기본값은 useState보다 먼저 계산 (hooks는 조건부 실행 불가) */
  const sliderDefault = meta?.sliderMin ?? 0;
  const [draft, setDraft] = useState<unknown>(
    currentValue ?? (meta?.widget === "slider" ? sliderDefault : ""),
  );

  if (!meta) return null;

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const displayDraft = meta.format ? meta.format(draft) : String(draft ?? "");

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0">
        <SheetHeader className="px-6 pt-2 pb-4 border-b border-border-subtle">
          <SheetTitle className="text-body font-semibold text-text-primary text-left">
            {meta.label} 설정
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 py-5">
          {/* ── 슬라이더 ── */}
          {meta.widget === "slider" && meta.sliderMin !== undefined && meta.sliderMax !== undefined && (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-display font-bold text-text-primary">
                  {draft ?? meta.sliderMin}
                  {meta.sliderUnit && <span className="text-title text-text-secondary ml-1">{meta.sliderUnit}</span>}
                </span>
              </div>
              <Slider
                min={meta.sliderMin}
                max={meta.sliderMax}
                step={1}
                value={[Number(draft ?? meta.sliderMin)]}
                onValueChange={([v]) => setDraft(v)}
                className="w-full"
              />
              <div className="flex justify-between text-caption text-text-tertiary">
                <span>{meta.sliderMin}{meta.sliderUnit}</span>
                <span>{meta.sliderMax}{meta.sliderUnit}</span>
              </div>
            </div>
          )}

          {/* ── 텍스트 입력 ── */}
          {meta.widget === "text" && (
            <Input
              value={String(draft ?? "")}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`${meta.label}을(를) 입력하세요`}
              className="bg-surface-sunken border-border-subtle"
              autoFocus
            />
          )}

          {/* ── 칩 선택 ── */}
          {(meta.widget === "chips" || !meta.widget) && meta.options && (
            <div className="flex flex-wrap gap-2">
              {meta.options.map((opt) => (
                <Chip
                  key={opt.value}
                  asButton
                  selected={draft === opt.value}
                  onClick={() => setDraft(opt.value)}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-8 pt-2 border-t border-border-subtle">
          <Button
            variant="brand"
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={draft === undefined || draft === ""}
          >
            저장
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
