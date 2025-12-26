import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sparkles, RefreshCw, Check, ArrowRight } from "lucide-react";

interface AIProfileEnhanceScreenProps {
  onComplete: () => void;
  profileData: {
    introduction: {
      interviewAnswers: {
        hobby: string;
        charm: string;
        passion: string;
        happiness: string;
        motto: string;
      };
    };
    lifestyleInfo: {
      smoking: string;
      drinking: string;
      religion: string;
    };
    idealType: {
      datePreferences: string[];
      importantValues: string[];
      personalities: string[];
      appearanceStyles: string[];
      dealBreakers: string[];
    };
  };
}

export function AIProfileEnhanceScreen({ onComplete, profileData }: AIProfileEnhanceScreenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<"original" | "ai">("ai");

  // 실제 사용자 입력 데이터
  const originalProfile = {
    interviewAnswers: profileData.introduction.interviewAnswers,
    lifestyle: {
      smoking: profileData.lifestyleInfo.smoking,
      drinking: profileData.lifestyleInfo.drinking,
      religion: profileData.lifestyleInfo.religion,
    },
    idealType: {
      datePreferences: profileData.idealType.datePreferences,
      importantValues: profileData.idealType.importantValues,
      personalities: profileData.idealType.personalities,
      appearanceStyles: profileData.idealType.appearanceStyles,
      dealBreakers: profileData.idealType.dealBreakers,
    },
  };

  // AI 개선 버전 (mock - 추후 LLM 연동)
  const aiEnhancedProfile = {
    interviewAnswers: {
      hobby: profileData.introduction.interviewAnswers.hobby + " 주변 사람들과 함께할 때 더욱 즐겁고 의미있는 시간을 보내려고 노력해요.",
      charm: profileData.introduction.interviewAnswers.charm + " 이런 점들이 저를 특별하게 만들어주는 것 같아요.",
      passion: profileData.introduction.interviewAnswers.passion + " 이 과정에서 배우고 성장하는 게 정말 즐거워요.",
      happiness: profileData.introduction.interviewAnswers.happiness + " 그런 순간들이 제게 가장 큰 행복이에요.",
      motto: profileData.introduction.interviewAnswers.motto + " 이 마음가짐으로 매일을 살아가고 있어요.",
    },
    lifestyle: originalProfile.lifestyle,
    idealType: originalProfile.idealType,
    aiSuggestions: [
      "인터뷰 답변에 더 구체적이고 매력적인 표현을 추가했어요",
      "일상의 소소한 행복을 잘 표현했어요",
      "진솔하고 따뜻한 느낌을 강화했어요",
      "당신의 개성과 가치관이 잘 드러나도록 개선했어요",
    ],
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleComplete = () => {
    const versionText = currentVersion === "ai" ? "AI 개선된 버전" : "원본 버전";
    const confirmed = window.confirm(
      `${versionText}으로 프로필을 작성하시겠습니까?\n\n선택하신 내용으로 프로필이 생성됩니다.`
    );

    if (confirmed) {
      onComplete();
    }
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
          {/* Interview Answers */}
          <div className="space-y-4">
            <Label className="block mb-3 text-slate-700 font-semibold">자기소개</Label>

            <InterviewAnswerDisplay
              question="쉬는 날엔 주로 이렇게 시간을 보내요"
              answer={currentVersion === "ai" ? aiEnhancedProfile.interviewAnswers.hobby : originalProfile.interviewAnswers.hobby}
            />

            <InterviewAnswerDisplay
              question="제 매력 포인트는 바로 이거!"
              answer={currentVersion === "ai" ? aiEnhancedProfile.interviewAnswers.charm : originalProfile.interviewAnswers.charm}
            />

            <InterviewAnswerDisplay
              question="요즘 제가 푹 빠져있는 것"
              answer={currentVersion === "ai" ? aiEnhancedProfile.interviewAnswers.passion : originalProfile.interviewAnswers.passion}
            />

            <InterviewAnswerDisplay
              question="저는 이럴 때 행복해요"
              answer={currentVersion === "ai" ? aiEnhancedProfile.interviewAnswers.happiness : originalProfile.interviewAnswers.happiness}
            />

            <InterviewAnswerDisplay
              question="제 인생의 좌우명은"
              answer={currentVersion === "ai" ? aiEnhancedProfile.interviewAnswers.motto : originalProfile.interviewAnswers.motto}
            />
          </div>

          {/* Lifestyle */}
          <div>
            <Label className="block mb-3 text-slate-700 font-semibold">라이프스타일</Label>
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
            <Label className="block mb-3 text-slate-700 font-semibold">이상형</Label>
            <div className="space-y-3">
              {(currentVersion === "ai" ? aiEnhancedProfile.idealType : originalProfile.idealType).datePreferences.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">데이트 스타일</p>
                  <div className="flex flex-wrap gap-2">
                    {(currentVersion === "ai" ? aiEnhancedProfile.idealType : originalProfile.idealType).datePreferences.map((pref) => (
                      <Badge key={pref} variant="secondary" className="text-sm">
                        {getDatePreferenceLabel(pref)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(currentVersion === "ai" ? aiEnhancedProfile.idealType : originalProfile.idealType).importantValues.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">중요하게 보는 가치</p>
                  <div className="flex flex-wrap gap-2">
                    {(currentVersion === "ai" ? aiEnhancedProfile.idealType : originalProfile.idealType).importantValues.map((val) => (
                      <Badge key={val} variant="secondary" className="text-sm">
                        {val}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(currentVersion === "ai" ? aiEnhancedProfile.idealType : originalProfile.idealType).personalities.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">선호하는 성격</p>
                  <div className="flex flex-wrap gap-2">
                    {(currentVersion === "ai" ? aiEnhancedProfile.idealType : originalProfile.idealType).personalities.map((personality) => (
                      <Badge key={personality} variant="secondary" className="text-sm">
                        {personality}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            onClick={handleComplete}
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

function InterviewAnswerDisplay({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="pb-3 border-b border-slate-100 last:border-0">
      <p className="text-sm font-medium text-pink-600 mb-2">{question}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{answer}</p>
    </div>
  );
}

function getDatePreferenceLabel(pref: string): string {
  const labels: Record<string, string> = {
    'active': '액티브한 데이트',
    'ACTIVE': '액티브한 데이트',
    'indoor': '인도어 데이트',
    'INDOOR': '인도어 데이트',
    'culture': '문화 데이트',
    'CULTURE': '문화 데이트',
    'nature': '자연 데이트',
    'NATURE': '자연 데이트',
  };
  return labels[pref] || pref;
}