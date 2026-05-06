/**
 * DisinterestSheet — "관심 없음" 사유 선택 바텀시트
 */
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Chip } from "../ui/chip";
import { Textarea } from "../ui/textarea";

const REASONS = [
  "외모가 내 이상형이 아니에요",
  "나이/직업이 맞지 않아요",
  "라이프스타일이 다를 것 같아요",
  "기타 이유가 있어요",
];

interface DisinterestSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, detail?: string) => void;
}

export function DisinterestSheet({ open, onClose, onSubmit }: DisinterestSheetProps) {
  const [selected, setSelected] = useState<string>("");
  const [detail, setDetail] = useState("");

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit(selected, detail || undefined);
    setSelected("");
    setDetail("");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0">
        <SheetHeader className="px-6 pt-2 pb-4 border-b border-border-subtle">
          <SheetTitle className="text-body font-semibold text-text-primary text-left">
            관심 없는 이유를 알려주세요
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <Chip
                key={r}
                asButton
                selected={selected === r}
                onClick={() => setSelected(r)}
                size="md"
              >
                {r}
              </Chip>
            ))}
          </div>

          {selected === "기타 이유가 있어요" && (
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="자유롭게 적어주세요 (선택)"
              className="bg-surface border-border-subtle resize-none"
              rows={3}
            />
          )}

          <p className="text-caption text-text-tertiary">
            입력하신 내용은 매칭 품질 개선에만 활용돼요.
          </p>
        </div>

        <div className="px-6 pb-8 pt-2 border-t border-border-subtle">
          <Button
            variant="brand"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={!selected}
          >
            완료
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
