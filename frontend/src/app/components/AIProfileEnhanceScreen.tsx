import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sparkles, RefreshCw, Check, ArrowRight } from "lucide-react";

interface AIProfileEnhanceScreenProps {
  onComplete: () => void;
}

export function AIProfileEnhanceScreen({ onComplete }: AIProfileEnhanceScreenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<"original" | "ai">("ai");
  
  // Mock data - 실제로는 사용자가 입력한 데이터 사용
  const originalProfile = {
    bio: "안녕하세요. 개발자입니다. 운동 좋아하고 영화도 좋아합니다. 주말에는 주로 집에서 쉬거나 친구 만나요.",
    interests: ["운동", "영화", "여행"],
    lifestyle: {
      smoking: "비흡연",
      drinking: "가끔",
      religion: "무교",
    },
    idealType: "활발하고 유머있는 사람을 좋아합니다.",
  };

  const aiEnhancedProfile = {
    bio: "테크 스타트업에서 열정적으로 일하는 개발자예요. 평일엔 코드와 씨름하지만, 주말엔 헬스장에서 땀 흘리며 리프레시합니다. 감성적인 영화 한 편과 함께하는 저녁을 사랑해요. 친구들과의 소소한 모임도 즐기지만, 혼자만의 조용한 시간도 소중히 여기는 편이에요 🎬",
    interests: ["운동", "영화", "여행", "맛집 탐방", "카페"],
    lifestyle: {
      smoking: "비흡연",
      drinking: "가끔",
      religion: "무교",
    },
    idealType: "활발하고 유머 감각이 있으면서도, 진지한 대화를 나눌 수 있는 분을 찾고 있어요. 서로의 일상을 존중하며 함께 성장할 수 있는 관계를 원합니다.",
    aiSuggestions: [
      "직업적 열정과 일상의 균형을 잘 표현했어요",
      "취미를 더 구체적이고 매력적으로 묘사했어요",
      "이상형을 더 진솔하고 구체적으로 설명했어요",
      "감성적인 터치를 더해 친근한 느낌을 강화했어요",
    ],
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-center">AI 프로필 개선</h2>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* AI Info Banner */}
        <div className="bg-gradient-to-r from-pink-50 to-amber-50 border-2 border-pink-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h3 className="text-pink-900">AI가 당신의 매력을 더했어요!</h3>
          </div>
          <p className="text-sm text-pink-700">
            입력하신 정보를 바탕으로 더 매력적이고 진솔한 프로필을 작성했습니다.
            {aiEnhancedProfile.aiSuggestions.length > 0 && " 아래 내용을 확인해보세요."}
          </p>
        </div>

        {/* AI Suggestions */}
        {aiEnhancedProfile.aiSuggestions.length > 0 && (
          <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-3">
            <h4 className="text-amber-900 flex items-center gap-2">
              <Check className="w-5 h-5" />
              개선 포인트
            </h4>
            <ul className="space-y-2">
              {aiEnhancedProfile.aiSuggestions.map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Version Toggle */}
        <div className="flex gap-3 bg-slate-100 p-2 rounded-xl">
          <button
            onClick={() => setCurrentVersion("ai")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              currentVersion === "ai"
                ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-lg"
                : "bg-transparent text-slate-600"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI 개선 버전
            </div>
          </button>
          <button
            onClick={() => setCurrentVersion("original")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              currentVersion === "original"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-transparent text-slate-600"
            }`}
          >
            원본
          </button>
        </div>

        {/* Profile Preview */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
          {/* Bio */}
          <div>
            <Label className="block mb-3 text-slate-700">자기소개</Label>
            <p className="text-slate-900 leading-relaxed">
              {currentVersion === "ai" ? aiEnhancedProfile.bio : originalProfile.bio}
            </p>
          </div>

          {/* Interests */}
          <div>
            <Label className="block mb-3 text-slate-700">관심사</Label>
            <div className="flex flex-wrap gap-2">
              {(currentVersion === "ai" ? aiEnhancedProfile.interests : originalProfile.interests).map((interest) => (
                <Badge
                  key={interest}
                  className="bg-pink-100 text-pink-700 border-pink-200 px-4 py-2"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Lifestyle */}
          <div>
            <Label className="block mb-3 text-slate-700">라이프스타일</Label>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-600">흡연:</span>
                <Badge variant="outline" className="border-slate-300">
                  {(currentVersion === "ai" ? aiEnhancedProfile.lifestyle : originalProfile.lifestyle).smoking}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">음주:</span>
                <Badge variant="outline" className="border-slate-300">
                  {(currentVersion === "ai" ? aiEnhancedProfile.lifestyle : originalProfile.lifestyle).drinking}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">종교:</span>
                <Badge variant="outline" className="border-slate-300">
                  {(currentVersion === "ai" ? aiEnhancedProfile.lifestyle : originalProfile.lifestyle).religion}
                </Badge>
              </div>
            </div>
          </div>

          {/* Ideal Type */}
          <div>
            <Label className="block mb-3 text-slate-700">이상형</Label>
            <p className="text-slate-900 leading-relaxed">
              {currentVersion === "ai" ? aiEnhancedProfile.idealType : originalProfile.idealType}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRegenerate}
            variant="outline"
            disabled={isGenerating}
            className="w-full h-14 border-2 border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "재생성 중..." : "AI 재생성"}
          </Button>

          <Button
            onClick={onComplete}
            className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-400 text-white"
          >
            이 프로필로 계속하기
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Privacy Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-orange-800">
            💡 언제든지 나중에 프로필을 직접 수정할 수 있어요
          </p>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}