import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { TrendingUp } from "lucide-react";

interface MainFeedScreenProps {
  onProfileClick?: (profile: any) => void;
}

export function MainFeedScreen({ onProfileClick }: MainFeedScreenProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-center text-xl font-semibold">Pallete</h2>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="friends" className="w-full">
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
          <EmptyState
            title="아직 추천받은 프로필이 없어요"
            description="지인에게 주선을 요청하거나, 프로필을 완성하면 매칭이 시작됩니다"
          />
        </TabsContent>

        <TabsContent value="trending" className="mt-0 p-6">
          <EmptyState
            title="실시간 인기 프로필"
            description="곧 많은 사람들이 관심을 가진 프로필을 볼 수 있어요"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{description}</p>
    </div>
  );
}
