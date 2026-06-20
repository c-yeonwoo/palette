/**
 * ColorDetailScreen — "나의 색" 리포트 페이지 (ADR 0069)
 * 무료: 색 타입 + 키워드 + AI가 이 색을 고른 이유.
 * 심층 리포트(성향·어울리는 인연·강점): 물감으로 잠금 해제(영구). 광고 무료 해제는 후속.
 */
import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, Sparkles, Lock, Palette } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { COLOR_META, type ColorType } from "../../lib/colorCompatibility";
import { getColorTypeMeta } from "../../lib/colorTypes";

interface ColorTypeData {
  type: string | null;
  key: string | null;
  name: string | null;
  hex: string | null;
  description: string | null;
  reasoning?: string | null;
  personalitySummary?: string | null;
  idealTypeInsight?: string | null;
  strengths?: string[] | null;
}

interface ColorDetailScreenProps {
  onBack: () => void;
  onNavigateToProfile?: () => void;
}

export function ColorDetailScreen({ onBack, onNavigateToProfile }: ColorDetailScreenProps) {
  const [colorType, setColorType] = useState<ColorTypeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockCost, setUnlockCost] = useState(5);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ colorType: ColorTypeData | null }>("/api/v1/profile")
        .then(res => setColorType(res.colorType ?? null))
        .catch(() => setColorType(null)),
      api.get<{ unlocked: boolean; cost: number }>("/api/v1/color-report")
        .then(res => { setUnlocked(!!res.unlocked); if (res.cost) setUnlockCost(res.cost); })
        .catch(() => { /* 상태 못 받으면 잠금으로 둠 */ }),
    ]).finally(() => setIsLoading(false));
  }, []);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      await api.post("/api/v1/color-report/unlock");
      setUnlocked(true);
      toast.success("심층 리포트가 열렸어요!");
    } catch (e) {
      const msg = (e as Error)?.message || "";
      toast.error(msg.includes("물감") || msg.includes("부족") ? "물감이 부족해요. 충전 후 다시 시도해주세요." : "잠금 해제에 실패했어요.");
    } finally {
      setUnlocking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hex = colorType?.hex ?? null;
  const meta = colorType?.type ? COLOR_META[colorType.type as ColorType] : undefined;
  const typeMeta = colorType?.key ? getColorTypeMeta(colorType.key) : null;
  const name = colorType?.name ?? meta?.name ?? "나의 색";
  const emoji = meta?.emoji ?? "🎨";
  const energy = meta?.energy ?? null;
  const personality = meta?.personality ?? null;
  const keywords = typeMeta?.keywords ?? null;
  const description = colorType?.description ?? null;
  const reasoning = colorType?.reasoning?.trim() || description;
  const personalityText = colorType?.personalitySummary?.trim() || (personality ? `${personality} 사람` : null);
  const idealInsight = colorType?.idealTypeInsight?.trim() || null;
  const strengths = (colorType?.strengths ?? []).filter(s => s && s.trim());
  const hasDeep = !!(personalityText || idealInsight || strengths.length > 0);

  return (
    <div
      className="min-h-screen pb-20"
      style={hex
        ? { backgroundColor: "#ffffff", backgroundImage: `linear-gradient(180deg, ${hex}26 0%, ${hex}12 280px, ${hex}0A 100%)` }
        : { backgroundColor: "var(--background)" }
      }
    >
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted/50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">나의 색 리포트</h1>
        </div>
      </header>

      {!hex ? (
        <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
          <div className="text-5xl">🎨</div>
          <p className="font-semibold text-foreground">아직 나의 색이 없어요</p>
          <p className="text-sm text-muted-foreground">AI 프로필을 완성하면 당신만의 색이 발급돼요</p>
          {onNavigateToProfile && (
            <button onClick={onNavigateToProfile} className="inline-flex items-center gap-1.5 bg-brand-soft text-brand-strong font-semibold px-5 py-2.5 rounded-full">
              <Sparkles className="w-4 h-4" /> AI 프로필로 색 찾기
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-5">
          {/* 히어로 (무료) */}
          <div className="flex flex-col items-center text-center pt-8 pb-6">
            <div className="w-28 h-28 rounded-full flex items-center justify-center ring-4 ring-white shadow-card-hover" style={{ backgroundColor: hex }}>
              <span className="text-5xl drop-shadow-sm">{emoji}</span>
            </div>
            <h2 className="mt-5 text-2xl font-bold text-foreground">{name}</h2>
            {energy && <p className="mt-1 text-sm text-muted-foreground">{energy}</p>}
            {keywords && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {keywords.map(k => (
                  <span key={k} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: `${hex}1F`, color: "hsl(var(--foreground))" }}>{k}</span>
                ))}
              </div>
            )}
          </div>

          {/* 이 색을 고른 근거 (무료) */}
          {reasoning && (
            <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 mb-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: hex }} /> AI가 이 색을 고른 이유
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{reasoning}</p>
            </div>
          )}

          {/* ── 심층 리포트 (성향·이상형·강점) ── */}
          {hasDeep && (
            <div className="relative">
              <div className={unlocked ? "" : "blur-[6px] select-none pointer-events-none"} aria-hidden={!unlocked}>
                {personalityText && (
                  <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 mb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">나의 성향</p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{personalityText}</p>
                  </div>
                )}
                {idealInsight && (
                  <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 mb-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: hex }} /> 이런 인연과 잘 맞아요
                    </p>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{idealInsight}</p>
                  </div>
                )}
                {strengths.length > 0 && (
                  <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">나의 강점</p>
                    <div className="flex flex-wrap gap-2">
                      {strengths.map(s => (
                        <span key={s} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: `${hex}1F`, color: "hsl(var(--foreground))" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 잠금 오버레이 */}
              {!unlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <div className="bg-card/95 backdrop-blur rounded-2xl border border-border shadow-card-hover p-5 max-w-xs w-full space-y-3">
                    <div className="w-11 h-11 rounded-full bg-brand-soft flex items-center justify-center mx-auto">
                      <Lock className="w-5 h-5 text-brand-strong" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">나의 심층 리포트</p>
                      <p className="text-xs text-muted-foreground mt-1">성향 · 어울리는 인연 · 강점을 자세히 풀어드려요</p>
                    </div>
                    <button
                      onClick={handleUnlock}
                      disabled={unlocking}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-soft text-brand-strong font-semibold py-2.5 rounded-xl disabled:opacity-50"
                    >
                      {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
                      {unlocking ? "여는 중..." : `${unlockCost} 물감으로 열기`}
                    </button>
                    <button
                      disabled
                      className="w-full text-xs text-muted-foreground/60 py-1 cursor-not-allowed"
                      title="광고 보상 해제는 곧 추가됩니다"
                    >
                      광고 보고 무료로 열기 (준비 중)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
