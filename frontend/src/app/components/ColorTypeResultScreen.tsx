import { Button } from "./ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

const COLOR_TYPE_INFO: Record<string, { emoji: string; bgGradient: string; textColor: string; badgeColor: string }> = {
  WARM_ORANGE: {
    emoji: "🍊",
    bgGradient: "from-orange-400 to-amber-400",
    textColor: "text-orange-900",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  CALM_BLUE: {
    emoji: "🌊",
    bgGradient: "from-blue-400 to-cyan-400",
    textColor: "text-blue-900",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  VIBRANT_RED: {
    emoji: "🔥",
    bgGradient: "from-red-400 to-rose-500",
    textColor: "text-red-900",
    badgeColor: "bg-red-100 text-red-700",
  },
  SOFT_PINK: {
    emoji: "🌸",
    bgGradient: "from-pink-300 to-rose-300",
    textColor: "text-pink-900",
    badgeColor: "bg-pink-100 text-pink-700",
  },
  FRESH_GREEN: {
    emoji: "🌿",
    bgGradient: "from-green-400 to-emerald-400",
    textColor: "text-green-900",
    badgeColor: "bg-green-100 text-green-700",
  },
  ELEGANT_PURPLE: {
    emoji: "💜",
    bgGradient: "from-purple-400 to-violet-500",
    textColor: "text-purple-900",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  BRIGHT_YELLOW: {
    emoji: "☀️",
    bgGradient: "from-yellow-300 to-amber-400",
    textColor: "text-yellow-900",
    badgeColor: "bg-yellow-100 text-yellow-700",
  },
  SOPHISTICATED_GRAY: {
    emoji: "🌫️",
    bgGradient: "from-slate-400 to-gray-500",
    textColor: "text-slate-900",
    badgeColor: "bg-slate-100 text-slate-700",
  },
};

interface ColorTypeResultScreenProps {
  colorType: string;
  colorName: string;
  colorHex: string;
  colorDescription: string;
  generatedIntroduction: string;
  onContinue: () => void;
}

export function ColorTypeResultScreen({
  colorType,
  colorName,
  colorHex,
  colorDescription,
  generatedIntroduction,
  onContinue,
}: ColorTypeResultScreenProps) {
  const info = COLOR_TYPE_INFO[colorType] ?? {
    emoji: "✨",
    bgGradient: "from-pink-400 to-purple-500",
    textColor: "text-slate-900",
    badgeColor: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-pink-50 flex flex-col">
      {/* Color Card */}
      <div className={`bg-gradient-to-br ${info.bgGradient} px-6 pt-16 pb-12 text-white text-center`}>
        <div className="text-6xl mb-4">{info.emoji}</div>
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 mb-4">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">당신의 색깔</span>
        </div>
        <h1 className="text-3xl font-bold mb-3">{colorName}</h1>
        <div
          className="w-12 h-12 rounded-full border-4 border-white/50 shadow-lg mx-auto mb-4"
          style={{ backgroundColor: colorHex }}
        />
        <p className="text-white/90 text-sm leading-relaxed max-w-xs mx-auto">
          {colorDescription}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6 space-y-5">
        {/* Generated Intro */}
        {generatedIntroduction && (
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="font-semibold text-slate-700 text-sm">AI가 작성한 나의 소개</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{generatedIntroduction}</p>
          </div>
        )}

        {/* Color Traits */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
          <p className="font-semibold text-slate-700 text-sm mb-3">이런 점이 매력이에요</p>
          <div className="flex flex-wrap gap-2">
            {getColorTraits(colorType).map((trait) => (
              <span
                key={trait}
                className={`px-3 py-1 rounded-full text-xs font-medium ${info.badgeColor}`}
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Harmony Info */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-5 border border-pink-100">
          <p className="text-xs text-pink-600 font-medium mb-1">색의 조화</p>
          <p className="text-sm text-slate-600">
            매칭 시 "{colorName}"과 잘 어울리는 색깔을 가진 분들이 추천될 거예요 ✨
          </p>
        </div>

        <Button
          onClick={onContinue}
          className={`w-full h-14 bg-gradient-to-r ${info.bgGradient} text-white text-base font-semibold`}
        >
          이 색깔로 계속하기
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-center text-xs text-slate-400">
          나중에 프로필에서 색깔을 변경할 수 있어요
        </p>
      </div>
    </div>
  );
}

function getColorTraits(colorType: string): string[] {
  const traits: Record<string, string[]> = {
    WARM_ORANGE: ["다정함", "활발함", "친근함", "따뜻함", "유머러스"],
    CALM_BLUE: ["신뢰감", "깊이있음", "사려깊음", "안정적", "지적"],
    VIBRANT_RED: ["열정", "적극성", "리더십", "카리스마", "도전정신"],
    SOFT_PINK: ["섬세함", "낭만적", "감성적", "배려심", "따뜻함"],
    FRESH_GREEN: ["편안함", "자연스러움", "솔직함", "균형감", "여유로움"],
    ELEGANT_PURPLE: ["지적임", "감각적", "독창성", "깊은 내면", "예술적"],
    BRIGHT_YELLOW: ["긍정적", "유쾌함", "밝음", "에너지", "친화력"],
    SOPHISTICATED_GRAY: ["프로페셔널", "이성적", "신뢰감", "세련됨", "냉철함"],
  };
  return traits[colorType] ?? ["매력적", "독특함", "개성있음"];
}
