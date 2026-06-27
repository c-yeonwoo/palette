/**
 * ColorDetailScreen — "팔레트 분석 리포트" (ADR 0069 잠금 + ADR 0070 풀 리포트)
 *
 * 무료: 색 타입 + 키워드 + AI가 이 색을 고른 이유 (티저/훅).
 * 유료(물감 1회 or 광고): 당신의 결·매력 육각형·강점·아쉬운 점·어울리는 인연·연애 스타일·연애운(사주)·조언
 *   까지 한 편의 팔리의 연애 리포트. 해제하면 영구 공개.
 */
import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, Sparkles, Lock, Palette, Heart, Compass, Moon, MessageCircle, TrendingUp } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { COLOR_META, type ColorType } from "../../lib/colorCompatibility";
import { getColorTypeMeta } from "../../lib/colorTypes";
import { PaletteRadar } from "./PaletteRadar";

interface ColorTypeData {
  type: string | null;
  key: string | null;
  name: string | null;
  hex: string | null;
  description: string | null;
  reasoning?: string | null;
}

interface FullReport {
  tagline: string;
  essence: string;
  hexagon: Record<string, number>;
  hexagonComment: string;
  charm: string;
  strengths: string[];
  growthPoints: string[];
  idealMatch: string;
  loveStyle: string;
  destiny: string;
  advice: string;
}

interface ColorDetailScreenProps {
  onBack: () => void;
  onNavigateToProfile?: () => void;
}

const LOCKED_PREVIEW = ["당신의 결", "매력 육각형", "당신의 매력", "어울리는 인연", "연애 스타일", "연애운 (사주)", "팔리의 조언"];

export function ColorDetailScreen({ onBack, onNavigateToProfile }: ColorDetailScreenProps) {
  const [colorType, setColorType] = useState<ColorTypeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockCost, setUnlockCost] = useState(1);
  const [unlocking, setUnlocking] = useState(false);
  const [report, setReport] = useState<FullReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const loadReport = () => {
    setReportLoading(true);
    api.get<{ unlocked: boolean; available: boolean; report: FullReport | null }>("/api/v1/color-report/full")
      .then(res => { if (res.available && res.report) setReport(res.report); })
      .catch(() => { /* 잠금/미발급 — 조용히 */ })
      .finally(() => setReportLoading(false));
  };

  useEffect(() => {
    Promise.all([
      api.get<{ colorType: ColorTypeData | null }>("/api/v1/profile")
        .then(res => setColorType(res.colorType ?? null))
        .catch(() => setColorType(null)),
      api.get<{ unlocked: boolean; cost: number }>("/api/v1/color-report")
        .then(res => { setUnlocked(!!res.unlocked); if (res.cost) setUnlockCost(res.cost); if (res.unlocked) loadReport(); })
        .catch(() => { /* 상태 못 받으면 잠금으로 둠 */ }),
    ]).finally(() => setIsLoading(false));
  }, []);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      await api.post("/api/v1/color-report/unlock");
      setUnlocked(true);
      toast.success("팔레트 분석 리포트가 열렸어요!");
      loadReport();
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
  const keywords = typeMeta?.keywords ?? null;
  const description = colorType?.description ?? null;
  const reasoning = colorType?.reasoning?.trim() || description;
  const accent = hex ?? "#E27450";

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
          <h1 className="text-lg font-bold text-foreground">팔레트 분석 리포트</h1>
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
            {report?.tagline ? (
              <p className="mt-1.5 text-sm font-medium" style={{ color: accent }}>{report.tagline}</p>
            ) : energy && <p className="mt-1 text-sm text-muted-foreground">{energy}</p>}
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

          {/* ── 풀 리포트 (유료) ── */}
          {unlocked ? (
            reportLoading && !report ? (
              <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-sm">당신만의 리포트를 분석하고 있어요…</p>
              </div>
            ) : report ? (
              <div className="space-y-4">
                <ReportSection icon={<Sparkles className="w-3.5 h-3.5" style={{ color: accent }} />} title="당신의 결">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{report.essence}</p>
                </ReportSection>

                {report.hexagon && Object.keys(report.hexagon).length > 0 && (
                  <ReportSection icon={<Palette className="w-3.5 h-3.5" style={{ color: accent }} />} title="매력 육각형">
                    <PaletteRadar scores={report.hexagon} color={accent} />
                    {report.hexagonComment && (
                      <p className="mt-3 text-sm text-foreground leading-relaxed whitespace-pre-line">{report.hexagonComment}</p>
                    )}
                  </ReportSection>
                )}

                {(report.charm || report.strengths.length > 0) && (
                  <ReportSection icon={<Heart className="w-3.5 h-3.5" style={{ color: accent }} />} title="당신의 매력">
                    {report.charm && <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{report.charm}</p>}
                    {report.strengths.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {report.strengths.map(s => (
                          <span key={s} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: `${accent}1F`, color: "hsl(var(--foreground))" }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </ReportSection>
                )}

                {report.growthPoints.length > 0 && (
                  <ReportSection icon={<TrendingUp className="w-3.5 h-3.5" style={{ color: accent }} />} title="이런 점을 채우면 더 빛나요">
                    <ul className="space-y-2">
                      {report.growthPoints.map((g, i) => (
                        <li key={i} className="flex gap-2 text-sm text-foreground leading-relaxed">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </ReportSection>
                )}

                {report.idealMatch && (
                  <ReportSection icon={<Compass className="w-3.5 h-3.5" style={{ color: accent }} />} title="어울리는 인연">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{report.idealMatch}</p>
                  </ReportSection>
                )}

                {report.loveStyle && (
                  <ReportSection icon={<Heart className="w-3.5 h-3.5" style={{ color: accent }} />} title="연애 스타일">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{report.loveStyle}</p>
                  </ReportSection>
                )}

                {report.destiny && (
                  <ReportSection icon={<Moon className="w-3.5 h-3.5" style={{ color: accent }} />} title="연애운" caption="사주를 엮은 · 재미로 보는 해석">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{report.destiny}</p>
                  </ReportSection>
                )}

                {report.advice && (
                  <div className="rounded-2xl p-5 text-sm leading-relaxed whitespace-pre-line" style={{ backgroundColor: `${accent}14`, color: "hsl(var(--foreground))" }}>
                    <p className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: accent }}>
                      <MessageCircle className="w-3.5 h-3.5" /> 팔리의 한마디
                    </p>
                    {report.advice}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">리포트를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</div>
            )
          ) : (
            /* 잠금: 블러된 목차 위로 해제 CTA */
            <div className="relative">
              <div className="blur-[6px] select-none pointer-events-none space-y-3" aria-hidden>
                {LOCKED_PREVIEW.map(t => (
                  <div key={t} className="bg-card rounded-2xl border border-border/60 shadow-card p-5">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{t}</p>
                    <div className="h-3 rounded bg-muted/70 mb-2" />
                    <div className="h-3 rounded bg-muted/70 w-4/5" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-start justify-center pt-8 px-4">
                <div className="bg-card/95 backdrop-blur rounded-2xl border border-border shadow-card-hover p-6 max-w-sm w-full space-y-3.5 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5 text-brand-strong" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">팔리의 연애 리포트</p>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      당신의 결 · 매력 육각형 · 강점 · 어울리는 인연 · 연애 스타일 · 사주로 보는 연애운까지,
                      당신만을 위한 깊이 있는 분석을 한 번에 풀어드려요.
                    </p>
                  </div>
                  <button
                    onClick={handleUnlock}
                    disabled={unlocking}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-soft text-brand-strong font-semibold py-3 rounded-xl disabled:opacity-50"
                  >
                    {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4" />}
                    {unlocking ? "여는 중..." : `${unlockCost} 물감으로 전체 보기`}
                  </button>
                  <p className="text-[11px] text-muted-foreground/70">한 번 열면 계속 볼 수 있어요</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReportSection({ icon, title, caption, children }: { icon: React.ReactNode; title: string; caption?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-3">
        {icon} {title}
        {caption && <span className="text-[10px] font-normal text-muted-foreground/70 ml-1">· {caption}</span>}
      </p>
      {children}
    </div>
  );
}
