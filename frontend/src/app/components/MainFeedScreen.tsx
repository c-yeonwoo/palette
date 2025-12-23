import { useState } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Unlock, TrendingUp } from "lucide-react";

interface Profile {
  id: number;
  name: string;
  age: number;
  job: string;
  height: number;
  intro: string;
  photo: string;
  recommender: string;
  isBlurred: boolean;
}

const mockProfiles: Profile[] = [
  {
    id: 1,
    name: "김○○",
    age: 28,
    job: "디자이너",
    height: 168,
    intro: "소소한 일상을 즐기는 사람",
    photo: "https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMHdvbWFufGVufDF8fHx8MTc2NjIzNjE3MHww&ixlib=rb-4.1.0&q=80&w=1080",
    recommender: "박지수",
    isBlurred: true,
  },
  {
    id: 2,
    name: "이○○",
    age: 31,
    job: "마케터",
    height: 175,
    intro: "음악과 여행을 사랑합니다",
    photo: "https://images.unsplash.com/photo-1554765345-6ad6a5417cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMG1hbnxlbnwxfHx8fDE3NjYyMjI3Njl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    recommender: "최민준",
    isBlurred: true,
  },
  {
    id: 3,
    name: "박○○",
    age: 26,
    job: "개발자",
    height: 165,
    intro: "독서와 카페 투어가 취미",
    photo: "https://images.unsplash.com/photo-1760552069572-6a6caeeb82d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBwb3J0cmFpdCUyMHdvbWFuJTIwb3V0ZG9vcnxlbnwxfHx8fDE3NjYyOTY4ODR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    recommender: "정하은",
    isBlurred: true,
  },
  {
    id: 4,
    name: "최○○",
    age: 29,
    job: "컨설턴트",
    height: 178,
    intro: "운동과 맛집 탐방을 좋아해요",
    photo: "https://images.unsplash.com/photo-1764816657425-b3c79b616d14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBwb3J0cmFpdCUyMG1hbiUyMHNtaWxlfGVufDF8fHx8MTc2NjI5Njg4NHww&ixlib=rb-4.1.0&q=80&w=1080",
    recommender: "김서연",
    isBlurred: true,
  },
];

interface MainFeedScreenProps {
  onProfileClick: (profile: Profile) => void;
}

export function MainFeedScreen({ onProfileClick }: MainFeedScreenProps) {
  const [activeTab, setActiveTab] = useState("friends");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-center">Pallete</h2>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border bg-card sticky top-0 z-10">
          <TabsList className="w-full h-14 bg-transparent rounded-none border-none p-0">
            <TabsTrigger
              value="friends"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              내 지인의 지인
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              실시간 인기
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="friends" className="mt-0 p-6">
          <ProfileGrid profiles={mockProfiles} onProfileClick={onProfileClick} />
        </TabsContent>

        <TabsContent value="trending" className="mt-0 p-6">
          <ProfileGrid profiles={mockProfiles} onProfileClick={onProfileClick} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileGrid({
  profiles,
  onProfileClick,
}: {
  profiles: Profile[];
  onProfileClick: (profile: Profile) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {profiles.map((profile) => (
        <ProfileCard
          key={profile.id}
          profile={profile}
          onClick={() => onProfileClick(profile)}
        />
      ))}
    </div>
  );
}

function ProfileCard({ profile, onClick }: { profile: Profile; onClick: () => void }) {
  return (
    <div
      className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Photo with Blur */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={profile.photo}
          alt={profile.name}
          className={`w-full h-full object-cover ${
            profile.isBlurred ? "blur-[20px] scale-110" : ""
          }`}
        />
        {profile.isBlurred && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        )}
        
        {/* Recommender Badge */}
        <div className="absolute top-4 left-4">
          <Badge className="bg-accent text-accent-foreground">
            {profile.recommender}님의 지인
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 space-y-3">
        <div className="space-y-1">
          <h3>
            {profile.name}, {profile.age}
          </h3>
          <p className="text-muted-foreground">
            {profile.job} · {profile.height}cm
          </p>
        </div>

        <p className="text-sm text-foreground/80 line-clamp-2">{profile.intro}</p>

        {/* Unlock Button */}
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <Unlock className="w-4 h-4 mr-2" />
          프로필 열람하기
        </Button>
      </div>
    </div>
  );
}