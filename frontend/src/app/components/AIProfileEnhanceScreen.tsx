import { useState } from "react";
import { Button } from "./ui/button";
import { Sparkles, RefreshCw, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface ProfileGenerationResult {
  colorType: string;
  colorName: string;
  colorHex: string;
  colorDescription: string;
  generatedIntroduction: string;
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

export function AIProfileEnhanceScreen({
  onComplete,
  introMethod,
  profileData,
}: AIProfileEnhanceScreenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ProfileGenerationResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const answers = profileData.introduction.interviewAnswers ?? {};
  const idealType = profileData.idealType;

  const labels = introMethod === "INTERVIEW" ? INTERVIEW_LABELS : MANUAL_LABELS;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
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
      };

      const data = await api.post<ProfileGenerationResult>(
        "/api/v1/ai-profile/generate",
        requestBody
      );
      setResult(data);
    } catch {
      toast.error("생성에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (!result) return;
    onComplete(result);
  };

  const handleSkip = () => {
    onComplete({
      colorType: "SOFT_PINK",
      colorName: "소프트 핑크",
      colorHex: "#F9A8D4",
      colorDescription: "",
      generatedIntroduction: "",
    });
  };

  const gradient = result ? (COLOR_GRADIENT[result.colorType] ?? "from-slate-400 to-gray-500") : "";
  const emoji = result ? (COLOR_EMOJI[result.colorType] ?? "✨") : "";

  return (
    <div className="min-h-screen bg-background">
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

        {/* 결과 없을 때: 생성 버튼 */}
        {!result && (
          <div className="bg-secondary border border-border rounded-2xl p-6 text-center space-y-4">
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
              disabled={isGenerating}
              className="w-full h-12 bg-primary text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  AI가 분석 중이에요...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 소개글 & 색깔 타입 생성하기
                </>
              )}
            </Button>
            <Button
              onClick={handleSkip}
              disabled={isGenerating}
              variant="ghost"
              className="w-full text-muted-foreground text-sm"
            >
              건너뛰기 (나중에 직접 작성)
            </Button>
          </div>
        )}

        {/* 결과 */}
        {result && (
          <div className="space-y-4">
            {/* 색깔 타입 카드 */}
            <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{emoji}</span>
                <div>
                  <p className="text-sm opacity-80">나의 색깔 타입</p>
                  <h3 className="text-xl font-bold">{result.colorName}</h3>
                </div>
              </div>
              <p className="text-sm opacity-90 leading-relaxed">{result.colorDescription}</p>
            </div>

            {/* 생성된 소개글 */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium">AI가 완성한 소개글</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{result.generatedIntroduction}</p>
            </div>

            {/* 재생성 + 완료 */}
            <div className="space-y-3">
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
                className="w-full h-12 bg-primary text-primary-foreground"
              >
                이 소개글로 완료하기
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              나중에 프로필 편집에서 직접 수정할 수 있어요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
