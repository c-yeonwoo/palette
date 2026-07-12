/**
 * FirstMessageSuggestionModal — 매칭 성사 직후 첫 메시지 추천. S-002.
 *
 * 두 사람 색 조합 기반 5개 후보 + 받는 사람 톤 가이드.
 * 클릭 시 클립보드 복사 → 사용자가 카카오톡/문자에 직접 붙여넣음.
 */
import { useState } from "react";
import { Copy, X, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { suggestFirstMessages } from "../../../lib/firstMessageSuggestions";
import type { ColorType } from "../../../lib/colorCompatibility";

interface FirstMessageSuggestionModalProps {
  myColor: ColorType | null | undefined;
  theirColor: ColorType | null | undefined;
  theirName: string;
  open: boolean;
  onClose: () => void;
}

export function FirstMessageSuggestionModal({
  myColor,
  theirColor,
  theirName,
  open,
  onClose,
}: FirstMessageSuggestionModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { suggestions, receiverHint } = suggestFirstMessages(myColor, theirColor);

  if (!open) return null;

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("메시지가 복사됐어요");
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      toast.error("복사에 실패했어요");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-soft flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold">{theirName}님께 첫 메시지</h2>
              <p className="text-[11px] text-muted-foreground">추천 5개 — 마음에 드는 메시지 복사</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted/60 inline-flex items-center justify-center flex-shrink-0"
            aria-label="닫기"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 받는 사람 톤 가이드 */}
        {receiverHint && (
          <div className="px-5 pt-4">
            <div className="rounded-xl bg-brand-soft/40 border border-primary/20 p-3">
              <p className="text-[11px] font-medium text-primary mb-0.5">{theirName}님 톤 가이드</p>
              <p className="text-xs text-foreground leading-relaxed">{receiverHint}</p>
            </div>
          </div>
        )}

        {/* 메시지 후보 리스트 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {suggestions.map((s, i) => {
            const copied = copiedIndex === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleCopy(s.text, i)}
                className={
                  "w-full text-left rounded-2xl border bg-card p-4 transition-all " +
                  (copied
                    ? "border-primary/50 bg-brand-soft/30"
                    : "border-border hover:border-foreground/20 hover:bg-muted/30")
                }
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[11px] font-bold text-muted-foreground tabular-nums flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed">{s.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {s.rationale}
                    </p>
                  </div>
                  <div className={
                    "flex items-center gap-1 text-[11px] flex-shrink-0 mt-0.5 " +
                    (copied ? "text-primary" : "text-muted-foreground")
                  }>
                    <Copy className="w-3 h-3" />
                    <span>{copied ? "복사됨" : "복사"}</span>
                  </div>
                </div>
              </button>
            );
          })}

          {/* 안내 */}
          <div className="pt-2">
            <div className="rounded-xl bg-muted/40 border border-border p-3 flex items-start gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                메시지를 복사한 후 카카오톡·문자 등으로 보내주세요.
                첫 인사 후엔 짧고 자주 — 길고 드물게보다 관계가 깊어져요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
