import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronLeft, X, Heart, Send, Quote } from "lucide-react";

interface Profile {
  id: number;
  name: string;
  age: number;
  job: string;
  height: number;
  mbti?: string;
  intro: string;
  photo: string;
  recommender: string;
  isBlurred: boolean;
  photos?: string[];
  values?: Record<string, string | string[]>;
  recommenderNote?: string;
  highIncome?: boolean; // INCOME_RANGE_3 이상 (7500만원 이상)
}

interface ProfileDetailScreenProps {
  profile: Profile;
  onBack: () => void;
  onPass: () => void;
  onLike: () => void;
}

export function ProfileDetailScreen({
  profile,
  onBack,
  onPass,
  onLike,
}: ProfileDetailScreenProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = profile.photos || [profile.photo];

  // Mock detailed values
  const detailedValues = {
    "주말에는 주로...": ["외출하기", "친구 만나기"],
    "나의 연락 스타일은...": ["생각하고 답장", "문자 선호"],
    "못 먹는 음식은...": "고수, 파",
    "이상형의 성격은...": ["유머러스", "자상함"],
    "중요하게 생각하는 것은...": ["가치관", "성격"],
  };

  const recommenderNote =
    "정말 좋은 친구예요. 함께 있으면 편안하고, 센스있고 배려심이 깊습니다. 진지한 만남을 원하시는 분께 추천합니다!";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="mr-2"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h3>프로필</h3>
        </div>
      </div>

      {/* Photo Carousel */}
      <div className="relative">
        <div className="aspect-[3/4] bg-muted overflow-hidden">
          <img
            src={photos[currentPhotoIndex]}
            alt={`${profile.name} - Photo ${currentPhotoIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Photo Indicators */}
        {photos.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 px-4">
            {photos.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index === currentPhotoIndex ? "bg-white" : "bg-white/40"
                }`}
                onClick={() => setCurrentPhotoIndex(index)}
              />
            ))}
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1>
                  {profile.name}, {profile.age}
                </h1>
                {profile.highIncome && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 text-xs">
                    고소득
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                {profile.job} · {profile.height}cm{profile.mbti ? ` · ${profile.mbti}` : ''}
              </p>
            </div>
          </div>
          <p className="text-foreground/90">{profile.intro}</p>
        </div>

        {/* Recommender Note */}
        <div className="bg-accent/10 border border-accent/30 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-accent" />
            <Badge className="bg-accent text-accent-foreground">
              {profile.recommender}님의 추천
            </Badge>
          </div>
          <p className="text-sm text-foreground/90 italic leading-relaxed">
            "{recommenderNote}"
          </p>
        </div>

        {/* Values & Interview */}
        <div className="space-y-4">
          <h3>가치관 & 성향</h3>
          <div className="space-y-4">
            {Object.entries(detailedValues).map(([question, answer]) => (
              <div key={question} className="bg-card rounded-xl p-5 border border-border">
                <p className="text-sm text-muted-foreground mb-3">{question}</p>
                {Array.isArray(answer) ? (
                  <div className="flex flex-wrap gap-2">
                    {answer.map((item) => (
                      <Badge key={item} variant="secondary" className="bg-primary/10 text-primary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground">{answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ideal Type Section */}
        <div className="bg-card rounded-2xl p-6 border border-border space-y-3">
          <h3>이상형</h3>
          <p className="text-muted-foreground">
            유머 감각이 있고 대화가 잘 통하는 분, 서로의 시간을 존중해줄 수 있는 분을 선호합니다.
          </p>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-20">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-14 border-2 hover:bg-destructive/10 hover:border-destructive/50"
            onClick={onPass}
          >
            <X className="w-5 h-5 mr-2" />
            거절하기
          </Button>
          <Button
            size="lg"
            className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onLike}
          >
            <Send className="w-5 h-5 mr-2" />
            주선 요청하기
          </Button>
        </div>
      </div>
    </div>
  );
}
