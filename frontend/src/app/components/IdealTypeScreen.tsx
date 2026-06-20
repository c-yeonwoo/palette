import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { Heart, ChevronLeft } from "lucide-react";
import { useOnboardingOptions, DATE_PREF_DESC } from "../../lib/onboarding/useOnboardingOptions";
import { useOnboardingFields } from "../../lib/onboarding/useOnboardingFields";

// 기본 / 한계 범위
const AGE_BOUND = { min: 20, max: 60 } as const;
const HEIGHT_BOUND = { min: 140, max: 200 } as const;

interface IdealTypeScreenProps {
  onNext: (data: any) => void;
  onBack?: () => void;
  initialData?: {
    idealType?: any;
  };
  userGender?: string; // "MALE" or "FEMALE"
}

export function IdealTypeScreen({ onNext, onBack, initialData, userGender }: IdealTypeScreenProps) {
  const { options } = useOnboardingOptions();   // ADR 0057 — 어드민 관리 칩
  const fields = useOnboardingFields();         // ADR 0058 3b — 라벨·힌트·노출·필수 메타

  // 메타 기반 노출/필수/최대선택 (미로딩 시 현행 폴백)
  const ageVisible = fields.visible("ageRange");
  const heightVisible = fields.visible("heightRange");
  const datePrefVisible = fields.visible("datePreference");
  const importantVisible = fields.visible("importantValue");
  const personalityVisible = fields.visible("personality");
  const appearanceVisible = fields.visible("appearanceStyle");
  const dealBreakerVisible = fields.visible("dealBreaker");
  const datePrefRequired = fields.required("datePreference", true);
  const importantRequired = fields.required("importantValue", true);
  const personalityRequired = fields.required("personality", true);
  const importantMax = Number((fields.config("importantValue")?.maxSelect as number) ?? 3);
  const personalityMax = Number((fields.config("personality")?.maxSelect as number) ?? 5);
  const dealBreakerMax = Number((fields.config("dealBreaker")?.maxSelect as number) ?? 3);

  const personalities = options.personality ?? [];
  const datePreferences = options.datePreference ?? [];
  const importantValues = options.importantValue ?? [];
  const dealBreakerOptions = options.dealBreaker ?? [];
  // 사용자 성별에 따라 상대 성별의 외모 스타일만 노출
  const targetGender = userGender === "MALE" ? "FEMALE" : "MALE";
  const appearanceStyles = (options.appearanceStyle ?? []).filter(
    (o) => !o.gender || o.gender === targetGender,
  );

  const [selectedDatePreferences, setSelectedDatePreferences] = useState<string[]>(
    initialData?.idealType?.datePreferences || []
  );
  const [selectedImportantValues, setSelectedImportantValues] = useState<string[]>(
    initialData?.idealType?.importantValues || []
  );
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>(
    initialData?.idealType?.personalities || []
  );
  const [selectedAppearanceStyles, setSelectedAppearanceStyles] = useState<string[]>(
    initialData?.idealType?.appearanceStyles || []
  );
  const [selectedDealBreakers, setSelectedDealBreakers] = useState<string[]>(
    initialData?.idealType?.dealBreakers || []
  );
  const [ageRange, setAgeRange] = useState<[number, number]>([
    initialData?.idealType?.ageMin ?? 25,
    initialData?.idealType?.ageMax ?? 35,
  ]);
  const [heightRange, setHeightRange] = useState<[number, number]>([
    initialData?.idealType?.heightMin ?? 160,
    initialData?.idealType?.heightMax ?? 180,
  ]);

  const toggleDatePreference = (id: string) => {
    if (selectedDatePreferences.includes(id)) {
      setSelectedDatePreferences(selectedDatePreferences.filter(p => p !== id));
    } else {
      setSelectedDatePreferences([...selectedDatePreferences, id]);
    }
  };

  const toggleImportantValue = (value: string) => {
    if (selectedImportantValues.includes(value)) {
      setSelectedImportantValues(selectedImportantValues.filter(v => v !== value));
    } else if (selectedImportantValues.length < importantMax) {
      setSelectedImportantValues([...selectedImportantValues, value]);
    }
  };

  const togglePersonality = (personality: string) => {
    if (selectedPersonalities.includes(personality)) {
      setSelectedPersonalities(selectedPersonalities.filter(p => p !== personality));
    } else if (selectedPersonalities.length < personalityMax) {
      setSelectedPersonalities([...selectedPersonalities, personality]);
    }
  };

  const toggleAppearanceStyle = (style: string) => {
    if (selectedAppearanceStyles.includes(style)) {
      setSelectedAppearanceStyles([]);
    } else {
      setSelectedAppearanceStyles([style]);
    }
  };

  const toggleDealBreaker = (value: string) => {
    if (selectedDealBreakers.includes(value)) {
      setSelectedDealBreakers(selectedDealBreakers.filter(d => d !== value));
    } else if (selectedDealBreakers.length < dealBreakerMax) {
      setSelectedDealBreakers([...selectedDealBreakers, value]);
    }
  };

  // ADR 0058 3b — 보이고 필수인 항목만 검증
  const isValid =
    (!datePrefVisible || !datePrefRequired || selectedDatePreferences.length > 0) &&
    (!importantVisible || !importantRequired || selectedImportantValues.length > 0) &&
    (!personalityVisible || !personalityRequired || selectedPersonalities.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <div className="bg-card border-b border-border px-6 py-4 space-y-3">
        <div className="flex items-center">
          {onBack && (
            <button onClick={onBack} className="mr-2 p-1 rounded-full hover:bg-accent transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className={onBack ? "" : "text-center w-full"}>이상형 설정</h2>
        </div>
        <div className="space-y-2">
          <Progress value={80} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">4/5 단계 - 약 3분 소요</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Info Banner */}
        <div className="bg-secondary border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-primary" />
            <h3 className="text-foreground">이상형을 알려주세요</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            키워드를 선택하면 AI가 자연스러운 문장으로 만들어 드려요
          </p>
        </div>

        {/* Age & Height Range — dual range sliders */}
        {(ageVisible || heightVisible) && (
        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
          <Label className="text-base font-semibold block">나이 / 키 범위 (선택)</Label>

          {/* 나이 */}
          {ageVisible && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-muted-foreground">{fields.label("ageRange", "나이 범위")}</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {ageRange[0]}세 ~ {ageRange[1]}세
              </p>
            </div>
            <Slider
              min={AGE_BOUND.min}
              max={AGE_BOUND.max}
              step={1}
              value={ageRange}
              onValueChange={(v) => setAgeRange([v[0], v[1]] as [number, number])}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{AGE_BOUND.min}세</span>
              <span>{AGE_BOUND.max}세</span>
            </div>
          </div>
          )}

          {/* 키 */}
          {heightVisible && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-muted-foreground">{fields.label("heightRange", "키 범위")}</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {heightRange[0]}cm ~ {heightRange[1]}cm
              </p>
            </div>
            <Slider
              min={HEIGHT_BOUND.min}
              max={HEIGHT_BOUND.max}
              step={1}
              value={heightRange}
              onValueChange={(v) => setHeightRange([v[0], v[1]] as [number, number])}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{HEIGHT_BOUND.min}cm</span>
              <span>{HEIGHT_BOUND.max}cm</span>
            </div>
          </div>
          )}
        </div>
        )}

        {/* Question 1: Date Preferences */}
        {datePrefVisible && (
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              {fields.label("datePreference", "Q1. 연인과 어떤 데이트를 선호하시나요?")}{datePrefRequired && " *"}
            </Label>
            <p className="text-sm text-muted-foreground mb-3">{fields.hint("datePreference", "복수 선택 가능")}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {datePreferences.map((pref) => (
              <button
                key={pref.code}
                onClick={() => toggleDatePreference(pref.code)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedDatePreferences.includes(pref.code)
                    ? "bg-secondary border-primary"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <p className="font-medium text-foreground mb-1">{pref.label}</p>
                {DATE_PREF_DESC[pref.code] && (
                  <p className="text-sm text-muted-foreground">{DATE_PREF_DESC[pref.code]}</p>
                )}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* Question 2: Important Values */}
        {importantVisible && (
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              {fields.label("importantValue", "Q2. 상대방에게서 중요하게 보는 가치는?")}{importantRequired && " *"}
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              {fields.hint("importantValue", `최대 ${importantMax}개 선택`)} ({selectedImportantValues.length}/{importantMax})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {importantValues.map((value) => {
              const rank = selectedImportantValues.indexOf(value.code); // -1 if not selected
              const isSelected = rank >= 0;
              return (
                <Badge
                  key={value.code}
                  onClick={() => toggleImportantValue(value.code)}
                  className={`relative overflow-visible cursor-pointer px-4 py-2 transition-all ${
                    isSelected
                      ? "bg-brand-soft text-brand-strong border-brand/40"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}
                  variant={isSelected ? "default" : "outline"}
                >
                  {isSelected && (
                    <span
                      className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center shadow-sm"
                      aria-label={`${rank + 1}순위`}
                    >
                      {rank + 1}
                    </span>
                  )}
                  {value.label}
                </Badge>
              );
            })}
          </div>
          {selectedImportantValues.length > 0 && (
            <p className="text-xs text-muted-foreground">
              선택한 순서대로 우선순위가 표시됩니다 (1순위가 가장 중요)
            </p>
          )}
        </div>
        )}

        {/* Question 3: Personality */}
        {personalityVisible && (
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              {fields.label("personality", "Q3. 어떤 성격의 사람을 선호하시나요?")}{personalityRequired && " *"}
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              {fields.hint("personality", `최대 ${personalityMax}개 선택`)} ({selectedPersonalities.length}/{personalityMax})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {personalities.map((personality) => {
              const isSelected = selectedPersonalities.includes(personality.code);
              return (
                <Badge
                  key={personality.code}
                  onClick={() => togglePersonality(personality.code)}
                  className={`cursor-pointer px-4 py-2 transition-all ${
                    isSelected
                      ? "bg-brand-soft text-brand-strong border-brand/40"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}
                  variant={isSelected ? "default" : "outline"}
                >
                  {personality.label}
                </Badge>
              );
            })}
          </div>
        </div>

        )}

        {/* Question 4: Appearance Style */}
        {appearanceVisible && (
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              {fields.label("appearanceStyle", "Q4. 선호하는 외모 스타일은?")}
            </Label>
            <p className="text-sm text-muted-foreground mb-3">{fields.hint("appearanceStyle", "하나만 선택 (선택사항)")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {appearanceStyles.map((style) => (
              <Badge
                key={style.code}
                onClick={() => toggleAppearanceStyle(style.code)}
                className={`cursor-pointer px-4 py-2 transition-all ${
                  selectedAppearanceStyles.includes(style.code)
                    ? "bg-brand-soft text-brand-strong border-brand/40"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                }`}
                variant={selectedAppearanceStyles.includes(style.code) ? "default" : "outline"}
              >
                {style.label}
              </Badge>
            ))}
          </div>
        </div>
        )}

        {/* Question 5: Deal Breakers */}
        {dealBreakerVisible && (
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              {fields.label("dealBreaker", "Q5. 절대 안되는 것들은?")} (최대 {dealBreakerMax}개)
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              선택사항 ({selectedDealBreakers.length}/{dealBreakerMax})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dealBreakerOptions.map((option) => (
              <Badge
                key={option.code}
                onClick={() => toggleDealBreaker(option.code)}
                className={`cursor-pointer px-4 py-2 transition-all ${
                  selectedDealBreakers.includes(option.code)
                    ? "bg-brand-soft text-brand-strong border-brand/40"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                }`}
                variant={selectedDealBreakers.includes(option.code) ? "default" : "outline"}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>
        )}

        {/* Next Button */}
        <Button
          onClick={() => onNext({
            idealType: {
              ageMin: ageRange[0],
              ageMax: ageRange[1],
              heightMin: heightRange[0],
              heightMax: heightRange[1],
              datePreferences: selectedDatePreferences,
              importantValues: selectedImportantValues,
              personalities: selectedPersonalities,
              appearanceStyles: selectedAppearanceStyles,
              dealBreakers: selectedDealBreakers,
            },
          })}
          disabled={!isValid}
          className="w-full h-14 bg-brand-soft text-brand-strong disabled:opacity-50"
        >
          다음 — 사진 등록
        </Button>

        {!isValid && (
          <p className="text-sm text-center text-rose-600">
            필수 항목을 모두 선택해주세요
          </p>
        )}
      </div>
    </div>
  );
}
