import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { ArrowLeft } from "lucide-react";
import { useOnboardingOptions } from "../../lib/onboarding/useOnboardingOptions";
import { useOnboardingFields } from "../../lib/onboarding/useOnboardingFields";
import { datingStyleOptionLabel } from "../../lib/datingStyleLabels";

// 연애 스타일 10문항 중 가입 시 받기 좋은 2종만 승격(공감도 높고 매칭 신호 큼).
// 라벨은 datingStyleLabels(SoT), 그룹핑(어떤 코드가 어느 질문)만 로컬.
const ONBOARDING_DATING_STYLE: { key: string; label: string; options: string[] }[] = [
  { key: "CONTACT_STYLE", label: "연락은 어느 정도가 좋아요?", options: ["FREQUENT", "DAILY_FEW", "WHENEVER"] },
  { key: "AFFECTION_STYLE", label: "애정 표현은 주로 어떻게?", options: ["PHYSICAL", "WORDS", "ACTIONS"] },
];

interface LifestyleScreenProps {
  onNext: (data: {
    lifestyleInfo: { smoking: string; drinking: string; religion: string };
    introduction: { interests: string[]; datingStyle: Record<string, string> };
  }) => void;
  onBack?: () => void;
  initialData?: {
    lifestyleInfo?: { smoking?: string; drinking?: string; religion?: string };
    introduction?: { interests?: string[]; datingStyle?: Record<string, string> };
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
  const [datingStyle, setDatingStyle] = useState<Record<string, string>>(initialData?.introduction?.datingStyle || {});

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
          <Progress value={60} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">3/5 단계 · 잠깐이면 돼요</p>
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
                      ? "bg-brand-soft text-brand-strong border-brand/40"
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
                      ? "bg-brand-soft text-brand-strong border-brand/40"
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
                      ? "bg-brand-soft text-brand-strong border-brand/40"
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
                      ? "bg-brand-soft text-brand-strong border-brand/40"
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

        {/* 연애 스타일 (선택) — 매칭 신호 보강 */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5 space-y-4">
          <div>
            <h3 className="text-foreground font-semibold">연애 스타일</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              선택이에요 · 더 잘 맞는 인연을 찾는 데 쓰여요
            </p>
          </div>
          {ONBOARDING_DATING_STYLE.map((q) => (
            <div key={q.key}>
              <Label className="mb-2 block text-sm">{q.label}</Label>
              <div className="grid grid-cols-3 gap-2">
                {q.options.map((optCode) => (
                  <button
                    key={optCode}
                    type="button"
                    onClick={() =>
                      setDatingStyle((prev) =>
                        prev[q.key] === optCode
                          ? (() => { const { [q.key]: _, ...rest } = prev; return rest; })()
                          : { ...prev, [q.key]: optCode },
                      )
                    }
                    className={`py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      datingStyle[q.key] === optCode
                        ? "bg-brand-soft text-brand-strong border-brand/40"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {datingStyleOptionLabel(optCode)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Next Button */}
        <Button
          onClick={() =>
            onNext({
              lifestyleInfo: { smoking, drinking, religion },
              introduction: { interests, datingStyle },
            })
          }
          disabled={!isValid}
          className="w-full h-14 bg-brand-soft text-brand-strong disabled:opacity-50"
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
