import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Edit3, Loader2 } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface MyProfileScreenProps {
  onBack: () => void;
}

interface UserProfile {
  userId: string;
  nickname: string;
  accountType: string;
  isProfileCompleted: boolean;
}

export function MyProfileScreen({ onBack }: MyProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get<UserProfile>('/api/v1/auth/me');
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('프로필을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">프로필을 불러올 수 없습니다</p>
          <Button onClick={onBack} variant="outline">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← 뒤로
        </Button>
        <h2 className="text-lg font-semibold">내 프로필</h2>
        <div className="w-16"></div>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
            {profile.nickname.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">{profile.nickname}</h3>
              <Badge variant={profile.isProfileCompleted ? "default" : "secondary"}>
                {profile.isProfileCompleted ? "프로필 완성" : "프로필 미완성"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {profile.accountType === "REGULAR" ? "일반 회원" : "주선자"}
            </p>
          </div>
        </div>

        {/* Profile Completion Notice */}
        {!profile.isProfileCompleted && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Edit3 className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">프로필을 완성해주세요</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  프로필을 완성하면 매칭 서비스를 이용할 수 있습니다
                </p>
                <Button size="sm" className="w-full">
                  프로필 완성하기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Sections */}
        <div className="space-y-4">
          <Section title="기본 정보">
            <EmptyContent message="프로필을 완성하면 정보가 표시됩니다" />
          </Section>

          <Section title="사진">
            <EmptyContent message="사진을 추가해주세요" />
          </Section>

          <Section title="자기소개">
            <EmptyContent message="자기소개를 작성해주세요" />
          </Section>

          <Section title="추천사">
            <EmptyContent message="아직 받은 추천사가 없습니다" />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <h4 className="font-semibold mb-3">{title}</h4>
      {children}
    </div>
  );
}

function EmptyContent({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
