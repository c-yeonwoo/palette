import { Button } from "./ui/button";
import { Sparkles, PenLine, Clock, MessageSquare } from "lucide-react";

interface IntroMethodSelectionScreenProps {
  onSelectAIInterview: () => void;
  onSelectManual: () => void;
  onBack: () => void;
}

export function IntroMethodSelectionScreen({
  onSelectAIInterview,
  onSelectManual,
  onBack,
}: IntroMethodSelectionScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-card border-b border-border px-6 py-4">
        <button onClick={onBack} className="text-muted-foreground text-sm mb-1">← 이전</button>
        <h2 className="text-center">자기소개 방식 선택</h2>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 gap-5 py-10">
        <div className="text-center mb-2">
          <p className="text-muted-foreground text-sm">
            나를 소개하는 방식을 선택해주세요.
            <br />
            어떤 방식이든 마지막에 AI가 소개글을 완성해드려요.
          </p>
        </div>

        {/* AI 인터뷰 */}
        <button
          onClick={onSelectAIInterview}
          className="w-full text-left p-6 rounded-2xl border-2 border-primary/30 bg-secondary hover:border-primary hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">AI 인터뷰로 빠르게 작성</h3>
                <span className="text-xs bg-brand-soft text-primary px-2 py-0.5 rounded-full font-medium">추천</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI와 채팅하듯 10개 질문에 답하면 끝이에요. 어렵지 않게 나를 표현할 수 있어요.
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                <Clock className="w-3 h-3" />
                <span>약 5분 소요</span>
              </div>
            </div>
          </div>
        </button>

        {/* 직접 작성 */}
        <button
          onClick={onSelectManual}
          className="w-full text-left p-6 rounded-2xl border-2 border-border bg-card hover:border-foreground/30 hover:shadow-md transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <PenLine className="w-6 h-6 text-foreground/60" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">내 소개 직접 작성하기</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                5가지 질문에 내 말로 자유롭게 작성해요. 내 개성을 더 세세하게 표현하고 싶을 때 좋아요.
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                <span>약 10분 소요</span>
              </div>
            </div>
          </div>
        </button>

        <p className="text-center text-xs text-muted-foreground mt-2">
          어떤 방식을 선택해도 마지막에 AI가 소개글을 완성하고 색깔 타입을 찾아드려요
        </p>
      </div>
    </div>
  );
}
