import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Sparkles, Heart, Target, Smile, Lightbulb, ArrowLeft } from "lucide-react";
import { useOnboardingFields } from "../../lib/onboarding/useOnboardingFields";

interface AboutMeScreenProps {
  onNext: (data: any) => void;
  onBack?: () => void;
  initialData?: {
    introduction?: {
      text?: string;
      interviewAnswers?: {
        hobby?: string;
        charm?: string;
        passion?: string;
        happiness?: string;
        motto?: string;
      };
    };
  };
}

const interviewQuestions = [
  {
    id: "hobby",
    icon: Sparkles,
    iconColor: "text-blue-500",
    title: "쉬는 날엔 주로 이렇게 시간을 보내요",
    placeholder: "예) 주말엔 카페에서 책 읽거나, 친구들과 맛집 탐방하는 걸 좋아해요. 날씨 좋은 날엔 한강에서 자전거도 타요!",
    minLength: 10,
    maxLength: 200,
  },
  {
    id: "charm",
    icon: Heart,
    iconColor: "text-pink-500",
    title: "제 매력 포인트는 바로 이거!",
    placeholder: "예) 긍정적이고 밝은 성격이라 주변 사람들에게 에너지를 준다는 말을 자주 들어요. 그리고 공감 능력이 좋은 편이에요.",
    minLength: 10,
    maxLength: 200,
  },
  {
    id: "passion",
    icon: Target,
    iconColor: "text-purple-500",
    title: "요즘 제가 푹 빠져있는 것",
    placeholder: "예) 요즘 테니스를 배우고 있는데 너무 재밌어요! 주말마다 테니스장에 가서 연습하고 있어요.",
    minLength: 10,
    maxLength: 200,
  },
  {
    id: "happiness",
    icon: Smile,
    iconColor: "text-amber-500",
    title: "저는 이럴 때 행복해요",
    placeholder: "예) 좋아하는 사람들과 맛있는 음식 먹으면서 이야기할 때가 가장 행복해요. 소소한 일상의 순간들을 소중히 여기는 편이에요.",
    minLength: 10,
    maxLength: 200,
  },
  {
    id: "motto",
    icon: Lightbulb,
    iconColor: "text-green-500",
    title: "제 인생의 좌우명은",
    placeholder: "예) '오늘 하루를 최선을 다해 살자'가 제 좌우명이에요. 후회 없는 하루를 보내기 위해 노력해요.",
    minLength: 10,
    maxLength: 200,
  },
];

export function AboutMeScreen({ onNext, onBack, initialData }: AboutMeScreenProps) {
  const fields = useOnboardingFields();         // ADR 0058 3b — 인터뷰 블록 라벨·힌트·최소답변 메타
  const [answers, setAnswers] = useState({
    hobby: initialData?.introduction?.interviewAnswers?.hobby || "",
    charm: initialData?.introduction?.interviewAnswers?.charm || "",
    passion: initialData?.introduction?.interviewAnswers?.passion || "",
    happiness: initialData?.introduction?.interviewAnswers?.happiness || "",
    motto: initialData?.introduction?.interviewAnswers?.motto || "",
  });

  const updateAnswer = (id: string, value: string) => {
    setAnswers({ ...answers, [id]: value });
  };

  const minAnswers = Number((fields.config("interview")?.minAnswers as number) ?? 3);
  const filledAnswers = Object.values(answers).filter(v => v.length >= 10);
  const isValid = filledAnswers.length >= minAnswers;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <div className="bg-card border-b border-border px-6 py-4 space-y-3">
        <div className="relative">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-center">자기소개 작성</h2>
        </div>
        <div className="space-y-2">
          <Progress value={40} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">2/5 단계 · 내 이야기를 들려주세요</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Interview Questions Section */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{fields.label("interview", "인터뷰로 나를 소개해요")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {fields.hint("interview", `${minAnswers}가지 질문에 답해주세요. 더 많이 채울수록 매력적인 프로필이 완성돼요.`)}
          </p>
        </div>

        {/* Interview Questions */}
        {interviewQuestions.map((question) => {
          const Icon = question.icon;
          const answerLength = answers[question.id as keyof typeof answers]?.length || 0;
          const isAnswerValid = answerLength >= question.minLength;

          return (
            <div key={question.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${question.iconColor}`} />
                <Label className="text-base font-medium">{question.title}</Label>
              </div>
              <Textarea
                placeholder={question.placeholder}
                value={answers[question.id as keyof typeof answers]}
                onChange={(e) => updateAnswer(question.id, e.target.value)}
                className="min-h-[100px] bg-card border-border resize-none text-sm"
                maxLength={question.maxLength}
              />
              <div className="flex justify-between items-center">
                <p
                  className={`text-xs ${
                    isAnswerValid ? "text-green-600" : "text-rose-600"
                  }`}
                >
                  {answerLength}/{question.maxLength}자{" "}
                  {!isAnswerValid && `(최소 ${question.minLength - answerLength}자 더 필요)`}
                </p>
              </div>
            </div>
          );
        })}

        {/* Next Button */}
        <Button
          onClick={() =>
            onNext({
              introduction: {
                interviewAnswers: answers,
              },
            })
          }
          disabled={!isValid}
          className="w-full h-14 bg-brand-soft text-gold-strong disabled:opacity-50"
        >
          다음 - 라이프스타일
        </Button>

        {!isValid && (
          <p className="text-sm text-center text-rose-600">
            인터뷰 질문 {minAnswers}가지 이상 답변해주세요
          </p>
        )}
      </div>
    </div>
  );
}
