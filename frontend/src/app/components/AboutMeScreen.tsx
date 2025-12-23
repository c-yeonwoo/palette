import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Instagram, Sparkles, Lightbulb } from "lucide-react";

interface AboutMeScreenProps {
  onNext: () => void;
}

const interests = {
  "운동/스포츠": ["헬스", "요가", "골프", "등산", "클라이밍", "러닝", "수영", "테니스"],
  "문화/예술": ["영화", "전시", "공연", "사진", "그림", "악기", "뮤지컬"],
  "여행": ["국내여행", "해외여행", "캠핑", "드라이브", "백패킹"],
  "음식": ["맛집탐방", "요리", "카페", "와인", "베이킹", "커피"],
  "게임/엔터": ["게임", "넷플릭스", "웹툰", "독서", "유튜브"],
  "반려동물": ["강아지", "고양이", "기타"],
  "자기계발": ["투자", "외국어", "자격증", "독서", "스터디"],
};

export function AboutMeScreen({ onNext }: AboutMeScreenProps) {
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [smoking, setSmoking] = useState("");
  const [drinking, setDrinking] = useState("");
  const [religion, setReligion] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [showInstagram, setShowInstagram] = useState(true);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < 10) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const isValid = bio.length >= 50 && selectedInterests.length > 0 && smoking && drinking && religion;

  const guideTexts = [
    "내 성격을 한 문장으로 표현해보세요",
    "주말에 주로 무엇을 하며 시간을 보내나요?",
    "가장 좋아하는 것들은 무엇인가요?",
    "연애관이나 결혼관에 대해 이야기해주세요",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <div className="bg-card border-b border-border px-6 py-4 space-y-3">
        <h2 className="text-center">자기소개 작성</h2>
        <div className="space-y-2">
          <Progress value={60} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">3/5 단계 - 약 3분 소요</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Instagram Auto-fill */}
        {showInstagram && (
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram className="w-5 h-5 text-pink-500" />
                <h3 className="text-pink-900">인스타그램으로 자동 작성</h3>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <button
                onClick={() => setShowInstagram(false)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                건너뛰기
              </button>
            </div>
            <p className="text-sm text-pink-700">
              AI가 인스타그램을 분석하여 매력적인 자기소개를 자동으로 작성해드려요
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                <input
                  type="text"
                  placeholder="@your_instagram_id"
                  value={instagramId}
                  onChange={(e) => setInstagramId(e.target.value)}
                  className="w-full pl-11 h-12 rounded-lg border-2 border-pink-200 focus:border-pink-400 focus:ring-pink-400"
                />
              </div>
              <Button className="h-12 bg-gradient-to-r from-pink-400 to-purple-400 text-white">
                분석하기
              </Button>
            </div>
          </div>
        )}

        {/* Bio */}
        <div>
          <Label className="mb-2 block">자기소개 * (50자 이상, 최대 500자)</Label>
          <Textarea
            placeholder="자유롭게 자신을 소개해주세요..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[150px] bg-white border-slate-200 resize-none"
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <p className={`text-sm ${bio.length < 50 ? 'text-rose-600' : 'text-green-600'}`}>
              {bio.length}/500자 {bio.length < 50 && `(최소 ${50 - bio.length}자 더 필요)`}
            </p>
          </div>
        </div>

        {/* Writing Guide */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h4 className="text-slate-900">작성 가이드</h4>
          </div>
          <ul className="space-y-2">
            {guideTexts.map((text, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-pink-500 mt-0.5">•</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Interests */}
        <div>
          <Label className="mb-3 block">
            취미/관심사 * (최대 10개 선택)
            <span className="text-sm text-slate-500 ml-2">
              {selectedInterests.length}/10
            </span>
          </Label>
          <div className="space-y-4">
            {Object.entries(interests).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-slate-700 mb-2">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {items.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <Badge
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`cursor-pointer px-4 py-2 transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                            : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                        }`}
                        variant={isSelected ? "default" : "outline"}
                      >
                        {interest}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lifestyle */}
        <div className="space-y-5">
          <h3 className="text-slate-900">라이프스타일</h3>
          
          {/* Smoking */}
          <div>
            <Label className="mb-2 block">흡연 *</Label>
            <div className="grid grid-cols-3 gap-3">
              {["비흡연", "가끔", "자주"].map((option) => (
                <button
                  key={option}
                  onClick={() => setSmoking(option)}
                  className={`py-3 rounded-xl border-2 font-medium transition-all ${
                    smoking === option
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                      : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Drinking */}
          <div>
            <Label className="mb-2 block">음주 *</Label>
            <div className="grid grid-cols-3 gap-3">
              {["안마심", "가끔", "자주"].map((option) => (
                <button
                  key={option}
                  onClick={() => setDrinking(option)}
                  className={`py-3 rounded-xl border-2 font-medium transition-all ${
                    drinking === option
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                      : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Religion */}
          <div>
            <Label className="mb-2 block">종교 *</Label>
            <div className="grid grid-cols-3 gap-3">
              {["무교", "기독교", "천주교", "불교", "기타"].map((option) => (
                <button
                  key={option}
                  onClick={() => setReligion(option)}
                  className={`py-3 rounded-xl border-2 font-medium transition-all ${
                    religion === option
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                      : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Next Button */}
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-400 text-white disabled:opacity-50"
        >
          다음 - 이상형 설정
        </Button>

        {!isValid && (
          <p className="text-sm text-center text-rose-600">
            모든 필수 항목을 입력해주세요
          </p>
        )}
      </div>
    </div>
  );
}
