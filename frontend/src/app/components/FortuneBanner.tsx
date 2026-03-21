import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../../lib/api/apiClient";

interface Fortune {
  date: string;
  title: string;
  message: string;
  luckyColor: string;
  luckyColorHex: string;
  luckyNumber: number;
  compatibilityHint: string;
  loveScore: number;
}

export function FortuneBanner() {
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Fortune>("/api/v1/fortune/today")
      .then(setFortune)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-4 mb-4 h-14 rounded-2xl bg-muted animate-pulse" />
    );
  }

  if (!fortune) return null;

  const hearts = Array.from({ length: 5 }, (_, i) => i < fortune.loveScore);

  return (
    <div className="px-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left rounded-2xl bg-card shadow-sm overflow-hidden transition-all"
      >
        {/* Collapsed row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">오늘의 연애 운세</p>
            <p className="text-sm font-semibold truncate">{fortune.title}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {hearts.map((filled, i) => (
              <span key={i} className={`text-xs ${filled ? "opacity-100" : "opacity-20"}`}>♥</span>
            ))}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-border/60">
            <p className="text-sm text-muted-foreground leading-relaxed pt-3 mb-4">{fortune.message}</p>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted rounded-xl p-3 text-center">
                <div className="w-5 h-5 rounded-full mx-auto mb-1.5 shadow-sm" style={{ backgroundColor: fortune.luckyColorHex }} />
                <p className="text-[10px] text-muted-foreground">행운의 색</p>
                <p className="text-xs font-medium mt-0.5 leading-tight">{fortune.luckyColor}</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary leading-none mb-1">{fortune.luckyNumber}</p>
                <p className="text-[10px] text-muted-foreground">행운의 숫자</p>
              </div>
              <div className="bg-muted rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground leading-none mb-1">{fortune.loveScore}<span className="text-xs font-normal text-muted-foreground">/5</span></p>
                <p className="text-[10px] text-muted-foreground">연애 운</p>
              </div>
            </div>

            <div className="mt-3 bg-muted rounded-xl px-3 py-2.5">
              <p className="text-[11px] text-primary font-medium mb-0.5">오늘의 궁합 힌트</p>
              <p className="text-sm text-foreground leading-snug">{fortune.compatibilityHint}</p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
