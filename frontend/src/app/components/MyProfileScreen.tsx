import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Edit3, Loader2, Settings, LogOut } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { authService } from "../../lib/auth/authService";
import { toast } from "sonner";
import { MatchmakerProfileScreen } from "./MatchmakerProfileScreen";

interface MyProfileScreenProps {
  onBack: () => void;
  onEdit: () => void;
  onConvertToRegular: () => void;
}

interface UserProfile {
  userId: string;
  nickname: string;
  accountType: string;
  isProfileCompleted: boolean;
}

interface ProfileData {
  id: string;
  userId: string;
  basicInfo: {
    height: number | null;
    bodyType: string | null;
  };
  careerInfo: {
    category: string | null;
    company: string | null;
    position: string | null;
  };
  educationInfo: {
    level: string | null;
    school: string | null;
    major: string | null;
  };
  locationInfo: {
    sido: string | null;
    sigungu: string | null;
    hometownSido: string | null;
    hometownSigungu: string | null;
  };
  lifestyleInfo: {
    smoking: string | null;
    drinking: string | null;
    religion: string | null;
  };
  introduction: {
    text: string | null;
    interests: string[];
  };
  idealType: {
    ageRange: { min: number; max: number } | null;
    heightRange: { min: number; max: number } | null;
    bodyTypes: string[];
    personalities: string[];
    dateStyle: string | null;
    purpose: string | null;
    dealBreakers: string | null;
  };
  primaryPhotoUrl: string | null;
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastAccessedAt: string;
    deletedAt: string | null;
  };
  metrics: {
    completionRate: number;
    trustScore: number;
    viewCount: number;
  };
  settings: {
    isAcceptingMatches: boolean;
    hiddenAt: string | null;
  };
}

export function MyProfileScreen({ onBack, onEdit, onConvertToRegular }: MyProfileScreenProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await api.get<UserProfile>('/api/v1/auth/me');
        setUserProfile(userData);

        // Only fetch profile for REGULAR users
        if (userData.accountType === "REGULAR") {
          try {
            const profileData = await api.get<ProfileData>('/api/v1/profile');
            setProfile(profileData);
          } catch (error) {
            console.log('No profile found for user');
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('프로필을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSettingsMenu]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('로그아웃되었습니다');
      // Reload to clear state and redirect to login
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('로그아웃에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
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

  // Show MatchmakerProfileScreen for MATCHMAKER_ONLY users
  if (userProfile.accountType === "MATCHMAKER_ONLY") {
    return (
      <MatchmakerProfileScreen
        onBack={onBack}
        onConvertToRegular={onConvertToRegular}
      />
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
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
          >
            <Settings className="w-6 h-6" />
          </Button>

          {/* Settings Dropdown Menu */}
          {showSettingsMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-3 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div>
            {profile?.primaryPhotoUrl ? (
              <img
                src={profile.primaryPhotoUrl}
                alt="프로필 사진"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                {userProfile.nickname.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">{userProfile.nickname}</h3>
              <Badge variant={userProfile.isProfileCompleted ? "default" : "secondary"}>
                {userProfile.isProfileCompleted ? "프로필 완성" : "프로필 미완성"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {userProfile.accountType === "REGULAR" ? "일반 회원" : "주선자"}
            </p>
            {profile && (
              <p className="text-sm text-muted-foreground mt-1">
                프로필 완성도: {profile.metrics.completionRate}%
              </p>
            )}
          </div>
        </div>

        {/* Profile Completion Notice */}
        {!userProfile.isProfileCompleted && (
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
                <Button size="sm" className="w-full" onClick={onEdit}>
                  프로필 완성하기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Sections */}
        <div className="space-y-4">
          <Section title="기본 정보">
            {profile ? (
              <div className="space-y-2 text-sm">
                {profile.basicInfo.height && (
                  <InfoRow label="키" value={`${profile.basicInfo.height}cm`} />
                )}
                {profile.basicInfo.bodyType && (
                  <InfoRow label="체형" value={getBodyTypeLabel(profile.basicInfo.bodyType)} />
                )}
                {profile.careerInfo.company && (
                  <InfoRow label="회사" value={`${profile.careerInfo.company} ${profile.careerInfo.position || ''}`} />
                )}
                {profile.educationInfo.school && (
                  <InfoRow label="학력" value={`${profile.educationInfo.school} ${profile.educationInfo.major || ''}`} />
                )}
                {profile.locationInfo.sido && (
                  <InfoRow label="지역" value={`${profile.locationInfo.sido} ${profile.locationInfo.sigungu || ''}`} />
                )}
              </div>
            ) : (
              <EmptyContent message="프로필을 완성하면 정보가 표시됩니다" />
            )}
          </Section>

          <Section title="사진">
            {profile?.primaryPhotoUrl ? (
              <div className="flex items-center justify-center">
                <img
                  src={profile.primaryPhotoUrl}
                  alt="프로필 사진"
                  className="w-48 h-48 rounded-lg object-cover"
                />
              </div>
            ) : (
              <EmptyContent message="프로필 수정에서 사진을 추가할 수 있습니다" />
            )}
          </Section>

          <Section title="자기소개">
            {profile?.introduction.text ? (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">{profile.introduction.text}</p>
                {profile.introduction.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.introduction.interests.map((interest, idx) => (
                      <Badge key={idx} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <EmptyContent message="자기소개를 작성해주세요" />
            )}
          </Section>

          <Section title="라이프스타일">
            {profile ? (
              <div className="space-y-2 text-sm">
                {profile.lifestyleInfo.smoking && (
                  <InfoRow label="흡연" value={getFrequencyLabel(profile.lifestyleInfo.smoking)} />
                )}
                {profile.lifestyleInfo.drinking && (
                  <InfoRow label="음주" value={getFrequencyLabel(profile.lifestyleInfo.drinking)} />
                )}
                {profile.lifestyleInfo.religion && (
                  <InfoRow label="종교" value={getReligionLabel(profile.lifestyleInfo.religion)} />
                )}
              </div>
            ) : (
              <EmptyContent message="라이프스타일 정보를 입력해주세요" />
            )}
          </Section>

          <Section title="추천사">
            <EmptyContent message="아직 받은 추천사가 없습니다" />
          </Section>
        </div>

        {/* Edit Profile Button */}
        <div className="pt-4 pb-6">
          <Button
            onClick={onEdit}
            className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-400 text-white hover:from-pink-500 hover:to-rose-500"
            size="lg"
          >
            <Edit3 className="w-5 h-5 mr-2" />
            프로필 수정하기
          </Button>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function getBodyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SLIM: "슬림",
    AVERAGE: "보통",
    ATHLETIC: "운동함",
    MUSCULAR: "근육질",
    CURVY: "글래머"
  };
  return labels[type] || type;
}

function getFrequencyLabel(freq: string): string {
  const labels: Record<string, string> = {
    NEVER: "안함",
    SOMETIMES: "가끔",
    OFTEN: "자주"
  };
  return labels[freq] || freq;
}

function getReligionLabel(religion: string): string {
  const labels: Record<string, string> = {
    NONE: "무교",
    CHRISTIANITY: "기독교",
    CATHOLICISM: "천주교",
    BUDDHISM: "불교",
    OTHER: "기타"
  };
  return labels[religion] || religion;
}
