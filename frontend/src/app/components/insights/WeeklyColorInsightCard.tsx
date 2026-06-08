/**
 * WeeklyColorInsightCard — 색별 위클리 인사이트 노출. L-001.
 *
 * 마이페이지 PaletteInsightPanel 아래 작은 카드로 노출.
 * 사용자가 dismiss 시 이번 주는 숨김(다음 주 자동 복귀).
 */
import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { getWeeklyInsight } from "../../../lib/colorInsights";
import type { ColorType } from "../../../lib/colorCompatibility";

interface WeeklyColorInsightCardProps {
  colorType: ColorType | null | undefined;
  /** 색 식별 hex — 카드 accent 용 (옵셔널) */
  accentHex?: string | null;
}

function currentWeekKey(): string {
  // ISO 주차 단위 dismiss 키 — 다음 주에 자동 복귀
  const ms = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return `palette:insight:dismissed:w${Math.floor(ms / weekMs)}`;
}

export function WeeklyColorInsightCard({ colorType, accentHex }: WeeklyColorInsightCardProps) {
  const insight = getWeeklyInsight(colorType);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(currentWeekKey()) === "1"; } catch { return false; }
  });

  if (!insight || dismissed) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(currentWeekKey(), "1"); } catch {}
    setDismissed(true);
  };

  return (
    <section className="max-w-2xl mx-auto px-5 mt-3">
      <div
        className="relative rounded-2xl border bg-card p-4 shadow-card"
        style={accentHex ? { borderColor: `${accentHex}33` } : undefined}
      >
        {/* dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute right-2.5 top-2.5 w-6 h-6 rounded-md hover:bg-muted/60 inline-flex items-center justify-center"
          aria-label="이번 주 인사이트 닫기"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={accentHex ? { backgroundColor: `${accentHex}15` } : { backgroundColor: "rgba(0,0,0,0.04)" }}
          >
            <Sparkles className="w-4 h-4" style={accentHex ? { color: accentHex } : undefined} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground mb-0.5">이번 주 당신의 색</p>
            <h3 className="text-sm font-bold text-foreground leading-tight mb-1.5">{insight.headline}</h3>
            <p className="text-[12.5px] text-muted-foreground leading-relaxed">{insight.body}</p>
            {insight.action && (
              <div
                className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={accentHex
                  ? { backgroundColor: `${accentHex}12`, color: accentHex }
                  : { backgroundColor: "rgba(0,0,0,0.05)" }}
              >
                <span>이번 주 액션</span>
                <span className="opacity-60">·</span>
                <span>{insight.action}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
