import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { Heart, Sparkles, ChevronLeft } from "lucide-react";

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

const personalities = [
  "유머있는", "다정한", "지적인", "활발한", "차분한",
  "섬세한", "솔직한", "적극적인", "배려심많은", "독립적인"
];

const datePreferences = [
  { id: "active", label: "액티브한 데이트", desc: "여행, 운동, 액티비티" },
  { id: "indoor", label: "실내 데이트", desc: "집, 카페, 영화관" },
  { id: "culture", label: "문화 데이트", desc: "전시, 공연, 맛집 투어" },
  { id: "nature", label: "자연 데이트", desc: "산책, 드라이브, 피크닉" },
];

const importantValues = [
  "성격/성향", "외모", "학력", "능력/커리어", "집안/가족", "직업", "경제력", "가치관"
];

// 남자가 선택하는 여자 외모 스타일
const femaleAppearanceStyles = [
  "강아지상", "고양이상", "토끼상", "여우상", "사슴상", "두부상", "순두부상", "아랍상", "일진상", "상견례입구컷상"
];

// 여자가 선택하는 남자 외모 스타일
const maleAppearanceStyles = [
  "강아지상", "고양이상", "전교회장상", "체대상", "너드상", "두부상", "아랍상", "공룡상"
];

// Deal Breakers (절대 안되는 것들) - 최대 3개
const dealBreakerOptions = [
  { value: "SMOKING", label: "흡연자" },
  { value: "HEAVY_DRINKING", label: "과음하는 사람" },
  { value: "DISLIKES_PETS", label: "반려동물을 싫어하는 사람" },
  { value: "LONG_DISTANCE", label: "장거리 연애" },
  { value: "DIFFERENT_RELIGION", label: "종교가 다른 사람" },
  { value: "NO_MARRIAGE_PLAN", label: "결혼 의사가 없는 사람" },
  { value: "CHILDREN_PLAN", label: "자녀 계획이 맞지 않는 사람" },
  { value: "UNSTABLE_JOB", label: "직업이 불안정한 사람" },
  { value: "CONTACTS_EX", label: "전 연인과 연락하는 사람" },
  { value: "LARGE_AGE_GAP", label: "나이 차이가 많이 나는 사람" }
];

export function IdealTypeScreen({ onNext, onBack, initialData, userGender }: IdealTypeScreenProps) {
  // 사용자 성별에 따라 다른 외모 스타일 옵션 제공
  const appearanceStyles = userGender === "MALE" ? femaleAppearanceStyles : maleAppearanceStyles;

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
    } else if (selectedImportantValues.length < 3) {
      setSelectedImportantValues([...selectedImportantValues, value]);
    }
  };

  const togglePersonality = (personality: string) => {
    if (selectedPersonalities.includes(personality)) {
      setSelectedPersonalities(selectedPersonalities.filter(p => p !== personality));
    } else if (selectedPersonalities.length < 5) {
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
    } else if (selectedDealBreakers.length < 3) {
      setSelectedDealBreakers([...selectedDealBreakers, value]);
    }
  };

  const isValid =
    selectedDatePreferences.length > 0 &&
    selectedImportantValues.length > 0 &&
    selectedPersonalities.length > 0;

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
        <div className="bg-card rounded-xl p-6 border border-border space-y-6">
          <Label className="text-base font-semibold block">나이 / 키 범위 (선택)</Label>

          {/* 나이 */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-muted-foreground">나이 범위</p>
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

          {/* 키 */}
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-muted-foreground">키 범위</p>
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
        </div>

        {/* Question 1: Date Preferences */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              Q1. 연인과 어떤 데이트를 선호하시나요? *
            </Label>
            <p className="text-sm text-muted-foreground mb-3">복수 선택 가능</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {datePreferences.map((pref) => (
              <button
                key={pref.id}
                onClick={() => toggleDatePreference(pref.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  selectedDatePreferences.includes(pref.id)
                    ? "bg-secondary border-primary"
                    : "bg-card border-border hover:border-primary/40"
                }`}
              >
                <p className="font-medium text-foreground mb-1">{pref.label}</p>
                <p className="text-sm text-muted-foreground">{pref.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Question 2: Important Values */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              Q2. 상대방에게서 중요하게 보는 가치는? *
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              최대 3개 선택 ({selectedImportantValues.length}/3)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {importantValues.map((value) => {
              const rank = selectedImportantValues.indexOf(value); // -1 if not selected
              const isSelected = rank >= 0;
              return (
                <Badge
                  key={value}
                  onClick={() => toggleImportantValue(value)}
                  className={`relative cursor-pointer px-4 py-2 transition-all ${
                    isSelected
                      ? "bg-brand-soft text-gold-strong border-brand/40"
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
                  {value}
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

        {/* Question 3: Personality */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              Q3. 어떤 성격의 사람을 선호하시나요? *
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              최대 5개 선택 ({selectedPersonalities.length}/5)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {personalities.map((personality) => {
              const isSelected = selectedPersonalities.includes(personality);
              return (
                <Badge
                  key={personality}
                  onClick={() => togglePersonality(personality)}
                  className={`cursor-pointer px-4 py-2 transition-all ${
                    isSelected
                      ? "bg-brand-soft text-gold-strong border-brand/40"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}
                  variant={isSelected ? "default" : "outline"}
                >
                  {personality}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Question 4: Appearance Style */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              Q4. 선호하는 외모 스타일은?
            </Label>
            <p className="text-sm text-muted-foreground mb-3">하나만 선택 (선택사항)</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {appearanceStyles.map((style) => (
              <Badge
                key={style}
                onClick={() => toggleAppearanceStyle(style)}
                className={`cursor-pointer px-4 py-2 transition-all ${
                  selectedAppearanceStyles.includes(style)
                    ? "bg-brand-soft text-gold-strong border-brand/40"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                }`}
                variant={selectedAppearanceStyles.includes(style) ? "default" : "outline"}
              >
                {style}
              </Badge>
            ))}
          </div>
        </div>

        {/* Question 5: Deal Breakers */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              Q5. 절대 안되는 것들은? (최대 3개)
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              선택사항 ({selectedDealBreakers.length}/3)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dealBreakerOptions.map((option) => (
              <Badge
                key={option.value}
                onClick={() => toggleDealBreaker(option.value)}
                className={`cursor-pointer px-4 py-2 transition-all ${
                  selectedDealBreakers.includes(option.value)
                    ? "bg-brand-soft text-gold-strong border-brand/40"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                }`}
                variant={selectedDealBreakers.includes(option.value) ? "default" : "outline"}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

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
          className="w-full h-14 bg-brand-soft text-gold-strong disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          다음 - AI 프로필 완성
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
