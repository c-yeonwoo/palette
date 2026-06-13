import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Sparkles, Heart, Target, Smile, Lightbulb, ArrowLeft } from "lucide-react";
import { useOnboardingOptions } from "../../lib/onboarding/useOnboardingOptions";
import { useOnboardingFields } from "../../lib/onboarding/useOnboardingFields";

interface AboutMeScreenProps {
  onNext: (data: any) => void;
  onBack?: () => void;
  initialData?: {
    introduction?: {
      text?: string;
      interests?: string[];
      interviewAnswers?: {
        hobby?: string;
        charm?: string;
        passion?: string;
        happiness?: string;
        motto?: string;
      };
    };
    basicInfo?: {
      mbti?: string;
    };
    lifestyleInfo?: {
      smoking?: string;
      drinking?: string;
      religion?: string;
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
  const { options } = useOnboardingOptions();   // ADR 0057 — 어드민 관리 칩
  const fields = useOnboardingFields();         // ADR 0058 3b — 라벨·힌트·노출·필수 메타
  const [answers, setAnswers] = useState({
    hobby: initialData?.introduction?.interviewAnswers?.hobby || "",
    charm: initialData?.introduction?.interviewAnswers?.charm || "",
    passion: initialData?.introduction?.interviewAnswers?.passion || "",
    happiness: initialData?.introduction?.interviewAnswers?.happiness || "",
    motto: initialData?.introduction?.interviewAnswers?.motto || "",
  });

  const [smoking, setSmoking] = useState(initialData?.lifestyleInfo?.smoking || "");
  const [drinking, setDrinking] = useState(initialData?.lifestyleInfo?.drinking || "");
  const [religion, setReligion] = useState(initialData?.lifestyleInfo?.religion || "");
  // DA-003 — 관심사 온보딩 수집 (가입 후 ProfileEdit 가야만 입력 가능했던 갭 해소)
  const [interests, setInterests] = useState<string[]>(
    initialData?.introduction?.interests || [],
  );

  const updateAnswer = (id: string, value: string) => {
    setAnswers({ ...answers, [id]: value });
  };

  // ADR 0058 3b — 어드민 메타로 노출/필수/최소답변 구동 (미로딩 시 현행 동작 폴백)
  const interviewVisible = fields.visible("interview");
  const interviewRequired = fields.required("interview", true);
  const minAnswers = Number((fields.config("interview")?.minAnswers as number) ?? 3);
  const smokingVisible = fields.visible("smoking");
  const drinkingVisible = fields.visible("drinking");
  const religionVisible = fields.visible("religion");
  const interestsVisible = fields.visible("interests");
  const smokingRequired = fields.required("smoking", true);
  const drinkingRequired = fields.required("drinking", true);
  const religionRequired = fields.required("religion", false);
  const interestsMax = Number((fields.config("interests")?.maxSelect as number) ?? 8);

  const filledAnswers = Object.values(answers).filter(v => v.length >= 10);
  const isValid =
    (!interviewVisible || !interviewRequired || filledAnswers.length >= minAnswers) &&
    (!smokingVisible || !smokingRequired || !!smoking) &&
    (!drinkingVisible || !drinkingRequired || !!drinking) &&
    (!religionVisible || !religionRequired || !!religion);

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
          <Progress value={60} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">3/5 단계 - 약 5분 소요</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Interview Questions Section */}
        {interviewVisible && (
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{fields.label("interview", "인터뷰로 나를 소개해요")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {fields.hint("interview", `${minAnswers}가지 질문에 답해주세요. 더 많이 채울수록 매력적인 프로필이 완성돼요.`)}
          </p>
        </div>
        )}

        {/* Interview Questions */}
        {interviewVisible && interviewQuestions.map((question) => {
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

        {/* Lifestyle Section */}
        <div className="space-y-5 pt-6 border-t border-border">
          <h3 className="text-foreground font-semibold">라이프스타일</h3>

          {/* Smoking */}
          {smokingVisible && (
          <div>
            <Label className="mb-2 block text-sm">{fields.label("smoking", "흡연")}{smokingRequired && " *"}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(options.smoking ?? []).map((option) => (
                <button
                  key={option.code}
                  onClick={() => setSmoking(option.code)}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    smoking === option.code
                      ? "bg-brand-soft text-gold-strong border-brand/40"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Drinking */}
          {drinkingVisible && (
          <div>
            <Label className="mb-2 block text-sm">{fields.label("drinking", "음주")}{drinkingRequired && " *"}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(options.drinking ?? []).map((option) => (
                <button
                  key={option.code}
                  onClick={() => setDrinking(option.code)}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    drinking === option.code
                      ? "bg-brand-soft text-gold-strong border-brand/40"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Religion */}
          {religionVisible && (
          <div>
            <Label className="mb-2 block text-sm">{fields.label("religion", "종교")}{religionRequired ? " *" : " (선택)"}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(options.religion ?? []).map((option) => (
                <button
                  key={option.code}
                  onClick={() => setReligion(option.code)}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    religion === option.code
                      ? "bg-brand-soft text-gold-strong border-brand/40"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* DA-003 — 관심사 (온보딩 수집) */}
        {interestsVisible && (
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5 space-y-3">
          <div>
            <h3 className="text-foreground font-semibold">{fields.label("interests", "관심사 · 취미")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fields.hint("interests", `최대 ${interestsMax}개 · 가입 후 마이프로필에서 더 추가하거나 수정할 수 있어요`)}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(options.interest ?? []).map((item) => {
              const selected = interests.includes(item.code);
              const disabled = !selected && interests.length >= interestsMax;
              return (
                <button
                  key={item.code}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (selected) {
                      setInterests(interests.filter(i => i !== item.code));
                    } else if (interests.length < interestsMax) {
                      setInterests([...interests, item.code]);
                    }
                  }}
                  className={
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all " +
                    (selected
                      ? "bg-brand-soft text-gold-strong border-brand/40"
                      : disabled
                      ? "bg-card text-muted-foreground/40 border-border/40 cursor-not-allowed"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40")
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          {interests.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              선택: {interests.length}/{interestsMax}
            </p>
          )}
        </div>
        )}

        {/* Next Button */}
        <Button
          onClick={() =>
            onNext({
              introduction: {
                interviewAnswers: answers,
                interests,           // DA-003
              },
              lifestyleInfo: {
                smoking,
                drinking,
                religion,
              },
            })
          }
          disabled={!isValid}
          className="w-full h-14 bg-brand-soft text-gold-strong disabled:opacity-50"
        >
          다음 - 이상형 설정
        </Button>

        {!isValid && (
          <p className="text-sm text-center text-rose-600">
            인터뷰 질문 3가지 이상 답변하고 흡연/음주를 선택해주세요
          </p>
        )}
      </div>
    </div>
  );
}
