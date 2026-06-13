import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Sparkles, RefreshCw, ArrowRight, ChevronDown, ChevronUp, Share2, Check } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface ProfileGenerationResult {
  colorType: string;
  colorName: string;
  colorHex: string;
  colorDescription: string;
  generatedIntroduction: string;
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
  introMethod: "INTERVIEW" | "MANUAL";
  profileData: {
    introduction: {
      interviewAnswers?: Record<string, string>;
    };
    idealType: {
      personalities?: string[];
      datePreferences?: string[];
      importantValues?: string[];
      dealBreakers?: string[];
    };
    basicInfo?: {
      mbti?: string;
      birthYear?: string;
      birthMonth?: string;
      birthDay?: string;
    };
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

const COLOR_EMOJI: Record<string, string> = {
  WARM_ORANGE: "🍊",
  CALM_BLUE: "🌊",
  VIBRANT_RED: "🔥",
  SOFT_PINK: "🌸",
  FRESH_GREEN: "🌿",
  ELEGANT_PURPLE: "💜",
  BRIGHT_YELLOW: "☀️",
  SOPHISTICATED_GRAY: "🩶",
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

const INTERVIEW_LABELS: Record<string, string> = {
  job: "직업",
  weekend: "주말 활동",
  personality: "성격",
  passion: "요즘 관심사",
  happiness: "행복한 순간",
  date: "이상적인 데이트",
  loveValue: "연애에서 중요한 것",
  attractedTo: "끌리는 타입",
  dealBreaker: "절대 안 되는 것",
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
  { text: "당신의 이야기를 읽고 있어요", emoji: "📖" },
  { text: "성격 패턴을 분석하고 있어요", emoji: "🔍" },
  { text: "나만의 색깔 타입을 찾고 있어요", emoji: "🎨" },
  { text: "소개글을 완성하고 있어요", emoji: "✍️" },
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

const WHAT_NEXT_ITEMS = [
  { icon: "💌", text: "매칭 요청을 받아볼 수 있어요" },
  { icon: "🌐", text: "지인을 통해 소개받을 수 있어요" },
  { icon: "⭐", text: "프로필 완성도를 높여 노출을 늘려보세요" },
  { icon: "🎁", text: "친구를 초대하면 매칭 크레딧을 드려요" },
];

export function AIProfileEnhanceScreen({
  onComplete,
  introMethod,
  profileData,
}: AIProfileEnhanceScreenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ProfileGenerationResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showWhatNext, setShowWhatNext] = useState(false);
  const [copied, setCopied] = useState(false);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const answers = profileData.introduction.interviewAnswers ?? {};
  const idealType = profileData.idealType;
  const labels = introMethod === "INTERVIEW" ? INTERVIEW_LABELS : MANUAL_LABELS;

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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setRevealed(false);
    setResult(null);
    setShowWhatNext(false);
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
        idealType: {
          personalities: idealType.personalities ?? [],
          datePreferences: idealType.datePreferences ?? [],
          importantValues: idealType.importantValues ?? [],
          dealBreakers: idealType.dealBreakers ?? [],
        },
        ...(bi?.mbti ? { mbti: bi.mbti } : {}),
        ...(birthDate ? { birthDate } : {}),
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

  const handleComplete = () => {
    if (!result) return;
    setShowWhatNext(true);
  };

  const handleFinalComplete = () => {
    if (!result) return;
    onComplete(result);
  };

  const handleSkip = () => {
    const skipped: ProfileGenerationResult = {
      colorType: "SOFT_PINK",
      colorName: "소프트 핑크",
      colorHex: "#F9A8D4",
      colorDescription: "부드럽고 감성적인 당신만의 색깔이에요.",
      generatedIntroduction: "",
    };
    toast("🌸 소프트 핑크 타입으로 시작해요!", {
      description: "나중에 AI 분석으로 내 진짜 색깔을 찾아보세요",
      duration: 4000,
    });
    onComplete(skipped);
  };

  const handleShare = async () => {
    if (!result) return;
    const shareText = `나는 팔레트에서 "${result.colorName}" 타입이에요! ${COLOR_SHARE_DESC[result.colorType] ?? ""} 성격의 나와 어울리는 사람을 찾고 있어요 🎨`;

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
  const emoji = result ? (COLOR_EMOJI[result.colorType] ?? "✨") : "";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
        <h2 className="text-center">AI 프로필 완성</h2>
        <p className="text-center text-sm text-muted-foreground mt-1">마지막 단계예요</p>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-5">

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
                  <span className="text-4xl animate-bounce">{LOADING_STEPS[loadingStepIdx].emoji}</span>
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
                    잠깐이면 돼요, 거의 다 됐어요 ✨
                  </p>
                </div>
              </div>
            ) : (
              /* 초기 생성 버튼 */
              <>
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">AI 소개글 생성</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    입력한 내용을 바탕으로 소개글과<br />나만의 색깔 타입을 찾아드려요
                  </p>
                </div>
                <Button
                  onClick={handleGenerate}
                  className="w-full h-12 bg-brand-soft text-gold-strong"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 소개글 &amp; 색깔 타입 생성하기
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  className="w-full text-muted-foreground text-sm"
                >
                  건너뛰기 (나중에 직접 작성)
                </Button>
              </>
            )}
          </div>
        )}

        {/* "다음은 이런 것들이 가능해요" 완료 가이드 */}
        {showWhatNext && result && (
          <div
            style={{
              animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            <style>{`
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(24px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="text-center">
                <span className="text-2xl">🎉</span>
                <h3 className="font-bold text-lg mt-1">프로필 완성!</h3>
                <p className="text-sm text-muted-foreground mt-1">이제 이런 것들을 할 수 있어요</p>
              </div>
              <div className="space-y-3">
                {WHAT_NEXT_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={handleFinalComplete}
                className="w-full h-12 bg-brand-soft text-gold-strong"
              >
                팔레트 시작하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* 결과 카드 */}
        {result && !showWhatNext && (
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
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🔍</span>
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
                      { icon: "💬", label: "답변", text: result.evidenceFromAnswers },
                      { icon: "🧩", label: "MBTI", text: result.evidenceFromMbti },
                      { icon: "🔮", label: "사주 오행", text: result.evidenceFromSaju },
                    ] as const)
                      .filter((e) => e.text && e.text.trim().length > 0)
                      .map((e) => (
                        <div key={e.label} className="flex gap-2 rounded-xl bg-muted/40 px-3 py-2">
                          <span className="text-sm flex-shrink-0">{e.icon}</span>
                          <p className="text-[13px] leading-relaxed text-foreground/90">
                            <span className="font-semibold mr-1">{e.label}</span>{e.text}
                          </p>
                        </div>
                      ))}
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
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium">AI가 완성한 소개글</p>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.generatedIntroduction}</p>
                {result.generatedIntroduction && (
                  <p className="text-xs text-muted-foreground mt-3 text-right">
                    {result.generatedIntroduction.length}자
                  </p>
                )}
              </div>
            )}

            {/* 재생성 + 완료 */}
            <div
              className="space-y-3"
              style={{
                animation: revealed ? "fadeInUp 0.5s ease 0.5s both" : "none",
              }}
            >
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                variant="outline"
                className="w-full h-11 border-border text-primary hover:bg-muted"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "재생성 중..." : "다시 생성하기"}
              </Button>

              <Button
                onClick={handleComplete}
                className="w-full h-12 bg-brand-soft text-gold-strong"
              >
                이 소개글로 완료하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <p
              className="text-center text-xs text-muted-foreground"
              style={{
                animation: revealed ? "fadeInUp 0.5s ease 0.6s both" : "none",
              }}
            >
              나중에 프로필 편집에서 직접 수정할 수 있어요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
