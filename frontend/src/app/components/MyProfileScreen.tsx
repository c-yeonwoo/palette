import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import {
  Edit3, Loader2,
  ExternalLink, CheckCircle2, Share2, Link,
  AlertCircle, Eye, ChevronRight,
} from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { MatchmakerProfileScreen } from "./MatchmakerProfileScreen";
import NiceVerificationModal from "./NiceVerificationModal";
import { ProfileDiscoveryDeck } from "./profile/ProfileDiscoveryDeck";
import { ProfilePhotoEssay } from "./profile/ProfilePhotoEssay";
import { ProfileMagazineShell } from "./profile/ProfileMagazineShell";
import { ProfileMagazineHeader } from "./profile/ProfileMagazineHeader";
import { ProfileMagazineHero } from "./profile/ProfileMagazineHero";
import { ProfileDetailsCollapsible } from "./profile/ProfileDetailsCollapsible";
import { ProfileIdealTypeSummary } from "./profile/ProfileIdealTypeSummary";
import { buildHeroSpecLine } from "../../lib/profileEssay";
import { jobCategoryLabel } from "../../lib/jobCategory";

interface MyProfileScreenProps {
  onBack: () => void;
  onEdit: () => void;
  onConvertToRegular: () => void;
  onNavigateToColor?: () => void;
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
    workSido: string | null;
    workSigungu: string | null;
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
    datingStyle?: Record<string, string>;
  };
  idealType: {
    datePreferences: string[];
    importantValues: string[];
    personalities: string[];
    appearanceStyles: string[];
    dealBreakers: string[];
    bucketList?: string[];
    // DA-001 — 선호 나이·키 범위
    ageMin?: number | null;
    ageMax?: number | null;
    heightMin?: number | null;
    heightMax?: number | null;
  };
  personalityTests?: Array<{ link: string; title: string }>;
  attachmentProfile?: {
    contactAnxiety: number;
    intimacyAvoidance: number;
    conflictStyle: number;
    emotionExpression: number;
    independenceLevel: number;
    attachmentType?: string;
    attachmentTypeLabel?: string;
    attachmentTypeDescription?: string;
    attachmentTypeEmoji?: string;
  } | null;
  photos: Array<{ id: string; url: string; displayOrder: number; isPrimary: boolean }>;
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
  colorType: {
    type: string | null;
    key: string | null;
    name: string | null;
    hex: string | null;
    description: string | null;
    personalitySummary?: string | null;
    idealTypeInsight?: string | null;
    strengths?: string[] | null;
  } | null;
  vouches?: Array<{ message: string }>;
}

export function MyProfileScreen({ onBack, onEdit, onConvertToRegular, onNavigateToColor }: MyProfileScreenProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);
  const [showCompletionChecklist, setShowCompletionChecklist] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await api.get<UserProfile>('/api/v1/auth/me');
        setUserProfile(userData);
        if (userData.accountType === "REGULAR") {
          try {
            const profileData = await api.get<ProfileData>('/api/v1/profile');
            setProfile(profileData);
          } catch {
            console.log('No profile found for user');
          }
        }
      } catch {
        toast.error('프로필을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) setShowShareMenu(false);
    };
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showShareMenu]);

  const handleCopyLink = async () => {
    if (!profile) return;
    try {
      let shareUrl: string;
      try {
        const linkData = await api.post<{ code: string; shareUrl: string }>(
          '/api/v1/share/link', { expiry: 'unlimited' }
        );
        shareUrl = linkData.shareUrl;
      } catch {
        shareUrl = `${window.location.origin}/profile/${profile.userId}`;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success('링크가 복사됐어요');
      setShowShareMenu(false);
    } catch {
      toast.error('링크 복사에 실패했습니다');
    }
  };

  const handleKakaoShare = () => {
    if (!profile || !userProfile) return;
    const shareUrl = `${window.location.origin}/profile/${profile.userId}`;
    if (typeof (window as any).Kakao === 'undefined') {
      toast.error('카카오톡 공유를 사용할 수 없습니다');
      return;
    }
    const Kakao = (window as any).Kakao;
    if (!Kakao.isInitialized()) Kakao.init(import.meta.env.VITE_KAKAO_JS_KEY ?? '');
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `${userProfile.nickname}님의 프로필`,
        description: `팔레트에서 확인해보세요`,
        imageUrl: profile.primaryPhotoUrl || 'https://via.placeholder.com/300',
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [{ title: '프로필 보기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
    });
    setShowShareMenu(false);
  };

  const handlePhoneVerified = async (_phoneNumber: string, _name: string) => {
    try {
      const userData = await api.get<UserProfile>('/api/v1/auth/me');
      setUserProfile(userData);
      setShowPhoneVerificationModal(false);
      toast.success('본인인증이 완료되었습니다');
    } catch {
      toast.error('정보를 새로고침하는데 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">프로필을 불러올 수 없습니다</p>
          <Button onClick={onBack} variant="outline" size="sm">돌아가기</Button>
        </div>
      </div>
    );
  }

  if (userProfile.accountType === "MATCHMAKER_ONLY") {
    return <MatchmakerProfileScreen onBack={onBack} onConvertToRegular={onConvertToRegular} />;
  }

  const accentColor = profile?.colorType?.hex ?? null;
  const sortedPhotos = profile?.photos.slice().sort((a, b) => a.displayOrder - b.displayOrder) ?? [];
  const heroSpecLine = profile ? buildHeroSpecLine(profile, jobCategoryLabel) : "";

  const completionRing = profile ? (
    <button
      type="button"
      onClick={() => setShowCompletionChecklist(true)}
      className="flex-shrink-0 flex flex-col items-center gap-0.5"
      aria-label="프로필 완성도"
    >
      <div className="relative w-11 h-11">
        <svg className="absolute inset-0 w-11 h-11 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="19" fill="none" strokeWidth="3" stroke="rgba(255,255,255,0.25)" />
          <circle
            cx="22" cy="22" r="19" fill="none" strokeWidth="3"
            stroke="white" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 19}`}
            strokeDashoffset={`${2 * Math.PI * 19 * (1 - profile.metrics.completionRate / 100)}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{profile.metrics.completionRate}%</span>
        </div>
      </div>
    </button>
  ) : null;

  return (
    <ProfileMagazineShell
      accentColor={accentColor}
      bottomBar={(
        <div className="sticky bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-20">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={onEdit}
              className="w-full h-14 rounded-2xl font-semibold bg-brand-soft text-brand-strong hover:bg-brand-soft/90"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              프로필 수정하기
            </Button>
          </div>
        </div>
      )}
    >
      <ProfileMagazineHeader
        title="내 프로필"
        onBack={onBack}
        accentColor={accentColor}
        rightSlot={(
          <div className="relative" ref={shareMenuRef}>
            <button
              type="button"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              공유
            </button>
            {showShareMenu && (
              <div className="absolute right-0 top-11 bg-card border border-border rounded-xl shadow-lg p-2 flex gap-1 z-30">
                <button type="button" onClick={handleKakaoShare} className="p-2 hover:bg-muted rounded-lg" title="카카오톡">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FEE500">
                    <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.442 1.492 4.585 3.773 5.973-.142.53-.92 3.46-.945 3.68-.03.273.099.537.316.649.218.112.486.085.675-.073 0 0 2.216-1.478 3.288-2.186C9.67 18.764 10.814 19 12 19c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" stroke="#000" strokeWidth="0.5" />
                  </svg>
                </button>
                <button type="button" onClick={handleCopyLink} className="p-2 hover:bg-muted rounded-lg" title="링크 복사">
                  <Link className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
        )}
      />

      <ProfileMagazineHero
        nickname={userProfile.nickname}
        heroSpecLine={heroSpecLine}
        colorType={profile?.colorType}
        primaryPhotoUrl={sortedPhotos[0]?.url ?? null}
        emptyAction={{ label: "사진 추가하기", onClick: onEdit }}
        trailingOverlay={completionRing}
      />

      {profile && profile.metrics.viewCount > 0 && (
        <div
          className="mx-4 mt-4 flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ backgroundColor: accentColor ? `${accentColor}14` : "hsl(var(--muted))" }}
        >
          <Eye className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
          <p className="text-[13px] text-foreground">
            <span className="font-semibold">{profile.metrics.viewCount}명</span>
            <span className="text-muted-foreground">이 내 프로필을 봤어요</span>
          </p>
        </div>
      )}

      {!userProfile.isPhoneVerified && (
        <button
          type="button"
          onClick={() => setShowPhoneVerificationModal(true)}
          className="mx-4 mt-3 w-[calc(100%-2rem)] flex items-center gap-3 rounded-xl px-4 py-3 bg-amber-50 border border-amber-100 text-left"
        >
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 flex-1">핸드폰 인증이 필요해요</p>
          <ChevronRight className="w-4 h-4 text-amber-500" />
        </button>
      )}

      {profile && (
        <ProfileDiscoveryDeck
          profile={profile}
          targetUserId={profile.userId}
          mutualFriends={[]}
          isSelf
        />
      )}

      {profile && (
        <div className="p-6 space-y-6">
          <ProfilePhotoEssay
            introText={profile.introduction.text}
            interviewAnswers={profile.introduction.interviewAnswers}
            extraPhotos={sortedPhotos.slice(1)}
            accentColor={accentColor}
          />

          {profile.vouches && profile.vouches.length > 0 && (
            <div
              className="rounded-xl p-4 border"
              style={{
                backgroundColor: accentColor ? `${accentColor}10` : "hsl(var(--muted))",
                borderColor: accentColor ? `${accentColor}25` : "hsl(var(--border))",
              }}
            >
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">친구 추천사</p>
              <div className="space-y-2">
                {profile.vouches.map((v, i) => (
                  <p key={i} className="text-sm text-foreground leading-relaxed">
                    "{v.message}"
                  </p>
                ))}
              </div>
            </div>
          )}

          {profile.personalityTests && profile.personalityTests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.personalityTests.map((test, i) => (
                <a
                  key={i}
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
          )}

          <ProfileDetailsCollapsible
            profile={profile}
            open={detailsExpanded}
            onOpenChange={setDetailsExpanded}
          />

          <ProfileIdealTypeSummary idealType={profile.idealType} />
        </div>
      )}

      <NiceVerificationModal
        isOpen={showPhoneVerificationModal}
        onClose={() => setShowPhoneVerificationModal(false)}
        onVerified={handlePhoneVerified}
      />

      {showCompletionChecklist && profile && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          onClick={() => setShowCompletionChecklist(false)}
        >
          <div className="absolute inset-0 bg-black/40 animate-fade-in" />
          <div
            className="relative bg-card rounded-t-3xl flex flex-col w-full animate-slide-up"
            style={{ maxHeight: "82dvh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── 헤더 (고정) ── */}
            <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-border">
              <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">프로필 완성도</h3>
                <span className="text-2xl font-bold text-primary">{profile.metrics.completionRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">완성도가 높을수록 더 잘 맞는 인연을 정밀하게 추천해드려요</p>
              <div className="w-full h-2 bg-muted rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${profile.metrics.completionRate}%` }}
                />
              </div>
            </div>

            {/* ── 체크리스트 (스크롤) ── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
              {buildCompletionChecklist(profile, userProfile!).map((item) => (
                <div
                  key={item.key}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                    item.done ? "border-primary/20 bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? "bg-primary" : "bg-muted"
                  }`}>
                    {item.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${item.done ? "text-foreground line-through opacity-60" : "text-foreground"}`}>
                        {item.label}
                      </p>
                      <span className={`text-xs font-semibold flex-shrink-0 ${item.done ? "text-primary/60" : "text-primary"}`}>
                        +{item.points}%
                      </span>
                    </div>
                    {!item.done && item.hint && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.hint}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── CTA (고정) ── */}
            {profile.metrics.completionRate < 100 && (
              <div className="flex-shrink-0 px-6 pt-3 pb-8 border-t border-border bg-card">
                <Button
                  className="w-full h-12"
                  onClick={() => { setShowCompletionChecklist(false); onEdit(); }}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  프로필 채우러 가기
                </Button>
              </div>
            )}
            {profile.metrics.completionRate === 100 && (
              <div className="flex-shrink-0 px-6 pt-3 pb-8" />
            )}
          </div>
        </div>
      )}
    </ProfileMagazineShell>
  );
}

interface ChecklistItem {
  key: string;
  label: string;
  hint?: string;
  points: number;
  done: boolean;
}

function buildCompletionChecklist(profile: ProfileData, user: UserProfile): ChecklistItem[] {
  return [
    {
      key: "photo",
      label: "사진 등록",
      hint: "사진을 최소 1장 등록해주세요. 매칭 확률이 올라가요!",
      points: 20,
      done: profile.photos.length > 0,
    },
    {
      key: "introduction",
      label: "자기소개 작성",
      hint: "나를 표현하는 글을 작성해보세요",
      points: 15,
      done: !!(profile.introduction.text && profile.introduction.text.length > 10),
    },
    {
      key: "colorType",
      label: "AI 색깔 타입 분석",
      hint: "AI 인터뷰로 나만의 색깔을 찾아보세요",
      points: 15,
      done: !!(profile.colorType?.type),
    },
    {
      key: "phone",
      label: "핸드폰 인증",
      hint: "인증하면 인증 뱃지가 표시돼요",
      points: 15,
      done: user.isPhoneVerified,
    },
    {
      key: "idealType",
      label: "이상형 설정",
      hint: "어떤 사람을 원하는지 알려주세요",
      points: 10,
      done: (profile.idealType.personalities?.length ?? 0) > 0 ||
            (profile.idealType.datePreferences?.length ?? 0) > 0,
    },
    {
      key: "interests",
      label: "관심사/취미 등록",
      hint: "공통 관심사가 있으면 매칭 확률이 올라가요",
      points: 10,
      done: (profile.introduction.interests?.length ?? 0) > 0,
    },
    {
      key: "career",
      label: "직장 또는 학교 입력",
      hint: "선택 사항이지만 추천 정확도가 올라가요",
      points: 10,
      done: !!(profile.careerInfo.company || profile.educationInfo.school),
    },
    {
      key: "lifestyle",
      label: "라이프스타일 입력",
      hint: "흡연·음주·종교 정보를 입력해주세요",
      points: 5,
      done: !!(profile.lifestyleInfo.smoking || profile.lifestyleInfo.drinking),
    },
  ].sort((a, b) => Number(a.done) - Number(b.done)); // incomplete first
}
