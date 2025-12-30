import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Edit3, Loader2, Settings, LogOut, ExternalLink, Sparkles, CheckCircle2, Share2, Link, AlertCircle, Phone } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { authService } from "../../lib/auth/authService";
import { toast } from "sonner";
import { MatchmakerProfileScreen } from "./MatchmakerProfileScreen";
import PhoneVerificationModal from "./PhoneVerificationModal";

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
  isPhoneVerified: boolean;
}

interface ProfileData {
  id: string;
  userId: string;
  basicInfo: {
    height: number | null;
    bodyType: string | null;
    mbti: string;
  };
  careerInfo: {
    category: string | null;
    company: string | null;
    incomeRange: string | null;
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
    interviewAnswers?: {
      hobby: string | null;
      charm: string | null;
      passion: string | null;
      happiness: string | null;
      motto: string | null;
    } | null;
  };
  idealType: {
    datePreferences: string[];
    importantValues: string[];
    personalities: string[];
    appearanceStyles: string[];
    dealBreakers: string[];
  };
  personalityTests?: Array<{
    link: string;
    title: string;
  }>;
  photos: Array<{
    id: string;
    url: string;
    displayOrder: number;
    isPrimary: boolean;
  }>;
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
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "ideal">("about");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingToggleValue, setPendingToggleValue] = useState(false);
  const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

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

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

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

  const handleToggleAcceptingMatches = (checked: boolean) => {
    setPendingToggleValue(checked);
    setShowConfirmModal(true);
  };

  const confirmToggleAcceptingMatches = async () => {
    try {
      await api.patch('/api/v1/profile/settings', {
        isAcceptingMatches: pendingToggleValue
      });

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          settings: {
            ...profile.settings,
            isAcceptingMatches: pendingToggleValue
          }
        });
      }

      toast.success(pendingToggleValue ? '주선받기가 활성화되었습니다' : '주선받기가 비활성화되었습니다');
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('설정 변경에 실패했습니다');
    }
  };

  const handleCopyLink = async () => {
    if (!profile) return;

    const shareUrl = `${window.location.origin}/profile/${profile.userId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('프로필 링크가 복사되었습니다');
      setShowShareMenu(false);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('링크 복사에 실패했습니다');
    }
  };

  const handleKakaoShare = () => {
    if (!profile || !userProfile) return;

    const shareUrl = `${window.location.origin}/profile/${profile.userId}`;

    // Check if Kakao SDK is loaded
    if (typeof (window as any).Kakao === 'undefined') {
      toast.error('카카오톡 공유 기능을 사용할 수 없습니다');
      return;
    }

    const Kakao = (window as any).Kakao;

    // Initialize Kakao SDK if not initialized
    if (!Kakao.isInitialized()) {
      // TODO: Replace with your actual Kakao JavaScript Key
      Kakao.init('YOUR_KAKAO_JAVASCRIPT_KEY');
    }

    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `${userProfile.nickname}님의 프로필`,
        description: `Palette에서 ${userProfile.nickname}님의 프로필을 확인해보세요`,
        imageUrl: profile.primaryPhotoUrl || 'https://via.placeholder.com/300',
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: '프로필 보기',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    });

    toast.success('카카오톡으로 공유되었습니다');
    setShowShareMenu(false);
  };

  const handlePhoneVerified = async (phoneNumber: string) => {
    try {
      // Refresh user data to get updated isPhoneVerified status
      const userData = await api.get<UserProfile>('/api/v1/auth/me');
      setUserProfile(userData);
      setShowPhoneVerificationModal(false);
      toast.success('핸드폰 인증이 완료되었습니다!');
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      toast.error('사용자 정보를 새로고침하는데 실패했습니다');
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

      {/* Tabs */}
      <div className="bg-card border-b border-border px-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("about")}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === "about"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              내소개
            </button>
            <button
              onClick={() => setActiveTab("ideal")}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === "ideal"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              이상형
            </button>
          </div>
          <div className="relative" ref={shareMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Share2 className="w-5 h-5" />
            </Button>

            {/* Share Menu Tooltip */}
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg p-2 flex gap-2 z-10">
                <button
                  onClick={handleKakaoShare}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  title="카카오톡 공유"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FEE500">
                    <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.442 1.492 4.585 3.773 5.973-.142.53-.92 3.46-.945 3.68-.03.273.099.537.316.649.218.112.486.085.675-.073 0 0 2.216-1.478 3.288-2.186C9.67 18.764 10.814 19 12 19c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" stroke="#000" strokeWidth="0.5"/>
                  </svg>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  title="링크 복사"
                >
                  <Link className="w-6 h-6 text-foreground" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Phone Verification Banner */}
        {userProfile && !userProfile.isPhoneVerified && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-amber-900">
                핸드폰 인증 후에 서비스를 이용하실 수 있습니다
              </p>
              <p className="text-xs text-amber-700">
                안전한 매칭을 위해 본인 인증이 필요합니다
              </p>
            </div>
            <Button
              onClick={() => setShowPhoneVerificationModal(true)}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
            >
              <Phone className="w-4 h-4 mr-1" />
              인증하기
            </Button>
          </div>
        )}

        {/* Profile Header */}
        <div className="flex items-start gap-4">
          <div className="relative">
            {/* Circular Progress Ring */}
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (profile?.metrics.completionRate || 0) / 100)}`}
                className="text-primary transition-all duration-500"
              />
            </svg>

            {/* Profile Photo */}
            <div className="absolute inset-0 flex items-center justify-center p-2">
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

            {/* Completion Badge */}
            {profile?.metrics.completionRate === 100 && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-xl font-bold">{userProfile.nickname}</h3>
              <Badge variant={userProfile.isProfileCompleted ? "default" : "secondary"}>
                {userProfile.isProfileCompleted ? "프로필 완성" : "프로필 미완성"}
              </Badge>
              {profile?.careerInfo.incomeRange &&
               ["INCOME_RANGE_3", "INCOME_RANGE_4", "INCOME_RANGE_5"].includes(profile.careerInfo.incomeRange) && (
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0">
                  고소득
                </Badge>
              )}
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

        {/* About Me Tab Content */}
        {activeTab === "about" && (
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
                {profile.basicInfo.mbti && (
                  <InfoRow label="MBTI" value={profile.basicInfo.mbti} />
                )}
                {profile.careerInfo.company && (
                  <InfoRow label="직장" value={profile.careerInfo.company} />
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
            {profile?.photos && profile.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {profile.photos
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map((photo, index) => (
                    <div key={photo.id} className="relative aspect-square">
                      <img
                        src={photo.url}
                        alt={`프로필 사진 ${index + 1}`}
                        className="w-full h-full rounded-lg object-cover"
                      />
                      {photo.isPrimary && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                          대표
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <EmptyContent message="프로필 수정에서 사진을 추가할 수 있습니다" />
            )}
          </Section>

          <Section title="자기소개">
            {profile?.introduction.interviewAnswers ? (
              <div className="space-y-4">
                {profile.introduction.interviewAnswers.hobby && (
                  <InterviewAnswer
                    question="쉬는 날엔 주로 이렇게 시간을 보내요"
                    answer={profile.introduction.interviewAnswers.hobby}
                  />
                )}
                {profile.introduction.interviewAnswers.charm && (
                  <InterviewAnswer
                    question="제 매력 포인트는 바로 이거!"
                    answer={profile.introduction.interviewAnswers.charm}
                  />
                )}
                {profile.introduction.interviewAnswers.passion && (
                  <InterviewAnswer
                    question="요즘 제가 푹 빠져있는 것"
                    answer={profile.introduction.interviewAnswers.passion}
                  />
                )}
                {profile.introduction.interviewAnswers.happiness && (
                  <InterviewAnswer
                    question="저는 이럴 때 행복해요"
                    answer={profile.introduction.interviewAnswers.happiness}
                  />
                )}
                {profile.introduction.interviewAnswers.motto && (
                  <InterviewAnswer
                    question="제 인생의 좌우명은"
                    answer={profile.introduction.interviewAnswers.motto}
                  />
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

          {/* Personality Tests */}
          {profile?.personalityTests && profile.personalityTests.length > 0 && (
            <Section title="나는 이런 사람이에요">
              <div className="flex flex-wrap gap-2">
                {profile.personalityTests.map((test, index) => (
                  <a
                    key={index}
                    href={test.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-full px-4 py-2 text-sm font-medium text-purple-900 hover:text-purple-700 hover:border-purple-300 transition-colors"
                  >
                    {test.title}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Settings Section - 주선받기 */}
          {userProfile?.accountType === "REGULAR" && profile && (
            <Section title="설정">
              <div className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">주선받기</p>
                </div>
                <Switch
                  checked={profile.settings.isAcceptingMatches}
                  onCheckedChange={handleToggleAcceptingMatches}
                />
              </div>
            </Section>
          )}
          </div>
        )}

        {/* Ideal Type Tab Content */}
        {activeTab === "ideal" && (
          <div className="space-y-4">
            <Section title="Q1. 연인과 어떤 데이트를 선호하시나요?">
              {profile?.idealType.datePreferences && profile.idealType.datePreferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.datePreferences.map((pref, idx) => (
                    <Badge key={idx} variant="secondary">
                      {getDatePreferenceLabel(pref)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="데이트 선호도를 설정해주세요" />
              )}
            </Section>

            <Section title="Q2. 중요하게 보는 세 가지는?">
              {profile?.idealType.importantValues && profile.idealType.importantValues.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.importantValues.map((value, idx) => (
                    <Badge key={idx} variant="secondary">
                      {getImportantValueLabel(value)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="중요하게 보는 가치를 선택해주세요" />
              )}
            </Section>

            <Section title="Q3. 어떤 성격의 사람을 선호하시나요?">
              {profile?.idealType.personalities && profile.idealType.personalities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.personalities.map((personality, idx) => (
                    <Badge key={idx} variant="secondary">
                      {personality}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="선호하는 성격을 선택해주세요" />
              )}
            </Section>

            <Section title="Q4. 선호하는 외모 스타일은?">
              {profile?.idealType.appearanceStyles && profile.idealType.appearanceStyles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.appearanceStyles.map((style, idx) => (
                    <Badge key={idx} variant="secondary">
                      {getAppearanceStyleLabel(style)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="선호하는 외모 스타일을 선택해주세요" />
              )}
            </Section>

            <Section title="Q5. 절대 안되는 것들은?">
              {profile?.idealType.dealBreakers && profile.idealType.dealBreakers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.dealBreakers.map((dealBreaker) => (
                    <Badge key={dealBreaker} variant="outline" className="text-sm">
                      {getDealBreakerLabel(dealBreaker)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="절대 안되는 것들을 선택해주세요" />
              )}
            </Section>
          </div>
        )}

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

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingToggleValue ? '주선받기 활성화' : '주선받기 비활성화'}
            </DialogTitle>
            <DialogDescription>
              {pendingToggleValue
                ? '내 프로필이 노출됩니다. 단, 내 친구는 내 프로필을 볼 수 없습니다.'
                : '내 프로필이 더 이상 노출되지 않습니다.'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              취소
            </Button>
            <Button
              onClick={confirmToggleAcceptingMatches}
              className="bg-gradient-to-r from-pink-400 to-rose-400"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerificationModal}
        onClose={() => setShowPhoneVerificationModal(false)}
        onVerified={handlePhoneVerified}
        userId={userProfile?.userId}
        initialPhoneNumber={userProfile?.isPhoneVerified ? undefined : undefined}
      />
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

function InterviewAnswer({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="space-y-2 pb-3 border-b border-border/50 last:border-0">
      <p className="text-sm font-medium text-primary">{question}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{answer}</p>
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

function getDatePreferenceLabel(pref: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "액티브한 데이트",
    INDOOR: "인도어 데이트",
    CULTURE: "문화 데이트",
    NATURE: "자연 데이트"
  };
  return labels[pref] || pref;
}

function getImportantValueLabel(value: string): string {
  const labels: Record<string, string> = {
    PERSONALITY: "성격/성향",
    APPEARANCE: "외모",
    EDUCATION: "학력",
    CAREER: "능력/커리어",
    FAMILY: "집안/가족",
    JOB: "직업",
    WEALTH: "경제력",
    VALUES: "가치관"
  };
  return labels[value] || value;
}

function getAppearanceStyleLabel(style: string): string {
  const labels: Record<string, string> = {
    // 남자 스타일
    PUPPY: "강아지상",
    CAT: "고양이상",
    STUDENT_COUNCIL: "전교회장상",
    ATHLETIC: "체대상",
    NERD: "너드상",
    TOFU: "두부상",
    ARAB: "아랍상",
    DINOSAUR: "공룡상",
    // 여자 스타일
    RABBIT: "토끼상",
    FOX: "여우상",
    DEER: "사슴상",
    SOFT_TOFU: "순두부상",
    BOSS: "일진상",
    MOTHER_IN_LAW_APPROVED: "상견례입구컷상"
  };
  return labels[style] || style;
}

function getDealBreakerLabel(dealBreaker: string): string {
  const labels: Record<string, string> = {
    SMOKING: "흡연자",
    HEAVY_DRINKING: "과음하는 사람",
    DISLIKES_PETS: "반려동물을 싫어하는 사람",
    LONG_DISTANCE: "장거리 연애",
    DIFFERENT_RELIGION: "종교가 다른 사람",
    NO_MARRIAGE_PLAN: "결혼 의사가 없는 사람",
    CHILDREN_PLAN: "자녀 계획이 맞지 않는 사람",
    UNSTABLE_JOB: "직업이 불안정한 사람",
    CONTACTS_EX: "전 연인과 연락하는 사람",
    LARGE_AGE_GAP: "나이 차이가 많이 나는 사람"
  };
  return labels[dealBreaker] || dealBreaker;
}

