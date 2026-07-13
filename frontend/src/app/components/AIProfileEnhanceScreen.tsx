import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Sparkles, RefreshCw, ArrowRight, ChevronDown, ChevronUp, Share2, Check, Pencil } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { useOnboardingOptions } from "../../lib/onboarding/useOnboardingOptions";
import { COLOR_META, type ColorType } from "../../lib/colorCompatibility";

interface IntroductionSection {
  heading: string;
  body: string;
}

interface ProfileGenerationResult {
  colorType: string;
  colorName: string;
  colorHex: string;
  colorDescription: string;
  generatedIntroduction: string;
  /** 소주제별로 나뉜 소개글 — 자연스러운 흐름의 스토리 (ADR 0059) */
  introductionSections?: IntroductionSection[];
  colorReasoning?: string;
  personalitySummary?: string;
  idealTypeInsight?: string;
  colorKeywords?: string[];
  strengths?: string[];
  // ADR 0056 — 색 판별 다근거 (답변/MBTI/사주)
  evidenceFromAnswers?: string;
  evidenceFromMbti?: string;
  evidenceFromSaju?: string;
}

interface AIProfileEnhanceScreenProps {
  onComplete: (result: ProfileGenerationResult) => void;
  /** 인터뷰/자기소개 답변 다시 작성하러 돌아가기 (INTERVIEW→인터뷰 화면, MANUAL→자기소개 화면) */
  onRedoAnswers?: () => void;
  introMethod: "INTERVIEW" | "MANUAL";
  profileData: {
    introduction: {
      interviewAnswers?: Record<string, string>;
      interests?: string[];
    };
    idealType: {
      personalities?: string[];
      datePreferences?: string[];
      importantValues?: string[];
      dealBreakers?: string[];
      ageMin?: number | null;
      ageMax?: number | null;
    };
    basicInfo?: {
      mbti?: string;
      birthYear?: string;
      birthMonth?: string;
      birthDay?: string;
      height?: number | null;
      bodyType?: string;
    };
    // 전체 프로필 미리보기용 (App 이 전체 profileData 를 그대로 넘김)
    careerInfo?: { category?: string };
    locationInfo?: { region?: string; district?: string };
    lifestyleInfo?: { smoking?: string; drinking?: string; religion?: string };
    photos?: string[];
  };
}

const COLOR_GRADIENT: Record<string, string> = {
  WARM_ORANGE: "from-orange-400 to-amber-400",
  CALM_BLUE: "from-blue-400 to-cyan-400",
  VIBRANT_RED: "from-red-400 to-rose-500",
  SOFT_PINK: "from-pink-300 to-rose-300",
  FRESH_GREEN: "from-green-400 to-emerald-400",
  ELEGANT_PURPLE: "from-purple-400 to-violet-500",
  BRIGHT_YELLOW: "from-yellow-300 to-amber-300",
  SOPHISTICATED_GRAY: "from-slate-400 to-gray-500",
};

const COLOR_SHARE_DESC: Record<string, string> = {
  WARM_ORANGE: "따뜻하고 에너지 넘치는",
  CALM_BLUE: "차분하고 신뢰감 주는",
  VIBRANT_RED: "열정적이고 강렬한",
  SOFT_PINK: "부드럽고 감성적인",
  FRESH_GREEN: "활기차고 자연스러운",
  ELEGANT_PURPLE: "우아하고 개성있는",
  BRIGHT_YELLOW: "밝고 긍정적인",
  SOPHISTICATED_GRAY: "성숙하고 세련된",
};

// 색 분석용 스토리 5문항 (job/date/loveValue/attractedTo 는 중복으로 제거됨 — basicInfo/idealType 단일 소스)
const INTERVIEW_LABELS: Record<string, string> = {
  weekend: "주말 활동",
  personality: "성격",
  passion: "요즘 관심사",
  happiness: "행복한 순간",
  motto: "좌우명",
};

const MANUAL_LABELS: Record<string, string> = {
  hobby: "쉬는 날엔",
  charm: "나의 매력",
  passion: "요즘 빠져있는 것",
  happiness: "행복한 순간",
  motto: "인생 좌우명",
};

const LOADING_STEPS = [
  { text: "답변을 하나하나 읽고 있어요" },
  { text: "성격·연애 성향과 MBTI를 함께 살펴봐요" },
  { text: "사주 오행까지 종합해 어울리는 색을 찾고 있어요" },
  { text: "세 가지를 모아 소개글을 완성하고 있어요" },
];

const CONFETTI_COLORS = [
  "#F97316", "#EC4899", "#3B82F6", "#22C55E", "#A855F7",
  "#FEF08A", "#F43F5E", "#06B6D4", "#84CC16", "#8B5CF6",
];

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  duration: number;
  delay: number;
  shape: "circle" | "square" | "rect";
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 30 + Math.random() * 40,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    angle: Math.random() * 360,
    duration: 0.8 + Math.random() * 1.2,
    delay: Math.random() * 0.5,
    shape: (["circle", "square", "rect"] as const)[Math.floor(Math.random() * 3)],
  }));
}

export function AIProfileEnhanceScreen({
  onComplete,
  onRedoAnswers,
  introMethod,
  profileData,
}: AIProfileEnhanceScreenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ProfileGenerationResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [copied, setCopied] = useState(false);
  // 소개글 직접 수정 (override) — AI 결과를 사람이 다듬어 그대로 저장
  const [editingIntro, setEditingIntro] = useState(false);
  const [editedIntro, setEditedIntro] = useState("");
  // 재생성 nonce — "다른 느낌으로 다시" 시 증가시켜 백엔드 캐시를 건너뛰고 새 결과를 받는다.
  const [variant, setVariant] = useState(0);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 섹션/평문 소개글을 편집용 단일 텍스트로 (heading 줄 + body, 섹션 사이 빈 줄)
  const introToText = (r: ProfileGenerationResult | null) => {
    if (!r) return "";
    if (r.introductionSections && r.introductionSections.length > 0) {
      return r.introductionSections.map((s) => (s.heading ? `${s.heading}\n${s.body}` : s.body)).join("\n\n");
    }
    return r.generatedIntroduction;
  };
  const startEditIntro = () => { setEditedIntro(introToText(result)); setEditingIntro(true); };
  const saveEditIntro = () => {
    const text = editedIntro.trim();
    if (result) setResult({ ...result, generatedIntroduction: text, introductionSections: [] });
    setEditingIntro(false);
  };

  const { options } = useOnboardingOptions();
  const answers = profileData.introduction.interviewAnswers ?? {};
  const idealType = profileData.idealType;
  const labels = introMethod === "INTERVIEW" ? INTERVIEW_LABELS : MANUAL_LABELS;

  // 칩 코드 → 한글 라벨 (전체 프로필 미리보기용). 못 찾으면 코드 그대로.
  const lbl = (setKey: string, code?: string | null) =>
    code ? ((options[setKey] ?? []).find((o) => o.code === code)?.label ?? code) : "";
  const lblList = (setKey: string, codes?: string[]) =>
    (codes ?? []).map((c) => lbl(setKey, c)).filter(Boolean);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, []);

  // Clear confetti after animation
  useEffect(() => {
    if (confetti.length > 0) {
      const t = setTimeout(() => setConfetti([]), 2500);
      return () => clearTimeout(t);
    }
  }, [confetti]);

  const startLoadingAnimation = useCallback(() => {
    setLoadingStepIdx(0);
    loadingIntervalRef.current = setInterval(() => {
      setLoadingStepIdx((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1200);
  }, []);

  const stopLoadingAnimation = useCallback(() => {
    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current);
      loadingIntervalRef.current = null;
    }
  }, []);

  const triggerReveal = useCallback(() => {
    // slight delay so DOM renders first
    setTimeout(() => {
      setRevealed(true);
      setConfetti(generateConfetti(50));
    }, 100);
  }, []);

  const handleGenerate = async (genVariant = 0) => {
    setIsGenerating(true);
    setRevealed(false);
    setResult(null);
    startLoadingAnimation();

    try {
      // ADR 0056 — MBTI + 생년월일(사주) 보강. birthDate 는 yyyy-MM-dd (서버가 User 값 우선)
      const bi = profileData.basicInfo;
      const birthDate = bi?.birthYear && bi?.birthMonth && bi?.birthDay
        ? `${bi.birthYear}-${String(bi.birthMonth).padStart(2, "0")}-${String(bi.birthDay).padStart(2, "0")}`
        : undefined;
      const requestBody = {
        introMethod,
        ...(introMethod === "INTERVIEW"
          ? { interviewAnswers: answers }
          : { manualAnswers: answers }),
        // 이상형·관심사는 저장된 '코드'라 그대로 보내면 LLM 이 코드를 읽음 → 반드시 한글 라벨로 변환.
        idealType: {
          personalities: lblList("personality", idealType.personalities),
          datePreferences: lblList("datePreference", idealType.datePreferences),
          importantValues: lblList("importantValue", idealType.importantValues),
          dealBreakers: lblList("dealBreaker", idealType.dealBreakers),
        },
        // 인터뷰가 스토리 5문항으로 축소되며 빠졌던 관심사 신호 복원 — 색·소개글 정확도 보강.
        interests: lblList("interest", profileData.introduction.interests),
        ...(bi?.mbti ? { mbti: bi.mbti } : {}),
        ...(birthDate ? { birthDate } : {}),
        ...(genVariant ? { variant: genVariant } : {}),
      };

      const data = await api.post<ProfileGenerationResult>(
        "/api/v1/ai-profile/generate",
        requestBody
      );
      setResult(data);
      triggerReveal();
    } catch {
      toast.error("생성에 실패했어요. 다시 시도해주세요.");
    } finally {
      stopLoadingAnimation();
      setIsGenerating(false);
    }
  };

  // "다른 느낌으로 다시" — nonce 증가로 캐시를 건너뛰고 새 결과를 받는다.
  const handleRegenerate = () => {
    const next = variant + 1;
    setVariant(next);
    setEditingIntro(false);
    handleGenerate(next);
  };

  // 인터뷰가 끝나면 이 화면에서 바로 자동 생성 (수동 "생성하기" 클릭 제거).
  const autoGenRef = useRef(false);
  useEffect(() => {
    if (autoGenRef.current) return;
    autoGenRef.current = true;
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 확인 → 바로 저장 → 심사 대기 (중간 "이제 이런 것 가능해요" 화면 제거: 심사 후에야 가능하므로 오해 소지).
  const handleComplete = () => {
    if (!result) return;
    onComplete(result);
  };

  const handleShare = async () => {
    if (!result) return;
    const shareText = `나는 팔레트에서 "${result.colorName}" 타입이에요! ${COLOR_SHARE_DESC[result.colorType] ?? ""} 성격의 나와 어울리는 사람을 찾고 있어요`;

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, title: "내 팔레트 색깔 타입" });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("클립보드에 복사되었어요!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const gradient = result
    ? (COLOR_GRADIENT[result.colorType] ?? "from-slate-400 to-gray-500")
    : "";
  const emoji = result ? (COLOR_META[result.colorType as ColorType]?.emoji ?? "") : "";

  return (
    // overflow-hidden 제거 — confetti 는 position:fixed 라 영향 없고, 이게 있으면
    // 콘텐츠가 화면보다 길 때 마지막 버튼("이 소개글로 완료하기")이 잘림.
    <div className="min-h-screen bg-background relative">
      {/* Confetti Layer */}
      {confetti.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
              100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
            }
            @keyframes confetti-burst {
              0% { transform: scale(0) rotate(0deg); opacity: 1; }
              60% { opacity: 1; }
              100% { transform: scale(1) translateY(80px) rotate(var(--angle)); opacity: 0; }
            }
          `}</style>
          {confetti.map((piece) => (
            <div
              key={piece.id}
              style={{
                position: "absolute",
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                width: piece.shape === "rect" ? piece.size * 2.5 : piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: piece.shape === "circle" ? "50%" : piece.shape === "square" ? "2px" : "1px",
                animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s both`,
                ["--angle" as string]: `${piece.angle}deg`,
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-center">소개 프로필 완성</h2>
        <p className="text-center text-sm text-muted-foreground mt-1">마지막 단계예요</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 pb-24 space-y-5">

        {/* 입력 내용 요약 */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-6 py-4"
            onClick={() => setShowDetail(!showDetail)}
          >
            <span className="font-medium text-sm">입력한 내용 확인</span>
            {showDetail ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showDetail && (
            <div className="px-6 pb-4 space-y-3 border-t border-border pt-3">
              {Object.entries(answers).filter(([, v]) => v).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-muted-foreground">{labels[key] ?? key}</p>
                  <p className="text-sm text-foreground mt-0.5">{value}</p>
                </div>
              ))}
              {(idealType.personalities?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">선호 성격</p>
                  <p className="text-sm text-foreground mt-0.5">{idealType.personalities!.join(", ")}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 결과 없을 때: 생성 버튼 or 로딩 */}
        {!result && (
          <div className="bg-secondary border border-border rounded-2xl p-6 text-center space-y-4">
            {isGenerating ? (
              /* 단계별 로딩 UI */
              <div className="space-y-6 py-2">
                <div className="w-20 h-20 rounded-full bg-brand-soft flex items-center justify-center mx-auto">
                  <Sparkles className="w-9 h-9 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground text-base">
                    {LOADING_STEPS[loadingStepIdx].text}
                  </p>
                  <div className="flex justify-center gap-1.5 mt-3">
                    {LOADING_STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          i <= loadingStepIdx
                            ? "bg-primary w-6"
                            : "bg-muted w-3"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    잠깐이면 돼요, 거의 다 됐어요
                  </p>
                </div>
              </div>
            ) : (
              /* 자동 생성 실패 시에만 노출 — 재시도 */
              <>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <RefreshCw className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">분석을 다시 시도할게요</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    잠시 연결이 원활하지 않았어요. 다시 시도해주세요.
                  </p>
                </div>
                <Button
                  onClick={handleGenerate}
                  className="w-full h-12 bg-brand-soft text-brand-strong"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도하기
                </Button>
              </>
            )}
          </div>
        )}

        {/* 결과 카드 */}
        {result && (
          <div className="space-y-4">
            {/* 색깔 타입 카드 — reveal animation */}
            <div
              style={{
                animation: revealed
                  ? "colorReveal 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both"
                  : "none",
              }}
            >
              <style>{`
                @keyframes colorReveal {
                  0% { opacity: 0; transform: scale(0.7) rotate(-4deg); }
                  60% { transform: scale(1.04) rotate(1deg); }
                  100% { opacity: 1; transform: scale(1) rotate(0deg); }
                }
              `}</style>
              <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-4xl">{emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm opacity-80">나의 색깔 타입</p>
                    <h3 className="text-2xl font-bold">{result.colorName}</h3>
                  </div>
                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                    {copied ? "복사됨" : "공유"}
                  </button>
                </div>
                <p className="text-sm opacity-90 leading-relaxed">{result.colorDescription}</p>

                {/* Decorative circles */}
                <div className="flex gap-1.5 mt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-white/40"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* AI 분석 근거 */}
            {(result.colorReasoning || (result.colorKeywords && result.colorKeywords.length > 0)) && (
              <div
                className="bg-card border border-border rounded-2xl p-5"
                style={{ animation: revealed ? "fadeInUp 0.5s ease 0.2s both" : "none" }}
              >
                <div className="mb-3">
                  <p className="text-sm font-medium">왜 이 색깔로 분석했나요</p>
                </div>
                {result.colorReasoning && (
                  <p className="text-sm text-foreground leading-relaxed mb-3 whitespace-pre-wrap">
                    {result.colorReasoning}
                  </p>
                )}
                {/* ADR 0056 — 답변/MBTI/사주 3출처 근거 */}
                {(result.evidenceFromAnswers || result.evidenceFromMbti || result.evidenceFromSaju) && (
                  <div className="space-y-2 mb-3">
                    {([
                      { label: "답변", text: result.evidenceFromAnswers },
                      { label: "MBTI", text: result.evidenceFromMbti },
                      { label: "사주 오행", text: result.evidenceFromSaju },
                    ] as const)
                      .filter((e) => e.text && e.text.trim().length > 0)
                      .map((e) => {
                        // 텍스트가 라벨 단어로 시작하면 제거 — "MBTI" + "MBTI INTP…" 중복 방지
                        const body = (e.text ?? "").trim().replace(
                          new RegExp(`^${e.label.replace(/\s/g, "\\s*")}\\s*[:：\\-]?\\s*`),
                          "",
                        );
                        return (
                          <div key={e.label} className="rounded-xl bg-muted/40 px-3 py-2">
                            <p className="text-[13px] leading-relaxed text-foreground/90">
                              <span className="font-semibold mr-1">{e.label}</span>{body}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}
                {result.colorKeywords && result.colorKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                    <span className="text-xs text-muted-foreground self-center mr-1">핵심 키워드</span>
                    {result.colorKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 생성된 소개글 */}
            {result.generatedIntroduction && (
              <div
                className="bg-card border border-border rounded-2xl p-5"
                style={{
                  animation: revealed
                    ? "fadeInUp 0.5s ease 0.3s both"
                    : "none",
                }}
              >
                <style>{`
                  @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                `}</style>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">AI가 완성한 소개글</p>
                  {!editingIntro && (
                    <button
                      onClick={startEditIntro}
                      className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Pencil className="w-3.5 h-3.5" /> 직접 수정
                    </button>
                  )}
                </div>
                {editingIntro ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedIntro}
                      onChange={(e) => setEditedIntro(e.target.value)}
                      rows={12}
                      autoFocus
                      className="w-full rounded-xl border border-border bg-background p-3 text-sm leading-relaxed text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="나를 가장 잘 보여줄 소개글로 자유롭게 다듬어 보세요."
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{editedIntro.trim().length}자</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingIntro(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                          취소
                        </button>
                        <button
                          onClick={saveEditIntro}
                          disabled={editedIntro.trim().length === 0}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-soft text-brand-strong disabled:opacity-50"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {result.introductionSections && result.introductionSections.length > 0 ? (
                      <div className="space-y-4">
                        {result.introductionSections.map((section, i) => (
                          <div key={i} className="space-y-1.5">
                            {section.heading && (
                              <div className="flex items-center gap-2">
                                <span className="w-1 h-3.5 rounded-full bg-primary/70" />
                                <h4 className="text-sm font-semibold text-foreground">{section.heading}</h4>
                              </div>
                            )}
                            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap pl-3">
                              {section.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.generatedIntroduction}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-4 text-right">
                      {(result.introductionSections && result.introductionSections.length > 0
                        ? result.introductionSections.reduce((sum, s) => sum + s.body.length, 0)
                        : result.generatedIntroduction.length)}자
                    </p>
                  </>
                )}
              </div>
            )}

            {/* 전체 프로필 미리보기 — 제출 전 확인용 */}
            {(() => {
              const bi = profileData.basicInfo;
              const age = bi?.birthYear ? `만 ${new Date().getFullYear() - parseInt(bi.birthYear)}세` : "";
              const region = [profileData.locationInfo?.region, profileData.locationInfo?.district].filter(Boolean).join(" ");
              const facts: [string, string][] = ([
                ["나이", age],
                ["키", bi?.height ? `${bi.height}cm` : ""],
                ["체형", lbl("bodyType", bi?.bodyType)],
                ["MBTI", bi?.mbti ?? ""],
                ["직업", profileData.careerInfo?.category ?? ""],
                ["지역", region],
                ["흡연", lbl("smoking", profileData.lifestyleInfo?.smoking)],
                ["음주", lbl("drinking", profileData.lifestyleInfo?.drinking)],
              ] as [string, string][]).filter(([, v]) => !!v);
              const interests = lblList("interest", profileData.introduction.interests);
              const idealChips: [string, string[]][] = ([
                ["선호 성격", lblList("personality", idealType.personalities)],
                ["데이트", lblList("datePreference", idealType.datePreferences)],
                ["중요 가치", lblList("importantValue", idealType.importantValues)],
              ] as [string, string[]][]).filter(([, v]) => v.length > 0);
              const chip = "text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border";
              return (
                <div
                  className="bg-card border border-border rounded-2xl p-5 space-y-4"
                  style={{ animation: revealed ? "fadeInUp 0.5s ease 0.4s both" : "none" }}
                >
                  <p className="text-sm font-medium">내 프로필 미리보기</p>
                  {(profileData.photos?.length ?? 0) > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {profileData.photos!.slice(0, 6).map((src, i) => (
                        <img key={i} src={src} alt="" className="w-16 h-20 rounded-lg object-cover shrink-0 border border-border" />
                      ))}
                    </div>
                  )}
                  {facts.length > 0 && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {facts.map(([k, v]) => (
                        <div key={k} className="flex items-baseline gap-2 text-sm">
                          <span className="text-xs text-muted-foreground w-9 shrink-0">{k}</span>
                          <span className="text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {interests.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">관심사</p>
                      <div className="flex flex-wrap gap-1.5">
                        {interests.map((t) => <span key={t} className={chip}>{t}</span>)}
                      </div>
                    </div>
                  )}
                  {idealChips.length > 0 && (
                    <div className="pt-3 border-t border-border space-y-2">
                      <p className="text-xs text-muted-foreground">이상형</p>
                      {idealChips.map(([k, items]) => (
                        <div key={k} className="space-y-1">
                          <p className="text-[11px] text-muted-foreground/80">{k}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {items.map((t) => <span key={t} className={chip}>{t}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 확인 / 다시 작성 */}
            <div
              className="space-y-3"
              style={{
                animation: revealed ? "fadeInUp 0.5s ease 0.5s both" : "none",
              }}
            >
              <Button
                onClick={handleComplete}
                disabled={isGenerating}
                className="w-full h-12 bg-brand-soft text-brand-strong"
              >
                이대로 확인 — 심사 요청하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {/* 답변은 그대로 두고 AI 결과만 다시 — 캐시 우회로 새 결과 */}
              <Button
                onClick={handleRegenerate}
                disabled={isGenerating || editingIntro}
                variant="outline"
                className="w-full h-11 border-border text-foreground hover:bg-muted"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다른 느낌으로 다시 써줘
              </Button>

              {onRedoAnswers && (
                <button
                  onClick={onRedoAnswers}
                  disabled={isGenerating || editingIntro}
                  className="w-full h-10 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  답변부터 다시 작성할래요
                </button>
              )}
            </div>

            <p
              className="text-center text-xs text-muted-foreground"
              style={{
                animation: revealed ? "fadeInUp 0.5s ease 0.6s both" : "none",
              }}
            >
              확인하면 심사 후 프로필이 공개돼요. 내용은 나중에 프로필 편집에서 수정할 수 있어요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
