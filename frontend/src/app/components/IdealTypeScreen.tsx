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
}

const personalities = [
  "유머있는", "다정한", "지적인", "활발한", "차분한",
  "섬세한", "솔직한", "적극적인", "배려심많은", "독립적인"
];

const styles = ["캐주얼", "댄디", "스트릿", "페미닌", "시크", "스포티", "모던"];

const bodyTypes = ["슬림", "보통", "탄탄", "건장", "풍만"];

const dateStyles = [
  { id: "active", label: "액티브", desc: "여행, 운동, 액티비티" },
  { id: "indoor", label: "인도어", desc: "집, 카페, 영화" },
  { id: "culture", label: "문화", desc: "전시, 공연, 맛집" },
  { id: "balance", label: "밸런스", desc: "상황에 따라" },
];

const relationshipGoals = ["진지한 연애", "결혼 전제", "친구부터 천천히"];

export function IdealTypeScreen({ onNext, initialData }: IdealTypeScreenProps) {
  const [ageRange, setAgeRange] = useState(initialData?.idealType?.ageMin && initialData?.idealType?.ageMax ? [initialData.idealType.ageMin, initialData.idealType.ageMax] : [25, 35]);
  const [heightRange, setHeightRange] = useState(initialData?.idealType?.heightMin && initialData?.idealType?.heightMax ? [initialData.idealType.heightMin, initialData.idealType.heightMax] : [165, 180]);
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(initialData?.idealType?.bodyTypes || []);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>(initialData?.idealType?.personalities || []);
  const [dateStyle, setDateStyle] = useState(initialData?.idealType?.dateStyle || "");
  const [relationshipGoal, setRelationshipGoal] = useState(initialData?.idealType?.purpose || "");
  const [dealBreakers, setDealBreakers] = useState(initialData?.idealType?.dealBreakers || "");

  const toggleBodyType = (type: string) => {
    if (selectedBodyTypes.includes(type)) {
      setSelectedBodyTypes(selectedBodyTypes.filter(t => t !== type));
    } else {
      setSelectedBodyTypes([...selectedBodyTypes, type]);
    }
  };

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter(s => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  const togglePersonality = (personality: string) => {
    if (selectedPersonalities.includes(personality)) {
      setSelectedPersonalities(selectedPersonalities.filter(p => p !== personality));
    } else if (selectedPersonalities.length < 5) {
      setSelectedPersonalities([...selectedPersonalities, personality]);
    }
  };

  const isValid = selectedPersonalities.length > 0 && dateStyle && relationshipGoal;

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
            원하는 이상형을 설정하면 더 적합한 인연을 추천해드려요
          </p>
        </div>

        {/* Age Range */}
        <div>
          <Label className="mb-3 block">
            선호 나이 - {ageRange[0]}세 ~ {ageRange[1]}세
          </Label>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-2">최소 나이: {ageRange[0]}세</p>
              <input
                type="range"
                min="20"
                max="50"
                value={ageRange[0]}
                onChange={(e) => setAgeRange([parseInt(e.target.value), ageRange[1]])}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">최대 나이: {ageRange[1]}세</p>
              <input
                type="range"
                min="20"
                max="50"
                value={ageRange[1]}
                onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Height Range */}
        <div>
          <Label className="mb-3 block">
            선호 키 - {heightRange[0]}cm ~ {heightRange[1]}cm
          </Label>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-2">최소 키: {heightRange[0]}cm</p>
              <input
                type="range"
                min="140"
                max="220"
                value={heightRange[0]}
                onChange={(e) => setHeightRange([parseInt(e.target.value), heightRange[1]])}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">최대 키: {heightRange[1]}cm</p>
              <input
                type="range"
                min="140"
                max="220"
                value={heightRange[1]}
                onChange={(e) => setHeightRange([heightRange[0], parseInt(e.target.value)])}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Body Type */}
        <div>
          <Label className="mb-3 block">선호 체형 (다중 선택 가능)</Label>
          <div className="flex flex-wrap gap-2">
            {bodyTypes.map((type) => (
              <Badge
                key={type}
                onClick={() => toggleBodyType(type)}
                className={`cursor-pointer px-4 py-2 transition-all ${
                  selectedBodyTypes.includes(type)
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                    : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                }`}
                variant={selectedBodyTypes.includes(type) ? "default" : "outline"}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <Label className="mb-3 block">선호 스타일 (다중 선택 가능)</Label>
          <div className="flex flex-wrap gap-2">
            {styles.map((style) => (
              <Badge
                key={style}
                onClick={() => toggleStyle(style)}
                className={`cursor-pointer px-4 py-2 transition-all ${
                  selectedStyles.includes(style)
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                    : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                }`}
                variant={selectedStyles.includes(style) ? "default" : "outline"}
              >
                {style}
              </Badge>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div>
          <Label className="mb-3 block">
            중요하게 생각하는 성격 * (최대 5개)
            <span className="text-sm text-slate-500 ml-2">
              {selectedPersonalities.length}/5
            </span>
          </Label>
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

        {/* Date Style */}
        <div>
          <Label className="mb-3 block">데이트 스타일 *</Label>
          <div className="grid grid-cols-2 gap-3">
            {dateStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setDateStyle(style.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  dateStyle === style.id
                    ? "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-400"
                    : "bg-white border-slate-200 hover:border-pink-300"
                }`}
              >
                <p className="font-medium text-slate-900 mb-1">{style.label}</p>
                <p className="text-sm text-slate-600">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Relationship Goal */}
        <div>
          <Label className="mb-3 block">만남의 목적 *</Label>
          <div className="grid grid-cols-3 gap-3">
            {relationshipGoals.map((goal) => (
              <button
                key={goal}
                onClick={() => setRelationshipGoal(goal)}
                className={`py-3 rounded-xl border-2 font-medium transition-all ${
                  relationshipGoal === goal
                    ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                    : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Deal Breakers */}
        <div>
          <Label className="mb-2 block">Deal Breakers (절대 안되는 것들)</Label>
          <Textarea
            placeholder='예: "흡연자는 어려워요", "반려동물 알러지가 있어요"'
            value={dealBreakers}
            onChange={(e) => setDealBreakers(e.target.value)}
            className="min-h-[100px] bg-white border-slate-200 resize-none"
            maxLength={200}
          />
          <p className="text-sm text-slate-500 mt-2">{dealBreakers.length}/200자</p>
        </div>

        {/* Next Button */}
        <Button
          onClick={() => onNext({
            idealType: {
              ageMin: ageRange[0],
              ageMax: ageRange[1],
              heightMin: heightRange[0],
              heightMax: heightRange[1],
              bodyTypes: selectedBodyTypes,
              personalities: selectedPersonalities,
              dateStyle,
              purpose: relationshipGoal,
              dealBreakers,
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
