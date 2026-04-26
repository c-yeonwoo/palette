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

interface AIInterviewScreenProps {
  onComplete: (answers: Record<string, string>) => void;
  onBack: () => void;
}

type MessageType = "ai" | "user";
interface ChatMessage {
  type: MessageType;
  content: string;
  questionId?: string;
}

export function AIInterviewScreen({ onComplete, onBack }: AIInterviewScreenProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

  const fetchQuestions = async () => {
    try {
      const data = await api.get<{ questions: InterviewQuestion[] }>("/api/v1/ai-interview/questions");
      setQuestions(data.questions);
      // Show intro + first question
      setMessages([
        {
          type: "ai",
          content: "안녕하세요! 😊 저는 당신의 색깔을 찾아드릴 AI예요.\n\n편하게 대화하듯이 답변해주시면, 당신만의 멋진 프로필을 만들어드릴게요!\n\n10개의 질문이 있어요. 준비되셨나요?",
        },
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

  const handleSubmitAnswer = async () => {
    if (isAnalyzing) return;
    const question = questions[currentStep];
    const answer =
      question.inputType === "chips"
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
            content: "모든 답변이 완성됐어요! 🎉\n\n이제 마지막 단계에서 AI가 당신만의 소개글과 색깔 타입을 찾아드릴게요.",
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-10 h-10 text-pink-400 animate-pulse mx-auto mb-3" />
          <p className="text-slate-600">AI 인터뷰 준비 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur border-b border-pink-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 text-sm">
          ← 뒤로
        </button>
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span className="font-semibold text-slate-800">AI 인터뷰</span>
          </div>
        </div>
        {questions.length > 0 && (
          <span className="text-xs text-slate-400">
            {Math.min(currentStep + 1, questions.length)}/{questions.length}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {questions.length > 0 && (
        <div className="h-1 bg-pink-100">
          <div
            className="h-1 bg-gradient-to-r from-pink-400 to-purple-500 transition-all duration-500"
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                msg.type === "ai"
                  ? "bg-white shadow-sm text-slate-700 rounded-tl-none"
                  : "bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-tr-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isAnalyzing && (
          <div className="flex justify-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white shadow-sm rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-pink-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      {!isAnalyzing && currentQuestion && (
        <div className="bg-white border-t border-pink-100 px-4 py-4 space-y-3">
          {currentQuestion.inputType === "chips" && currentQuestion.chips && (
            <div className="flex flex-wrap gap-2 mb-2">
              {currentQuestion.chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedChips.includes(chip)
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                placeholder={currentQuestion.hint}
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400"
                autoFocus
              />
            </div>
          )}

          <Button
            onClick={handleSubmitAnswer}
            disabled={
              currentQuestion.inputType === "chips"
                ? selectedChips.length === 0
                : currentInput.trim().length === 0
            }
            className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-400 text-white"
          >
            {currentStep === questions.length - 1 ? "완성하기 ✨" : "다음"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          {currentQuestion.inputType === "text" && (
            <button
              onClick={() => {
                setCurrentInput("없어요");
                setTimeout(handleSubmitAnswer, 0);
              }}
              className="w-full text-center text-xs text-slate-400 py-1"
            >
              건너뛰기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
