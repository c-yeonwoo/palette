/**
 * ColorDetailScreen — "나의 색" 설명 페이지
 * 마이페이지 '나의 색' 카드 → 이 페이지. 내 컬러 타입의 의미/키워드/AI 설명을 보여준다.
 */
import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { api } from "../../lib/api/apiClient";
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
}

interface ColorDetailScreenProps {
  onBack: () => void;
  onNavigateToProfile?: () => void;
}

export function ColorDetailScreen({ onBack, onNavigateToProfile }: ColorDetailScreenProps) {
  const [colorType, setColorType] = useState<ColorTypeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<{ colorType: ColorTypeData | null }>("/api/v1/profile")
      .then(res => setColorType(res.colorType ?? null))
      .catch(() => setColorType(null))
      .finally(() => setIsLoading(false));
  }, []);

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
  // AI 분석 (없으면 정적 fallback)
  const reasoning = colorType?.reasoning?.trim() || description;
  const personalityText = colorType?.personalitySummary?.trim() || (personality ? `${personality} 사람` : null);
  const idealInsight = colorType?.idealTypeInsight?.trim() || null;

  return (
    <div
      className="min-h-screen pb-20"
      style={hex
        ? { backgroundColor: "#ffffff", backgroundImage: `linear-gradient(180deg, ${hex}26 0%, ${hex}12 280px, ${hex}0A 100%)` }
        : { backgroundColor: "var(--background)" }
      }
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted/50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">나의 색</h1>
        </div>
      </header>

      {!hex ? (
        /* 색 없음 — AI 프로필 유도 */
        <div className="max-w-2xl mx-auto px-6 py-20 text-center space-y-4">
          <div className="text-5xl">🎨</div>
          <p className="font-semibold text-foreground">아직 나의 색이 없어요</p>
          <p className="text-sm text-muted-foreground">AI 프로필을 완성하면 당신만의 색이 발급돼요</p>
          {onNavigateToProfile && (
            <button onClick={onNavigateToProfile} className="inline-flex items-center gap-1.5 bg-brand-soft text-gold-strong font-semibold px-5 py-2.5 rounded-full">
              <Sparkles className="w-4 h-4" /> AI 프로필로 색 찾기
            </button>
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-5">
          {/* 히어로 */}
          <div className="flex flex-col items-center text-center pt-8 pb-6">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center ring-4 ring-white shadow-card-hover"
              style={{ backgroundColor: hex }}
            >
              <span className="text-5xl drop-shadow-sm">{emoji}</span>
            </div>
            <h2 className="mt-5 text-2xl font-bold text-foreground">{name}</h2>
            {energy && <p className="mt-1 text-sm text-muted-foreground">{energy}</p>}
            {keywords && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {keywords.map(k => (
                  <span
                    key={k}
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${hex}1F`, color: "hsl(var(--foreground))" }}
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 이 색을 고른 근거 */}
          {reasoning && (
            <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 mb-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: hex }} /> AI가 이 색을 고른 이유
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{reasoning}</p>
            </div>
          )}

          {/* 성향 요약 */}
          {personalityText && (
            <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 mb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">나의 성향</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{personalityText}</p>
            </div>
          )}

          {/* 원하는 이상형 유추 */}
          {idealInsight && (
            <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: hex }} /> 이런 인연과 잘 맞아요
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{idealInsight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
