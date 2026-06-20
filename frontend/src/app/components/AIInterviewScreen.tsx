import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronRight, Palette, Sparkles } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface InterviewQuestion {
  id: string;
  step: number;
  category: string;
  question: string;
  hint: string;
  inputType: "text" | "chips";
  chips?: string[];
}

/** 적응형 인터뷰 컨텍스트 (ADR 0068) — 앞 단계에서 모은 구조화 정보를 코드 그대로 백엔드에 전달.
 *  코드→한글 라벨 해석은 백엔드(field_options)가 처리하므로 여기선 가공하지 않는다. */
export interface AdaptiveInterviewContext {
  mbti?: string;
  jobCategory?: string;
  interests?: string[];
  smoking?: string;
  drinking?: string;
  datingStyle?: Record<string, string>;
  idealPersonalities?: string[];
  idealDatePreferences?: string[];
  idealImportantValues?: string[];
}

interface AIInterviewScreenProps {
  onComplete: (answers: Record<string, string>) => void;
  onBack: () => void;
  /** 재진행 모드: 이전 답변을 미리 채워두고 인사 메시지 변경 (ADR 0037 후속) */
  initialAnswers?: Record<string, string> | null;
  /** 신규 온보딩에서 앞 단계(라이프스타일·이상형·MBTI)를 바탕으로 맞춤 질문 생성 (ADR 0068).
   *  없거나 재진행 모드면 정적 질문 사용. */
  profileContext?: AdaptiveInterviewContext | null;
}

/** 인터뷰를 진행하는 팔레트 마스코트 — 게이미피케이션(ADR 0068 후속).
 *  채팅 로그가 쌓이지 않고, 캐릭터의 말풍선이 한 칸씩 바뀐다. */
const MASCOT_NAME = "팔리";

export function AIInterviewScreen({ onComplete, onBack, initialAnswers, profileContext }: AIInterviewScreenProps) {
  const isReanalyze = !!initialAnswers && Object.values(initialAnswers).some(v => !!v);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [currentInput, setCurrentInput] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [started, setStarted] = useState(false);   // 인사 단계 → 질문 단계
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    fetchQuestions();
    fetchNickname();
  }, []);

  // 재진행 모드: 단계 진입 시 이전(최신) 답변을 입력창에 미리 채워 수정 편의 제공.
  useEffect(() => {
    if (!isReanalyze) return;
    const q = questions[currentStep];
    const prev = q ? (answers[q.id] ?? "") : "";
    setCurrentInput(q?.inputType === "chips" ? "" : prev);
    if (q?.inputType === "chips" && prev) {
      setSelectedChips(prev.split(",").map(s => s.trim()).filter(Boolean));
    } else {
      setSelectedChips([]);
    }
    // answers 의도적 제외 (단계 진입 시 1회만)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, questions, isReanalyze]);

  const fetchNickname = async () => {
    try {
      const u = await api.get<{ nickname?: string; realName?: string }>("/api/v1/auth/me");
      setNickname((u.nickname || u.realName || "").trim());
    } catch {
      // 이름 없이도 인사는 자연스럽게 동작
    }
  };

  const fetchQuestions = async () => {
    try {
      // 신규 온보딩(재진행 아님) + 앞 단계 정보가 있으면 적응형 맞춤 질문 우선, 실패 시 정적 폴백.
      let data: { questions: InterviewQuestion[] };
      if (profileContext && !isReanalyze) {
        try {
          data = await api.post<{ questions: InterviewQuestion[] }>("/api/v1/ai-interview/adaptive", profileContext);
          if (!data?.questions?.length) throw new Error("empty adaptive questions");
        } catch {
          data = await api.get<{ questions: InterviewQuestion[] }>("/api/v1/ai-interview/questions");
        }
      } else {
        data = await api.get<{ questions: InterviewQuestion[] }>("/api/v1/ai-interview/questions");
      }
      setQuestions(data.questions);
      setIsLoading(false);
    } catch {
      toast.error("질문을 불러오는데 실패했어요");
      setIsLoading(false);
    }
  };

  const me = nickname || "당신";
  const greeting = isReanalyze
    ? `안녕하세요, 저는 ${MASCOT_NAME}예요 🎨\n\n${nickname ? nickname + "님의 " : ""}소개글과 색을 새로 만들어 드릴게요. 이전 답변을 미리 채워뒀으니, 바꾸고 싶은 부분만 골라주세요.\n\n시작해볼까요?`
    : `안녕하세요, 저는 팔레트의 ${MASCOT_NAME}예요 🎨\n\n${nickname ? nickname + "님께서 " : ""}방금 알려주신 라이프스타일과 이상형, 잘 봤어요! 지금부터 짧은 대화로 ${me}의 성향을 좀 더 깊이 들여다보고, 어울리는 '색'과 잘 맞을 분까지 찾아드릴게요.\n\n자, 준비되셨나요?`;

  const total = questions.length;
  const currentQuestion = questions[currentStep];

  const handleSubmitAnswer = (overrideAnswer?: string) => {
    if (isAnalyzing) return;
    const question = questions[currentStep];
    const answer =
      overrideAnswer !== undefined
        ? overrideAnswer
        : question.inputType === "chips"
          ? selectedChips.join(", ")
          : currentInput.trim();

    if (!answer) {
      toast.error("답변을 입력해주세요");
      return;
    }

    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);
    setCurrentInput("");
    setSelectedChips([]);

    if (currentStep + 1 < total) {
      setCurrentStep(currentStep + 1);   // 말풍선이 다음 질문으로 바뀜
    } else {
      finish(newAnswers);
    }
  };

  const finish = (ans: Record<string, string>) => {
    setIsAnalyzing(true);
    setTimeout(() => onComplete(ans), 1500);
  };

  const handlePrev = () => {
    if (currentStep === 0 || isAnalyzing) return;
    const prevStep = currentStep - 1;
    setCurrentStep(prevStep);
    const prevQ = questions[prevStep];
    const prevAns = answers[prevQ.id] ?? "";
    if (prevQ.inputType === "chips") {
      setCurrentInput("");
      setSelectedChips(prevAns ? prevAns.split(",").map(s => s.trim()).filter(Boolean) : []);
    } else {
      setCurrentInput(prevAns);
      setSelectedChips([]);
    }
  };

  const toggleChip = (chip: string) =>
    setSelectedChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-10 h-10 text-primary animate-pulse mx-auto mb-3" />
          <p className="text-muted-foreground">{MASCOT_NAME}가 준비하고 있어요...</p>
        </div>
      </div>
    );
  }

  // 말풍선에 담길 내용 — 인사 / 질문 / 분석 단계
  const bubbleText = !started
    ? greeting
    : isAnalyzing
      ? `좋아요, 다 모았어요! 🎨\n\n지금부터 ${nickname ? nickname + "님" : "당신"}만의 색과 어울리는 분을 찾아볼게요.`
      : currentQuestion?.question ?? "";
  const bubbleKey = !started ? "intro" : isAnalyzing ? "analyzing" : `q-${currentStep}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`
        @keyframes bubblePop { 0% { opacity: 0; transform: translateY(8px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes mascotFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      {/* Header */}
      <div className="bg-card/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground text-sm">← 뒤로</button>
        <div className="flex-1 text-center">
          <span className="font-semibold text-foreground">AI 인터뷰</span>
        </div>
        {started && total > 0 && !isAnalyzing && (
          <span className="text-xs text-muted-foreground">{Math.min(currentStep + 1, total)}/{total}</span>
        )}
        {(!started || isAnalyzing) && <span className="w-8" />}
      </div>

      {/* Progress */}
      {started && total > 0 && (
        <div className="h-1 bg-muted">
          <div
            className="h-1 bg-primary transition-all duration-500"
            style={{ width: `${(isAnalyzing ? total : currentStep) / total * 100}%` }}
          />
        </div>
      )}

      {/* 캐릭터 + 말풍선 (가운데) */}
      <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center justify-center gap-6">
        {/* 말풍선 — 내용이 바뀔 때마다 pop */}
        <div
          key={bubbleKey}
          style={{ animation: "bubblePop 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
          className="relative max-w-md w-full bg-card border border-border shadow-sm rounded-2xl px-5 py-4"
        >
          {started && !isAnalyzing && currentQuestion && (
            <p className="text-xs text-primary font-medium mb-1">질문 {currentStep + 1}</p>
          )}
          <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-line">{bubbleText}</p>
          {started && !isAnalyzing && currentQuestion?.hint && currentQuestion.inputType === "text" && (
            <p className="text-xs text-muted-foreground mt-2">💡 {currentQuestion.hint}</p>
          )}
          {/* 말풍선 꼬리 (아래 캐릭터를 향함) */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-4 h-4 bg-card border-r border-b border-border rotate-45" />
        </div>

        {/* 마스코트 — 코랄 여우 '팔리' (전신 일러스트, 원형 크롭 없이) */}
        <div className="flex flex-col items-center gap-1">
          <img
            src="/pali.png"
            alt={MASCOT_NAME}
            className="w-32 h-32 object-contain drop-shadow-sm select-none"
            draggable={false}
            style={{ animation: isAnalyzing ? "mascotFloat 1s ease-in-out infinite" : "mascotFloat 3s ease-in-out infinite" }}
          />
          <span className="text-xs text-muted-foreground">{MASCOT_NAME}</span>
          {isAnalyzing && (
            <div className="flex gap-1 mt-1">
              <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      </div>

      {/* 입력 영역 */}
      {!isAnalyzing && (
        <div className="bg-card border-t border-border px-4 py-4 space-y-3">
          {/* 인사 단계 → 시작 버튼 */}
          {!started ? (
            <Button onClick={() => setStarted(true)} className="w-full h-12 bg-brand-soft text-brand-strong">
              네, 시작할게요!
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : currentQuestion && (
            <>
              {currentQuestion.inputType === "chips" && currentQuestion.chips && (
                <div className="flex flex-wrap gap-2 mb-1">
                  {currentQuestion.chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => toggleChip(chip)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        selectedChips.includes(chip)
                          ? "bg-brand-soft text-brand-strong shadow"
                          : "bg-muted text-foreground hover:bg-accent"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.inputType === "text" && (
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => {
                    // 한글 IME 조합 중 Enter 가드
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  placeholder={currentQuestion.hint || "편하게 적어주세요"}
                  className="w-full border border-border bg-card rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  autoFocus
                />
              )}

              <Button
                onClick={() => handleSubmitAnswer()}
                disabled={
                  currentQuestion.inputType === "chips"
                    ? selectedChips.length === 0
                    : currentInput.trim().length === 0
                }
                className="w-full h-12 bg-brand-soft text-brand-strong"
              >
                {currentStep + 1 === total ? "완료하고 색 찾기" : "다음"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <div className="flex items-center gap-3 pt-1">
                {currentStep > 0 && (
                  <button onClick={handlePrev} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    ← 이전
                  </button>
                )}
                {currentQuestion.inputType === "text" && (
                  <button
                    onClick={() => handleSubmitAnswer("없어요")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    이 질문 건너뛰기
                  </button>
                )}
                {/* 최소 3개 답변 후 "여기까지만" */}
                {Object.keys(answers).length >= 3 && currentStep < total - 1 && (
                  <button
                    onClick={() => finish(answers)}
                    className="text-xs text-primary font-medium hover:underline ml-auto"
                  >
                    여기까지만 답변하기 →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
