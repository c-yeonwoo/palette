/**
 * 팔레트의 분석 — 인사이트 점진 공개 패널.
 *
 * 프로필을 채울수록 5단계 인사이트가 unlock 된다:
 *  1. 컬러 힌트     — basicInfo 충족 시
 *  2. 컬러 확정     — colorType.name + reasoning
 *  3. 강점 태그     — colorType.strengths (LLM 분석)
 *  4. 이상형 유추   — colorType.idealTypeInsight
 *  5. 데이트 코드   — completionRate 100 (애착·이상형 등 full)
 *
 * 단계 진입 시 1회성 unlock 모달(localStorage 추적)을 띄워 "팔레트가 새로운 걸
 * 알아냈어요" 내러티브를 만든다.
 *
 * ADR 0037 — 점진 공개 + 강점 태그(Phase B) + 데이트 코드(Phase C).
 */
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Lock, ChevronRight, X, Check, Palette, Star, Heart, Compass } from "lucide-react";
import { COLOR_META, type ColorType } from "../../../lib/colorCompatibility";
import { dateCodeFor } from "../../../lib/dateCode";

interface ProfileLike {
  metrics?: { completionRate: number };
  basicInfo?: { height?: number | null; mbti?: string | null };
  careerInfo?: { category?: string | null };
  colorType?: {
    type?: string | null;
    name?: string | null;
    hex?: string | null;
    description?: string | null;
    reasoning?: string | null;
    personalitySummary?: string | null;
    idealTypeInsight?: string | null;
    strengths?: string[] | null;
  } | null;
  attachmentProfile?: unknown;
}

interface PaletteInsightPanelProps {
  profile: ProfileLike;
  /** 잠긴 카드를 클릭했을 때 — 어디로 보낼지(보통 프로필 편집 화면) */
  onNavigateToEdit?: () => void;
  /** 컬러 카드 클릭 — 컬러 상세로 이동 (선택) */
  onNavigateToColor?: () => void;
}

type StageKey = "hint" | "color" | "strengths" | "ideal" | "dateCode";
interface Stage {
  key: StageKey;
  label: string;
  Icon: React.ElementType;
  unlocked: boolean;
  /** 잠금일 때 노출되는 다음 단계 안내 카피 */
  hint: string;
}

const SEEN_KEY = "palette:insights:seenStages:v1";

export function PaletteInsightPanel({ profile, onNavigateToEdit, onNavigateToColor }: PaletteInsightPanelProps) {
  const stages = useStages(profile);
  const colorTypeKey = (profile.colorType?.type ?? null) as ColorType | null;
  const accentHex = profile.colorType?.hex ?? null;

  // ── 단계 진입 모달 (1회성) ──
  const [unlockModalStage, setUnlockModalStage] = useState<Stage | null>(null);
  useEffect(() => {
    try {
      const seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as StageKey[];
      const newUnlocked = stages.find(s => s.unlocked && !seen.includes(s.key));
      if (newUnlocked) {
        setUnlockModalStage(newUnlocked);
        localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, newUnlocked.key]));
      }
    } catch {}
  }, [stages]);

  const unlockedCount = stages.filter(s => s.unlocked).length;

  return (
    <section className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-brand-soft flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-gold-strong" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">팔레트의 분석</p>
          <p className="text-xs text-muted-foreground">프로필을 채울수록 더 깊이 알아가요 · {unlockedCount}/{stages.length} 발견</p>
        </div>
        <div className="flex items-center gap-0.5" aria-label="진행도">
          {stages.map((s, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${s.unlocked ? "bg-gold-strong" : "bg-muted"}`}
            />
          ))}
        </div>
      </div>

      {/* 카드 리스트 */}
      <div className="divide-y divide-border">
        {/* 1. 컬러 힌트 */}
        <StageRow stage={stages[0]} onLockClick={onNavigateToEdit}>
          <p className="text-sm text-foreground/85">
            기본 정보를 채워주셔서, 팔레트가 당신의 결을 읽고 있어요.
          </p>
        </StageRow>

        {/* 2. 컬러 확정 */}
        <StageRow stage={stages[1]} onLockClick={onNavigateToEdit} onUnlockedClick={onNavigateToColor}>
          {profile.colorType?.name && (
            <div className="flex items-start gap-3">
              {accentHex && (
                <span className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: accentHex }} />
              )}
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground">{profile.colorType.name}</p>
                {profile.colorType.reasoning && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-3">
                    {profile.colorType.reasoning}
                  </p>
                )}
              </div>
            </div>
          )}
        </StageRow>

        {/* 3. 강점 태그 */}
        <StageRow stage={stages[2]} onLockClick={onNavigateToEdit}>
          {profile.colorType?.strengths && profile.colorType.strengths.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2">팔레트가 본 당신의 매력</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.colorType.strengths.slice(0, 5).map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: accentHex ? `${accentHex}1F` : "hsl(var(--brand-soft))",
                      color: accentHex ? undefined : "hsl(var(--gold-strong))",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </StageRow>

        {/* 4. 이상형 유추 */}
        <StageRow stage={stages[3]} onLockClick={onNavigateToEdit}>
          {profile.colorType?.idealTypeInsight && (
            <p className="text-sm text-foreground/85 leading-relaxed">
              {profile.colorType.idealTypeInsight}
            </p>
          )}
        </StageRow>

        {/* 5. 데이트 코드 — 좌표 시각화 */}
        <StageRow stage={stages[4]} onLockClick={onNavigateToEdit}>
          <DateCodeViz colorType={colorTypeKey} accentHex={accentHex} />
        </StageRow>
      </div>

      {/* ── Unlock 모달 ── */}
      {unlockModalStage && (
        <InsightUnlockModal
          stage={unlockModalStage}
          accentHex={accentHex}
          onClose={() => setUnlockModalStage(null)}
        />
      )}
    </section>
  );
}

/** 한 단계(row) 렌더 — 잠금/해제 공통 */
function StageRow({
  stage,
  children,
  onLockClick,
  onUnlockedClick,
}: {
  stage: Stage;
  children: React.ReactNode;
  onLockClick?: () => void;
  onUnlockedClick?: () => void;
}) {
  const lockedClickable = !stage.unlocked && !!onLockClick;
  const unlockedClickable = stage.unlocked && !!onUnlockedClick;
  const handleClick = lockedClickable ? onLockClick : unlockedClickable ? onUnlockedClick : undefined;

  const Wrapper: React.ElementType = handleClick ? "button" : "div";
  return (
    <Wrapper
      onClick={handleClick}
      className={`w-full text-left px-5 py-4 flex items-start gap-3 ${
        handleClick ? "transition-colors enabled:hover:bg-muted/30 active:scale-[0.997]" : ""
      }`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        stage.unlocked ? "bg-brand-soft" : "bg-muted/60"
      }`}>
        {stage.unlocked
          ? <stage.Icon className="w-4 h-4 text-gold-strong" />
          : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold ${stage.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
          {stage.label}
        </p>
        <div className="mt-1.5">
          {stage.unlocked
            ? children
            : <p className="text-xs text-muted-foreground">{stage.hint}</p>}
        </div>
      </div>
      {handleClick && <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-1" />}
    </Wrapper>
  );
}

/** 데이트 코드 좌표 시각화 (2축 grid + dot) */
function DateCodeViz({ colorType, accentHex }: { colorType: ColorType | null; accentHex: string | null }) {
  const code = dateCodeFor(colorType);
  if (!code) return null;
  const color = accentHex ?? "hsl(var(--gold-strong))";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="text-base font-bold text-foreground">{code.label}</p>
        <p className="text-xs text-muted-foreground">{code.energy} · {code.planning}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{code.vibe}</p>
      {/* 2축 grid */}
      <div className="relative aspect-square max-w-[220px] mx-auto bg-muted/30 rounded-xl border border-border">
        {/* 십자축 */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
        {/* dot */}
        <span
          className="absolute w-4 h-4 rounded-full ring-2 ring-white shadow-card"
          style={{
            backgroundColor: color,
            left: `${code.energy}%`,
            top: `${100 - code.planning}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
        {/* 축 라벨 */}
        <span className="absolute left-2 top-1.5 text-xs font-semibold text-foreground/70">계획</span>
        <span className="absolute left-2 bottom-1.5 text-xs font-semibold text-foreground/70">즉흥</span>
        <span className="absolute right-2 bottom-1.5 text-xs font-semibold text-foreground/70">활동</span>
        <span className="absolute left-2 bottom-1.5 text-xs font-semibold text-foreground/70 invisible">즉흥</span>
        <span className="absolute right-2 top-1.5 text-xs font-semibold text-foreground/70 invisible">활동</span>
        <span className="absolute left-1/2 -translate-x-1/2 top-1 text-xs text-muted-foreground" aria-hidden>↑</span>
        <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 text-xs text-muted-foreground" aria-hidden>↓</span>
      </div>
    </div>
  );
}

/** 단계 진입 1회성 모달 */
function InsightUnlockModal({
  stage,
  accentHex,
  onClose,
}: {
  stage: Stage;
  accentHex: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-overlay animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center" aria-label="닫기">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ backgroundColor: accentHex ? `${accentHex}26` : "hsl(var(--brand-soft))" }}
          >
            <stage.Icon className="w-7 h-7" style={{ color: accentHex ?? undefined }} />
          </div>
          <p className="text-xs font-bold text-gold-strong uppercase tracking-wide">팔레트가 새로운 걸 알아냈어요</p>
          <h3 className="text-xl font-extrabold text-foreground mt-1">{stage.label}</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            프로필을 채워주실수록 팔레트가 당신을 더 깊이 이해해요. 다음 발견까지 한 걸음 더.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-2xl bg-brand-soft text-gold-strong font-bold shadow-card active:scale-95 transition-transform inline-flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4" /> 확인했어요
        </button>
      </div>
    </div>
  );
}

/** 단계 unlock 조건 평가 */
function useStages(profile: ProfileLike): Stage[] {
  return useMemo(() => {
    const ct = profile.colorType;
    const basicFilled =
      !!profile.basicInfo?.height ||
      !!profile.basicInfo?.mbti ||
      !!profile.careerInfo?.category;
    const colorReady = !!ct?.name;
    const strengthsReady = !!ct?.strengths && ct.strengths.length > 0;
    const idealReady = !!ct?.idealTypeInsight;
    const fullReady =
      (profile.metrics?.completionRate ?? 0) >= 100 &&
      !!ct?.type &&
      !!profile.attachmentProfile;

    return [
      { key: "hint",      label: "당신의 결",     Icon: Sparkles, unlocked: basicFilled,    hint: "기본 정보를 채우면 시작돼요" },
      { key: "color",     label: "당신의 색",     Icon: Palette,  unlocked: colorReady,     hint: "AI 인터뷰를 완료하면 색이 정해져요" },
      { key: "strengths", label: "당신의 매력",   Icon: Star,     unlocked: strengthsReady, hint: "인터뷰를 더 채우면 강점이 드러나요" },
      { key: "ideal",     label: "어울리는 인연", Icon: Heart,    unlocked: idealReady,     hint: "이상형을 채우면 어울리는 인연이 보여요" },
      { key: "dateCode",  label: "데이트 코드",   Icon: Compass,  unlocked: fullReady,      hint: "프로필을 모두 채우면 데이트 코드가 열려요" },
    ];
  }, [profile]);
}
