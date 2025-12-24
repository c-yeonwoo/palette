import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, Camera, UserPlus, Loader2, Settings, LogOut } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { authService } from "../../lib/auth/authService";
import { toast } from "sonner";

interface MatchmakerProfileScreenProps {
  onBack: () => void;
  onConvertToRegular: () => void;
}

interface UserProfile {
  userId: string;
  nickname: string;
  accountType: string;
  isProfileCompleted: boolean;
}

interface MatchmakerData {
  matchmakerId: string;
  level: number;
  totalPoints: number;
  successfulMatches: number;
  successRate: number;
  profilePhotoUrl: string | null;
}

export function MatchmakerProfileScreen({ onBack, onConvertToRegular }: MatchmakerProfileScreenProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [matchmakerData, setMatchmakerData] = useState<MatchmakerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await api.get<UserProfile>('/api/v1/auth/me');
        setUserProfile(userData);

        try {
          const matchmaker = await api.get<MatchmakerData>('/api/v1/matchmakers/me');
          setMatchmakerData(matchmaker);
        } catch (error) {
          // Matchmaker data not found, that's ok
          console.log('No matchmaker data found');
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

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }

    // 파일 크기 검증 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8080/api/v1/matchmakers/me/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // 프로필 데이터 다시 불러오기
      const updatedMatchmaker = await api.get<MatchmakerData>('/api/v1/matchmakers/me');
      setMatchmakerData(updatedMatchmaker);

      toast.success('프로필 사진이 업로드되었습니다');
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('사진 업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between relative">
          <button
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold mx-auto">주선자 프로필</h2>
          <div className="absolute right-0 top-1/2 -translate-y-1/2" ref={menuRef}>
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
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            {matchmakerData?.profilePhotoUrl ? (
              <img
                src={matchmakerData.profilePhotoUrl}
                alt="프로필 사진"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                {userProfile.nickname.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              onClick={handlePhotoUpload}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">{userProfile.nickname}</h3>
              <Badge variant="secondary">주선자</Badge>
            </div>
            {matchmakerData && (
              <>
                <p className="text-sm text-muted-foreground">
                  레벨 {matchmakerData.level} · 누적 포인트 {matchmakerData.totalPoints.toLocaleString()}P
                </p>
                <p className="text-sm text-muted-foreground">
                  성공 매칭 {matchmakerData.successfulMatches}회 · 성공률 {Math.round(matchmakerData.successRate * 100)}%
                </p>
              </>
            )}
          </div>
        </div>

        {/* Photo Upload Guidance */}
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            💡 프로필 사진 상단의 카메라 아이콘을 눌러 사진을 업로드하세요. 주선자는 프로필 사진만 관리할 수 있으며, 일반 회원으로 전환하면 전체 프로필을 작성할 수 있습니다.
          </p>
        </div>

        {/* Convert to Regular User */}
        <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">일반 회원으로 전환하기</h3>
              <p className="text-sm text-muted-foreground mb-4">
                일반 회원으로 전환하면 상세한 프로필을 작성하고 매칭 서비스를 이용할 수 있습니다. 주선자 기능은 계속 사용 가능합니다.
              </p>
              <Button onClick={onConvertToRegular} className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                일반 회원으로 전환
              </Button>
            </div>
          </div>
        </div>

        {/* Matchmaker Info */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="font-semibold mb-4">주선자 정보</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">계정 타입</span>
              <span className="font-medium">주선자 전용</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">프로필 상태</span>
              <Badge variant="secondary">주선자 모드</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">매칭 서비스</span>
              <span className="text-muted-foreground">일반 회원 전환 후 이용 가능</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
