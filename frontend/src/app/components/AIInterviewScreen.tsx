import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { ChevronRight, Sparkles, MessageCircle } from "lucide-react";
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

type MessageType = "ai" | "user";
interface ChatMessage {
  type: MessageType;
  content: string;
  questionId?: string;
}

export function AIInterviewScreen({ onComplete, onBack, initialAnswers, profileContext }: AIInterviewScreenProps) {
  const isReanalyze = !!initialAnswers && Object.values(initialAnswers).some(v => !!v);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [currentInput, setCurrentInput] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 재진행 모드: 단계 진입 시 이전(최신) 답변을 입력창에 미리 채워서 수정 편의 제공.
  // answers 는 initialAnswers 로 초기화되고 제출 시 갱신되므로, 뒤로 가서 다시 봐도 최신 값이 보인다.
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
    // answers 는 의도적으로 deps 제외 (단계 진입 시 1회만; 입력 중 재실행 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, questions, isReanalyze]);

  /** 이전 질문으로 돌아가 답변 수정. 마지막 user 답변 + 현재 AI 질문 말풍선을 걷어내고 단계 -1. */
  const handlePrev = () => {
    if (currentStep === 0 || isAnalyzing) return;
    const prevStep = currentStep - 1;
    const prevQ = questions[prevStep];
    setMessages((prev) => {
      const copy = [...prev];
      copy.pop();   // 현재 질문 AI 말풍선
      copy.pop();   // 직전 답변 user 말풍선
      return copy;
    });
    setCurrentStep(prevStep);
    const prevAns = answers[prevQ.id] ?? "";
    if (prevQ.inputType === "chips") {
      setCurrentInput("");
      setSelectedChips(prevAns ? prevAns.split(",").map(s => s.trim()).filter(Boolean) : []);
    } else {
      setCurrentInput(prevAns);
      setSelectedChips([]);
    }
  };

  const fetchQuestions = async () => {
    try {
      // 신규 온보딩(재진행 아님) + 앞 단계 정보가 있으면 적응형 맞춤 질문 우선, 실패 시 정적 폴백.
      // 재진행 모드는 이전 답변 prefill 이 정적 질문 id 에 매핑돼야 하므로 항상 정적.
      let data: { questions: InterviewQuestion[] };
      if (profileContext && !isReanalyze) {
        try {
          data = await api.post<{ questions: InterviewQuestion[] }>(
            "/api/v1/ai-interview/adaptive",
            profileContext,
          );
          if (!data?.questions?.length) throw new Error("empty adaptive questions");
        } catch {
          data = await api.get<{ questions: InterviewQuestion[] }>("/api/v1/ai-interview/questions");
        }
      } else {
        data = await api.get<{ questions: InterviewQuestion[] }>("/api/v1/ai-interview/questions");
      }
      setQuestions(data.questions);
      // Show intro + first question
      const intro = isReanalyze
        ? "다시 분석을 시작할게요. 이전 답변을 미리 채워뒀으니, 바꾸고 싶은 부분만 새로 적어주세요. 그대로 두고 싶으면 다음으로 넘어가도 돼요."
        : `방금 알려주신 라이프스타일과 이상형, 잘 봤어요 🙂\n\n이제 마지막으로 짧은 대화를 나누면서 당신만의 색을 찾아볼게요. 앞서 답해주신 내용을 바탕으로 ${data.questions.length}가지만 더 여쭤볼게요.\n\n편하게 대화하듯 답해주세요!`;
      setMessages([
        { type: "ai", content: intro },
        {
          type: "ai",
          content: data.questions[0].question,
          questionId: data.questions[0].id,
        },
      ]);
      setIsLoading(false);
    } catch {
      toast.error("질문을 불러오는데 실패했어요");
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async (overrideAnswer?: string) => {
    if (isAnalyzing) return;
    const question = questions[currentStep];
    // overrideAnswer 가 있으면(예: 건너뛰기 "없어요") state 비동기 갱신을 기다리지 않고 직접 제출
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

    setMessages((prev) => [
      ...prev,
      { type: "user", content: answer },
    ]);

    setCurrentInput("");
    setSelectedChips([]);

    const nextStep = currentStep + 1;

    if (nextStep < questions.length) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            content: questions[nextStep].question,
            questionId: questions[nextStep].id,
          },
        ]);
        setCurrentStep(nextStep);
      }, 600);
    } else {
      // All questions answered → pass answers forward
      setIsAnalyzing(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            content: "모든 답변이 완성됐어요!\n\n이제 마지막 단계에서 AI가 당신만의 소개글과 색깔 타입을 찾아드릴게요.",
          },
        ]);
        setTimeout(() => {
          onComplete(newAnswers);
        }, 1500);
      }, 600);
    }
  };

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const currentQuestion = questions[currentStep];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-10 h-10 text-primary animate-pulse mx-auto mb-3" />
          <p className="text-muted-foreground">AI 인터뷰 준비 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-muted-foreground text-sm">
          ← 뒤로
        </button>
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">AI 인터뷰</span>
          </div>
        </div>
        {questions.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {Math.min(currentStep + 1, questions.length)}/{questions.length}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {questions.length > 0 && (
        <div className="h-1 bg-muted">
          <div
            className="h-1 bg-primary transition-all duration-500"
            style={{ width: `${((currentStep) / questions.length) * 100}%` }}
          />
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} gap-2`}
          >
            {msg.type === "ai" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                msg.type === "ai"
                  ? "bg-card shadow-sm text-foreground rounded-tl-none"
                  : "bg-brand-soft text-brand-strong rounded-tr-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isAnalyzing && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-card shadow-sm rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      {!isAnalyzing && currentQuestion && (
        <div className="bg-card border-t border-border px-4 py-4 space-y-3">
          {currentQuestion.inputType === "chips" && currentQuestion.chips && (
            <div className="flex flex-wrap gap-2 mb-2">
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
            <div className="flex gap-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  // 한글 IME 조합 중 Enter 가드 — 조합 확정 Enter 가 제출을 트리거해
                  // 마지막 외자가 답변을 덮어쓰던 버그 방지. 조합이 끝난 뒤 Enter 만 제출.
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
                placeholder={currentQuestion.hint}
                className="flex-1 border border-border bg-card rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
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
            다음
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          <div className="flex items-center gap-3 pt-1">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← 이전 답변 수정
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
            {/* 최소 3개 답변 후부터 "여기까지만 답변하기" 노출 */}
            {Object.keys(answers).length >= 3 && currentStep < questions.length - 1 && (
              <button
                onClick={() => {
                  setIsAnalyzing(true);
                  setTimeout(() => {
                    setMessages((prev) => [
                      ...prev,
                      {
                        type: "ai",
                        content: `여기까지 답변 주신 ${Object.keys(answers).length}개로도 충분해요!\n\n이제 AI가 당신만의 소개글과 색깔 타입을 찾아드릴게요.`,
                      },
                    ]);
                    setTimeout(() => {
                      onComplete(answers);
                    }, 1500);
                  }, 400);
                }}
                className="text-xs text-primary font-medium hover:underline ml-auto"
              >
                여기까지만 답변하기 →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
