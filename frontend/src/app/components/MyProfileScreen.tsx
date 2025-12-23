import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  Share2, 
  Edit3, 
  MessageSquarePlus, 
  Check, 
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Instagram,
  MessageCircle
} from "lucide-react";

interface MyProfileScreenProps {
  onBack: () => void;
}

interface Testimonial {
  id: string;
  from: string;
  relationship: string;
  content: string;
  isVisible: boolean;
  avatar: string;
}

export function MyProfileScreen({ onBack }: MyProfileScreenProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    {
      id: "1",
      from: "김지은",
      relationship: "대학 동기",
      content: "항상 긍정적이고 배려심 깊은 친구예요. 함께 있으면 편안하고 즐거워요!",
      isVisible: true,
      avatar: "👩",
    },
    {
      id: "2",
      from: "박준호",
      relationship: "회사 동료",
      content: "열정적으로 일하고 팀워크도 좋아요. 믿음직한 사람입니다.",
      isVisible: true,
      avatar: "👨",
    },
    {
      id: "3",
      from: "이서연",
      relationship: "운동 메이트",
      content: "목표를 향해 꾸준히 노력하는 모습이 멋져요. 긍정 에너지가 넘쳐요!",
      isVisible: false,
      avatar: "👧",
    },
  ]);

  const profileData = {
    name: "김민준",
    nickname: "민준이",
    age: 28,
    job: "소프트웨어 엔지니어",
    location: "서울 강남구",
    mbti: "ENFP",
    bio: "테크 스타트업에서 열정적으로 일하는 개발자예요. 평일엔 코드와 씨름하지만, 주말엔 헬스장에서 땀 흘리며 리프레시합니다. 감성적인 영화 한 편과 함께하는 저녁을 사랑해요 🎬",
    interests: ["운동", "영화", "여행", "맛집 탐방"],
    lifestyle: "주말엔 활동적으로! 친구들과 새로운 곳을 탐험하거나 혼자만의 시간을 즐겨요",
    photos: Array(6).fill(null),
  };

  const handleToggleTestimonial = (id: string) => {
    setTestimonials(testimonials.map(t => 
      t.id === id ? { ...t, isVisible: !t.isVisible } : t
    ));
  };

  const handleShare = (platform: string) => {
    const shareUrl = `https://pallete.app/profile/${profileData.nickname}`;
    
    if (platform === "copy") {
      navigator.clipboard.writeText(shareUrl);
      alert("링크가 복사되었습니다!");
    } else if (platform === "instagram") {
      // Instagram sharing logic
      alert("Instagram Story로 공유됩니다");
    } else if (platform === "kakaotalk") {
      // KakaoTalk sharing logic
      alert("카카오톡으로 공유됩니다");
    }
    setShowShareMenu(false);
  };

  const visibleTestimonials = testimonials.filter(t => t.isVisible);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-slate-600">
          ← 뒤로
        </Button>
        <h2 className="text-center flex-1">내 프로필</h2>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Profile Photo Grid */}
        <div className="grid grid-cols-3 gap-3">
          {profileData.photos.map((photo, idx) => (
            <div
              key={idx}
              className="aspect-square bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl border-2 border-pink-200"
            />
          ))}
        </div>

        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl mb-1">{profileData.name}</h3>
              <p className="text-slate-600">@{profileData.nickname}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              편집
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-slate-600">
            <Badge variant="outline" className="border-slate-300">
              {profileData.age}세
            </Badge>
            <Badge variant="outline" className="border-slate-300">
              {profileData.job}
            </Badge>
            <Badge variant="outline" className="border-slate-300">
              {profileData.location}
            </Badge>
            <Badge variant="outline" className="border-slate-300">
              {profileData.mbti}
            </Badge>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h4 className="mb-3">자기소개</h4>
          <p className="text-slate-700 leading-relaxed">{profileData.bio}</p>
        </div>

        {/* Interests */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h4 className="mb-3">관심사</h4>
          <div className="flex flex-wrap gap-2">
            {profileData.interests.map((interest) => (
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
        <div className="bg-card border border-border rounded-2xl p-6">
          <h4 className="mb-3">라이프스타일</h4>
          <p className="text-slate-700 leading-relaxed">{profileData.lifestyle}</p>
        </div>

        {/* Testimonials Section */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="mb-1">친구 추천사</h4>
              <p className="text-sm text-slate-600">
                {visibleTestimonials.length}개 공개 중 · 총 {testimonials.length}개
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTestimonials(!showTestimonials)}
              className="border-pink-300 text-pink-700 hover:bg-pink-50"
            >
              {showTestimonials ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  관리
                </>
              )}
            </Button>
          </div>

          {/* Visible Testimonials */}
          <div className="space-y-3">
            {visibleTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-900">{testimonial.from}</p>
                      <Badge variant="outline" className="text-xs border-pink-300 text-pink-700">
                        {testimonial.relationship}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700">{testimonial.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* All Testimonials Management */}
          {showTestimonials && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h5 className="text-sm text-slate-700 mb-3">모든 추천사 ({testimonials.length}개)</h5>
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className={`border rounded-xl p-4 ${
                    testimonial.isVisible
                      ? "bg-white border-pink-200"
                      : "bg-slate-50 border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl">{testimonial.avatar}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900">{testimonial.from}</p>
                          <Badge variant="outline" className="text-xs">
                            {testimonial.relationship}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700">{testimonial.content}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleTestimonial(testimonial.id)}
                      className={testimonial.isVisible ? "text-green-600" : "text-slate-400"}
                    >
                      {testimonial.isVisible ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Request Testimonial Button */}
          <Button
            variant="outline"
            className="w-full border-2 border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <MessageSquarePlus className="w-5 h-5 mr-2" />
            친구에게 추천사 요청하기
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-400 text-white"
          >
            <Share2 className="w-5 h-5 mr-2" />
            내 프로필 공유하기
          </Button>

          {/* Share Menu */}
          {showShareMenu && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <button
                onClick={() => handleShare("copy")}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Copy className="w-5 h-5 text-slate-600" />
                <span className="text-slate-900">링크 복사</span>
              </button>
              <button
                onClick={() => handleShare("instagram")}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Instagram className="w-5 h-5 text-pink-600" />
                <span className="text-slate-900">Instagram Story로 공유</span>
              </button>
              <button
                onClick={() => handleShare("kakaotalk")}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-amber-500" />
                <span className="text-slate-900">카카오톡으로 공유</span>
              </button>
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-sm text-orange-800">
            🔒 공유된 프로필은 링크를 받은 사람만 볼 수 있어요
          </p>
        </div>
      </div>
    </div>
  );
}
