import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { ArrowLeft } from "lucide-react";
import { useOnboardingOptions } from "../../lib/onboarding/useOnboardingOptions";
import { useOnboardingFields } from "../../lib/onboarding/useOnboardingFields";

interface LifestyleScreenProps {
  onNext: (data: {
    lifestyleInfo: { smoking: string; drinking: string; religion: string };
    introduction: { interests: string[] };
  }) => void;
  onBack?: () => void;
  initialData?: {
    lifestyleInfo?: { smoking?: string; drinking?: string; religion?: string };
    introduction?: { interests?: string[] };
  };
}

/**
 * 라이프스타일·관심사 수집 (흡연/음주/종교/관심사).
 * AI 인터뷰·직접 작성 두 경로 공통 단계 — 이전엔 직접 작성(AboutMe) 경로만 수집해
 * 인터뷰 경로 유저의 흡연/음주 등이 비던 갭을 해소 (온보딩 플로우 UX B).
 * 칩은 ADR 0057 useOnboardingOptions, 라벨·노출·필수는 ADR 0058 useOnboardingFields.
 */
export function LifestyleScreen({ onNext, onBack, initialData }: LifestyleScreenProps) {
  const { options } = useOnboardingOptions();
  const fields = useOnboardingFields();

  const [smoking, setSmoking] = useState(initialData?.lifestyleInfo?.smoking || "");
  const [drinking, setDrinking] = useState(initialData?.lifestyleInfo?.drinking || "");
  const [religion, setReligion] = useState(initialData?.lifestyleInfo?.religion || "");
  const [interests, setInterests] = useState<string[]>(initialData?.introduction?.interests || []);

  const smokingVisible = fields.visible("smoking");
  const drinkingVisible = fields.visible("drinking");
  const religionVisible = fields.visible("religion");
  const interestsVisible = fields.visible("interests");
  const smokingRequired = fields.required("smoking", true);
  const drinkingRequired = fields.required("drinking", true);
  const religionRequired = fields.required("religion", false);
  const interestsMax = Number((fields.config("interests")?.maxSelect as number) ?? 8);

  const isValid =
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
          <h2 className="text-center">라이프스타일</h2>
        </div>
        <div className="space-y-2">
          <Progress value={70} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">잠깐이면 돼요 · 약 1분</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div className="space-y-5">
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

        {/* 관심사 */}
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
              lifestyleInfo: { smoking, drinking, religion },
              introduction: { interests },
            })
          }
          disabled={!isValid}
          className="w-full h-14 bg-brand-soft text-gold-strong disabled:opacity-50"
        >
          다음 - 이상형 설정
        </Button>

        {!isValid && (
          <p className="text-sm text-center text-rose-600">
            흡연/음주를 선택해주세요
          </p>
        )}
      </div>
    </div>
  );
}
