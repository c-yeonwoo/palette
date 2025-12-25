import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Heart, Sparkles } from "lucide-react";

interface IdealTypeScreenProps {
  onNext: (data: any) => void;
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
  { id: "indoor", label: "인도어 데이트", desc: "집, 카페, 영화관" },
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

export function IdealTypeScreen({ onNext, initialData, userGender }: IdealTypeScreenProps) {
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
        <h2 className="text-center">이상형 설정</h2>
        <div className="space-y-2">
          <Progress value={80} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">4/5 단계 - 약 3분 소요</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <h3 className="text-rose-900">이상형을 알려주세요</h3>
          </div>
          <p className="text-sm text-rose-700">
            키워드를 선택하면 AI가 자연스러운 문장으로 만들어 드려요
          </p>
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
                    ? "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-400"
                    : "bg-white border-slate-200 hover:border-pink-300"
                }`}
              >
                <p className="font-medium text-slate-900 mb-1">{pref.label}</p>
                <p className="text-sm text-slate-600">{pref.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Question 2: Important Values */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div>
            <Label className="text-base font-semibold mb-1 block">
              Q2. 중요하게 보는 세 가지가 있다면? *
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              최대 3개 선택 ({selectedImportantValues.length}/3)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {importantValues.map((value) => (
              <Badge
                key={value}
                onClick={() => toggleImportantValue(value)}
                className={`cursor-pointer px-4 py-2 transition-all ${
                  selectedImportantValues.includes(value)
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                    : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                }`}
                variant={selectedImportantValues.includes(value) ? "default" : "outline"}
              >
                {value}
              </Badge>
            ))}
          </div>
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
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                      : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
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
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                    : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
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
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                    : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
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
              datePreferences: selectedDatePreferences,
              importantValues: selectedImportantValues,
              personalities: selectedPersonalities,
              appearanceStyles: selectedAppearanceStyles,
              dealBreakers: selectedDealBreakers,
            },
          })}
          disabled={!isValid}
          className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-400 text-white disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          AI 프로필 개선하기
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
