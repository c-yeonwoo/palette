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
import { Sparkles, Lock, ChevronRight, X, Check, Palette, Star, Heart, Compass, HelpCircle } from "lucide-react";
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

type StageKey = "color" | "trait" | "strengths" | "ideal" | "dateCode";
interface Stage {
  key: StageKey;
  label: string;
  /** 통일된 한 줄 소개 — 활성/비활성 공통 톤 */
  caption: string;
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
  const allUnlocked = unlockedCount === stages.length;
  const cs = profile.colorType;

  // 5단계 콘텐츠 (key 기반 매핑)
  const renderStageContent: Record<StageKey, () => React.ReactNode> = {
    color: () => cs?.name && (
      <div className="flex items-start gap-3">
        {accentHex && (
          <span className="w-9 h-9 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm" style={{ backgroundColor: accentHex }} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground leading-tight">{cs.name}</p>
          {cs.reasoning && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{cs.reasoning}</p>
          )}
        </div>
      </div>
    ),
    trait: () => cs?.personalitySummary && (
      <p className="text-sm text-foreground/85 leading-relaxed">{cs.personalitySummary}</p>
    ),
    strengths: () => cs?.strengths && cs.strengths.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {cs.strengths.slice(0, 5).map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: accentHex ? `${accentHex}1F` : "hsl(var(--brand-soft))",
              color: "hsl(var(--gold-strong))",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    ),
    ideal: () => cs?.idealTypeInsight && (
      <p className="text-sm text-foreground/85 leading-relaxed">{cs.idealTypeInsight}</p>
    ),
    dateCode: () => <DateCodeViz colorType={colorTypeKey} accentHex={accentHex} />,
  };

  return (
    <section>
      {/* ── 카드 밖 헤더 ── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-extrabold text-foreground tracking-tight">팔레트의 분석</h2>
          <UsageHelpButton allUnlocked={allUnlocked} unlockedCount={unlockedCount} total={stages.length} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-foreground">{unlockedCount}<span className="text-muted-foreground">/{stages.length}</span></span>
          <div className="flex items-center gap-0.5" aria-label="진행도">
            {stages.map((s, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${s.unlocked ? "bg-gold-strong" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3 px-1">프로필을 채울수록 더 깊이 알아가요</p>

      {/* ── 카드 리스트 ── */}
      <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden divide-y divide-border">
        {stages.map(stage => (
          <StageRow
            key={stage.key}
            stage={stage}
            onLockClick={onNavigateToEdit}
            onUnlockedClick={stage.key === "color" ? onNavigateToColor : undefined}
          >
            {renderStageContent[stage.key]()}
          </StageRow>
        ))}
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
      <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
        stage.unlocked ? "bg-brand-soft" : "bg-muted/60"
      }`}>
        {stage.unlocked
          ? <stage.Icon className="w-4 h-4 text-gold-strong" />
          : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold leading-tight ${stage.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
          {stage.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{stage.caption}</p>
        <div className="mt-2.5">
          {stage.unlocked
            ? children
            : <p className="text-xs text-muted-foreground/80">{stage.hint}</p>}
        </div>
      </div>
      {handleClick && <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0 mt-1.5" />}
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

/** 단계 unlock 조건 평가 — 사용자 의도 순서: 색 → 결 → 매력 → 인연 → 데이트 코드 */
function useStages(profile: ProfileLike): Stage[] {
  return useMemo(() => {
    const ct = profile.colorType;
    const colorReady = !!ct?.name;
    const traitReady = !!ct?.personalitySummary;
    const strengthsReady = !!ct?.strengths && ct.strengths.length > 0;
    const idealReady = !!ct?.idealTypeInsight;
    const fullReady =
      (profile.metrics?.completionRate ?? 0) >= 100 &&
      !!ct?.type &&
      !!profile.attachmentProfile;

    return [
      { key: "color",     label: "당신의 색",     caption: "팔레트가 고른 당신의 컬러 타입",      Icon: Palette,  unlocked: colorReady,     hint: "AI 인터뷰를 완료하면 색이 정해져요" },
      { key: "trait",     label: "당신의 결",     caption: "답변에서 읽힌 성격·연애 성향",        Icon: Sparkles, unlocked: traitReady,     hint: "인터뷰를 채우면 결이 드러나요" },
      { key: "strengths", label: "당신의 매력",   caption: "팔레트가 본 당신의 강점",             Icon: Star,     unlocked: strengthsReady, hint: "인터뷰를 더 채우면 매력 포인트가 정리돼요" },
      { key: "ideal",     label: "어울리는 인연", caption: "어떤 사람과 잘 맞을지 유추",          Icon: Heart,    unlocked: idealReady,     hint: "이상형을 채우면 어울리는 인연이 보여요" },
      { key: "dateCode",  label: "데이트 코드",   caption: "두 축으로 표현한 데이트 스타일",      Icon: Compass,  unlocked: fullReady,      hint: "프로필을 모두 채우면 데이트 코드가 열려요" },
    ];
  }, [profile]);
}

/**
 * 헤더 옆 (?) 도움말 — 분석 결과가 어디에 활용되는지 호버/탭으로 노출.
 * 모바일에서는 탭으로 토글, 데스크탑에서는 hover 도 동작.
 */
function UsageHelpButton({
  allUnlocked,
  unlockedCount,
  total,
}: {
  allUnlocked: boolean;
  unlockedCount: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);

  const usages: Array<{ Icon: React.ElementType; title: string; desc: string }> = [
    { Icon: Sparkles, title: "팔레트 Pick 추천 정밀도",  desc: "당신의 색·결·매력을 기반으로 매일 추천이 더 정교해져요" },
    { Icon: Heart,    title: "어울리는 인연 우선 노출", desc: "지인 피드에서 궁합이 좋은 상대를 먼저 보여드려요" },
    { Icon: Palette,  title: "프로필 자동 업데이트",    desc: "분석 결과가 소개글·색 카드에 자연스럽게 반영돼요" },
    { Icon: Compass,  title: "주선자 참고 자료",        desc: "주선 요청을 받은 분이 당신을 더 빠르게 이해해요" },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        className="w-5 h-5 rounded-full inline-flex items-center justify-center hover:bg-muted/60 transition-colors"
        aria-label="분석 결과는 어디에 활용되나요?"
      >
        <HelpCircle className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
          onMouseLeave={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl p-5 shadow-overlay animate-slide-up relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 w-8 h-8 rounded-full hover:bg-muted/50 flex items-center justify-center"
              aria-label="닫기"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex items-baseline justify-between mb-4 pr-7">
              <p className="text-base font-extrabold text-foreground">
                {allUnlocked ? "이 분석은 이렇게 활용돼요" : "분석이 깊어질수록 이렇게 활용돼요"}
              </p>
              <p className="text-xs font-semibold text-muted-foreground flex-shrink-0">{unlockedCount}/{total}</p>
            </div>
            <ul className="space-y-3">
              {usages.map((u, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
                    <u.Icon className="w-4 h-4 text-gold-strong" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{u.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{u.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
