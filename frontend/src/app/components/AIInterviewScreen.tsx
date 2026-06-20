import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronRight } from "lucide-react";
import { Sparkles } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
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
  /** 신규 온보딩에서 앞 단계(라이프스타일·이상형·MBTI)를 바탕으로 맞춤 질문 생성 (ADR 0068). */
  profileContext?: AdaptiveInterviewContext | null;
}

/** 인터뷰를 진행하는 팔레트 마스코트 — 결정사 상담사처럼 1:1로 다정하게 물어본다 (ADR 0068 후속). */
const MASCOT_NAME = "팔리";

export function AIInterviewScreen({ onComplete, onBack, initialAnswers, profileContext }: AIInterviewScreenProps) {
  const isReanalyze = !!initialAnswers && Object.values(initialAnswers).some(v => !!v);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [currentInput, setCurrentInput] = useState("");   // text 질문의 답변 / chips 질문의 '추가 한마디'
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [started, setStarted] = useState(false);          // 인사 → 질문 단계
  const [nickname, setNickname] = useState("");
  const [showFinishWarn, setShowFinishWarn] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchNickname();
  }, []);

  // 재진행 모드: 단계 진입 시 이전 답변을 입력에 미리 채움. (chips 답변은 "칩\n추가" 형태로 저장)
  useEffect(() => {
    if (!isReanalyze) return;
    const q = questions[currentStep];
    const prev = q ? (answers[q.id] ?? "") : "";
    if (q?.inputType === "chips") {
      const [chipLine, ...rest] = prev.split("\n");
      setSelectedChips(chipLine ? chipLine.split(",").map(s => s.trim()).filter(Boolean) : []);
      setCurrentInput(rest.join("\n"));
    } else {
      setSelectedChips([]);
      setCurrentInput(prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, questions, isReanalyze]);

  const fetchNickname = async () => {
    try {
      const u = await api.get<{ nickname?: string; realName?: string }>("/api/v1/auth/me");
      setNickname((u.nickname || u.realName || "").trim());
    } catch { /* 이름 없이도 자연스럽게 동작 */ }
  };

  const fetchQuestions = async () => {
    try {
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
    ? `${nickname ? nickname + "님, " : ""}다시 만나서 반가워요 🙂\n\n소개글과 색을 새로 만들어 드릴게요. 이전에 해주신 답변을 미리 채워뒀으니, 마음이 바뀐 부분만 살짝 고쳐주시면 돼요.\n\n천천히 시작해볼까요?`
    : `안녕하세요, 저는 팔레트의 ${MASCOT_NAME}예요 🎨\n\n${nickname ? nickname + "님께서 " : ""}방금 알려주신 라이프스타일과 이상형, 잘 봤어요! 이제 제가 옆에서 몇 가지만 더 여쭤볼게요. 그 얘기들로 ${me}의 결을 읽어서 어울리는 '색'과 잘 맞을 분까지 찾아드릴 거예요.\n\n편하게 수다 떤다 생각하고 답해주세요. 시작해볼까요?`;

  const total = questions.length;
  const currentQuestion = questions[currentStep];

  const handleSubmitAnswer = (overrideAnswer?: string) => {
    if (isAnalyzing) return;
    const question = questions[currentStep];
    let answer: string;
    if (overrideAnswer !== undefined) {
      answer = overrideAnswer;
    } else if (question.inputType === "chips") {
      const chipsPart = selectedChips.join(", ");
      const extra = currentInput.trim();
      answer = [chipsPart, extra].filter(Boolean).join("\n");   // 칩 + 추가 한마디
    } else {
      answer = currentInput.trim();
    }

    if (!answer) {
      toast.error("답변을 입력하거나 선택해주세요");
      return;
    }

    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);
    setCurrentInput("");
    setSelectedChips([]);

    if (currentStep + 1 < total) {
      setCurrentStep(currentStep + 1);
    } else {
      finish(newAnswers);
    }
  };

  const finish = (ans: Record<string, string>) => {
    setShowFinishWarn(false);
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
      const [chipLine, ...rest] = prevAns.split("\n");
      setSelectedChips(chipLine ? chipLine.split(",").map(s => s.trim()).filter(Boolean) : []);
      setCurrentInput(rest.join("\n"));
    } else {
      setSelectedChips([]);
      setCurrentInput(prevAns);
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

  const bubbleText = !started
    ? greeting
    : isAnalyzing
      ? `좋아요, 잘 들었어요 🎨\n\n지금부터 ${nickname ? nickname + "님" : "당신"}만의 색과 어울리는 분을 찾아볼게요. 잠깐만요!`
      : currentQuestion?.question ?? "";
  const bubbleKey = !started ? "intro" : isAnalyzing ? "analyzing" : `q-${currentStep}`;
  const canSubmit = currentQuestion?.inputType === "chips"
    ? (selectedChips.length > 0 || currentInput.trim().length > 0)
    : currentInput.trim().length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`
        @keyframes bubblePop { 0% { opacity: 0; transform: translateY(8px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes mascotFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>

      {/* Header */}
      <div className="bg-card/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground text-sm">← 뒤로</button>
        <div className="flex-1 text-center"><span className="font-semibold text-foreground">AI 인터뷰</span></div>
        {started && total > 0 && !isAnalyzing
          ? <span className="text-xs text-muted-foreground">{Math.min(currentStep + 1, total)}/{total}</span>
          : <span className="w-8" />}
      </div>

      {/* Progress */}
      {started && total > 0 && (
        <div className="h-1 bg-muted">
          <div className="h-1 bg-primary transition-all duration-500" style={{ width: `${(isAnalyzing ? total : currentStep) / total * 100}%` }} />
        </div>
      )}

      {/* 팔리가 1:1로 물어보는 채팅 영역 (가운데가 아니라 위에서부터) */}
      <div className="flex-1 overflow-y-auto px-5 pt-7 pb-4">
        <div className="flex items-start gap-3 max-w-xl mx-auto">
          {/* 마스코트 — 왼쪽 */}
          <div className="flex flex-col items-center shrink-0 w-16">
            <img
              src="/pali.png"
              alt={MASCOT_NAME}
              className="w-16 h-16 object-contain select-none"
              draggable={false}
              style={{ animation: isAnalyzing ? "mascotFloat 1s ease-in-out infinite" : "mascotFloat 3.5s ease-in-out infinite" }}
            />
            <span className="text-[11px] text-muted-foreground mt-0.5">{MASCOT_NAME}</span>
          </div>

          {/* 말풍선 — 왼쪽 정렬, 단계마다 내용이 바뀜 */}
          <div
            key={bubbleKey}
            style={{ animation: "bubblePop 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
            className="relative flex-1 bg-card border border-border shadow-sm rounded-2xl rounded-tl-md px-4 py-3 mt-1"
          >
            <div className="absolute -left-2 top-4 w-3.5 h-3.5 bg-card border-l border-b border-border rotate-45" />
            {started && !isAnalyzing && currentQuestion && (
              <p className="text-xs text-primary font-medium mb-1">질문 {currentStep + 1}</p>
            )}
            <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-line">{bubbleText}</p>
            {started && !isAnalyzing && currentQuestion?.hint && currentQuestion.inputType === "text" && (
              <p className="text-xs text-muted-foreground mt-2">💡 {currentQuestion.hint}</p>
            )}
            {isAnalyzing && (
              <div className="flex gap-1 mt-2">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 입력 영역 */}
      {!isAnalyzing && (
        <div className="bg-card border-t border-border px-4 py-4">
          {!started ? (
            <Button onClick={() => setStarted(true)} className="w-full h-12 bg-brand-soft text-brand-strong">
              네, 시작할게요!
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : currentQuestion && (
            <div className="max-w-xl mx-auto">
              {/* 답변 입력 묶음 */}
              <div className="space-y-2.5">
                {currentQuestion.inputType === "chips" && currentQuestion.chips && (
                  <>
                    <div className="flex flex-wrap gap-2">
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
                    {/* 추가 주관식 — 칩으로 못다한 얘기 */}
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); handleSubmitAnswer(); } }}
                      placeholder="더 하고 싶은 얘기가 있다면 적어주세요 (선택)"
                      className="w-full border border-border bg-card rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </>
                )}

                {currentQuestion.inputType === "text" && (
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); handleSubmitAnswer(); } }}
                    placeholder={currentQuestion.hint || "편하게 적어주세요"}
                    className="w-full border border-border bg-card rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    autoFocus
                  />
                )}
              </div>

              {/* 칩/입력과 버튼 사이 간격 더 */}
              <Button
                onClick={() => handleSubmitAnswer()}
                disabled={!canSubmit}
                className="w-full h-12 bg-brand-soft text-brand-strong mt-5"
              >
                {currentStep + 1 === total ? "완료하고 색 찾기" : "다음"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <div className="flex items-center gap-3 pt-2">
                {currentStep > 0 && (
                  <button onClick={handlePrev} className="text-xs text-muted-foreground hover:text-foreground transition-colors">← 이전</button>
                )}
                {currentQuestion.inputType === "text" && (
                  <button onClick={() => handleSubmitAnswer("없어요")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                    이 질문 건너뛰기
                  </button>
                )}
                {Object.keys(answers).length >= 3 && currentStep < total - 1 && (
                  <button onClick={() => setShowFinishWarn(true)} className="text-xs text-primary font-medium hover:underline ml-auto">
                    여기까지만 답변하기 →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* "여기까지만" 경고 */}
      <AlertDialog open={showFinishWarn} onOpenChange={setShowFinishWarn}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>여기서 마칠까요?</AlertDialogTitle>
            <AlertDialogDescription>
              답변이 적으면 {nickname ? nickname + "님의 " : ""}성향을 정확히 파악하기 어려워요.
              그러면 어울리는 색과 소개글의 정확도가 떨어질 수 있어요. 그래도 마치시겠어요?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>조금 더 답변할게요</AlertDialogCancel>
            <AlertDialogAction onClick={() => finish(answers)}>그래도 마칠게요</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
