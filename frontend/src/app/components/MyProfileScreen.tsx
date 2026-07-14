import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  Edit3, Loader2, ChevronLeft, ChevronDown,
  ExternalLink, CheckCircle2, Share2, Link,
  AlertCircle, Phone, Eye, ChevronRight, Camera, Plus,
} from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { MatchmakerProfileScreen } from "./MatchmakerProfileScreen";
import NiceVerificationModal from "./NiceVerificationModal";
import { CategoryCard } from "./profile/CategoryCard";
import { ProfileDiscoveryDeck } from "./profile/ProfileDiscoveryDeck";
import { ProfilePhotoEssay } from "./profile/ProfilePhotoEssay";
import { buildHeroSpecLine } from "../../lib/profileEssay";
import { PROFILE_GROUPS, toProfileValues } from "../../lib/profileSchema";
import {
  DATING_STYLE_QUESTION_LABELS,
  DATING_STYLE_OPTION_LABELS,
} from "../../lib/datingStyleLabels";
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

  const idealSummaryChips = profile
    ? [
        ...profile.idealType.appearanceStyles?.map(getAppearanceStyleLabel) ?? [],
        ...profile.idealType.personalities ?? [],
        ...profile.idealType.datePreferences?.map(getDatePreferenceLabel) ?? [],
        ...profile.idealType.importantValues?.map(getImportantValueLabel) ?? [],
        ...profile.idealType.bucketList?.map(getBucketLabel) ?? [],
      ].filter(Boolean).slice(0, 8)
    : [];

  return (
    <div
      className="min-h-screen pb-32"
      style={accentColor
        ? { backgroundColor: "#ffffff", backgroundImage: `linear-gradient(180deg, ${accentColor}26 0%, ${accentColor}12 360px, ${accentColor}0A 100%)` }
        : { backgroundColor: "var(--background)" }
      }
    >

      {/* ── 대표사진 히어로 ── */}
      <div className="relative" style={{ height: 420 }}>
        {/* 대표사진 or 빈 플레이스홀더 */}
        {sortedPhotos.length > 0 ? (
          <img
            src={sortedPhotos[0].url}
            alt="대표사진"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted via-muted/80 to-accent/20 flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center shadow-sm">
              <Camera className="w-9 h-9 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground/80">사진을 추가해보세요</p>
              <p className="text-xs text-muted-foreground">사진이 있으면 매칭 확률이 3배 높아져요</p>
            </div>
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 bg-brand-soft text-brand-strong text-sm font-semibold px-5 py-2.5 rounded-full shadow-md"
            >
              <Plus className="w-4 h-4" />
              사진 추가하기
            </button>
          </div>
        )}

        {/* 상하단 그라데이션 오버레이 */}
        {sortedPhotos.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/65 pointer-events-none" />
        )}

        {/* 상단 네비 */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12 z-10">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative" ref={shareMenuRef}>
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
              >
                <Share2 className="w-4 h-4 text-white" />
              </button>
              {showShareMenu && (
                <div className="absolute right-0 top-11 bg-card border border-border rounded-xl shadow-lg p-2 flex gap-1 z-30">
                  <button onClick={handleKakaoShare} className="p-2 hover:bg-muted rounded-lg" title="카카오톡">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FEE500">
                      <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.442 1.492 4.585 3.773 5.973-.142.53-.92 3.46-.945 3.68-.03.273.099.537.316.649.218.112.486.085.675-.073 0 0 2.216-1.478 3.288-2.186C9.67 18.764 10.814 19 12 19c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" stroke="#000" strokeWidth="0.5" />
                    </svg>
                  </button>
                  <button onClick={handleCopyLink} className="p-2 hover:bg-muted rounded-lg" title="링크 복사">
                    <Link className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 이름 + 스펙라인 오버레이 */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              {profile?.colorType?.name && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 mb-2">
                  {accentColor && (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                  <span className="text-xs font-medium" style={{ color: accentColor ?? "#333" }}>
                    {profile.colorType.name}
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-white drop-shadow-sm tracking-tight leading-tight">
                {userProfile.nickname}
              </h3>
              {heroSpecLine && (
                <p className="text-sm text-white/95 mt-1 font-medium tracking-tight">{heroSpecLine}</p>
              )}
              {profile?.colorType?.description && (
                <p className="text-sm text-white/80 mt-1.5 leading-snug line-clamp-2">
                  {profile.colorType.description}
                </p>
              )}
            </div>
            {/* 완성도 링 (우하단) */}
            {profile && (
              <button
                onClick={() => setShowCompletionChecklist(true)}
                className="flex-shrink-0 flex flex-col items-center gap-0.5"
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
                <span className="text-xs text-white/70">완성도</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 추가 사진은 아래 '이야기'에 인터리브로 노출 (남이 보는 화면과 동일한 서사). 관리는 프로필 수정에서. */}

      {/* ── Stats ── */}
      {profile && (
        <div className="flex items-center justify-center border-b border-border">
          <div className="flex items-center py-4 gap-1.5">
            <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">{profile.metrics.viewCount}</span>
            <span className="text-xs text-muted-foreground">명이 내 프로필을 봤어요</span>
          </div>
        </div>
      )}


      {/* ── 핸드폰 미인증 ── */}
      {!userProfile.isPhoneVerified && (
        <button
          onClick={() => setShowPhoneVerificationModal(true)}
          className="w-full flex items-center gap-3 px-6 py-3.5 bg-amber-50 border-b border-amber-100 text-left"
        >
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">핸드폰 인증이 필요해요</p>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Phone className="w-3.5 h-3.5" />
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      )}

      {/* ── 발견 덱 (내 프로필 미리보기) ── */}
      {profile && (
        <ProfileDiscoveryDeck
          profile={profile}
          targetUserId={profile.userId}
          mutualFriends={[]}
          isSelf
        />
      )}

      {/* ── 본문 — photo essay + 접힌 스펙 + 이상형 (남이 보는 화면과 동일한 뼈대) ── */}
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

          <Collapsible open={detailsExpanded} onOpenChange={setDetailsExpanded}>
            <CollapsibleTrigger className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
              기본 정보 더 보기
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${detailsExpanded ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              {PROFILE_GROUPS.map((group) => (
                <CategoryCard
                  key={group.key}
                  group={group}
                  values={toProfileValues(profile)}
                  mode="view"
                />
              ))}
              {profile.introduction.datingStyle &&
                Object.keys(profile.introduction.datingStyle).length > 0 && (
                  <div className="bg-card rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">연애 스타일</p>
                    <div className="space-y-2">
                      {Object.entries(profile.introduction.datingStyle).map(([qKey, optKey]) => (
                        <div key={qKey} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground text-xs">
                            {DATING_STYLE_QUESTION_LABELS[qKey] ?? qKey}
                          </span>
                          <span className="font-medium">
                            {DATING_STYLE_OPTION_LABELS[optKey] ?? optKey}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </CollapsibleContent>
          </Collapsible>

          {(idealSummaryChips.length > 0 ||
            (profile.idealType.dealBreakers?.length ?? 0) > 0 ||
            profile.idealType.ageMin ||
            profile.idealType.ageMax) && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                이런 인연을 찾아요
              </h3>
              {idealSummaryChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {idealSummaryChips.map((item, index) => (
                    <Badge key={index} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
              {(profile.idealType.ageMin || profile.idealType.ageMax ||
                profile.idealType.heightMin || profile.idealType.heightMax) && (
                <p className="text-xs text-muted-foreground">
                  {[
                    (profile.idealType.ageMin || profile.idealType.ageMax) &&
                      `나이 ${profile.idealType.ageMin ?? "?"}~${profile.idealType.ageMax ?? "?"}세`,
                    (profile.idealType.heightMin || profile.idealType.heightMax) &&
                      `키 ${profile.idealType.heightMin ?? "?"}~${profile.idealType.heightMax ?? "?"}cm`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {(profile.idealType.dealBreakers?.length ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground">
                  절대 안 되는 것:{" "}
                  {profile.idealType.dealBreakers.map(getDealBreakerLabel).join(" · ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 수정 버튼 — sticky (fixed 는 .app-frame transform 때문에 딸려 올라감, ADR 0063). 하단 네비(60px) 위로. ── */}
      <div className="sticky bottom-[68px] z-40 px-6 pb-1">
        <Button
          onClick={onEdit}
          className="w-full h-12 rounded-2xl font-semibold shadow-card-hover"
        >
          <Edit3 className="w-4 h-4 mr-2" />
          프로필 수정하기
        </Button>
      </div>

      <NiceVerificationModal
        isOpen={showPhoneVerificationModal}
        onClose={() => setShowPhoneVerificationModal(false)}
        onVerified={handlePhoneVerified}
      />

      {/* ── 완성도 체크리스트 Bottom Sheet ── */}
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
    </div>
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

function getDatePreferenceLabel(pref: string): string {
  // SoT: IdealTypeScreen.tsx DATE_STYLE_OPTIONS — ProfileDetail 과 동일하게 통일 (D-3)
  return {
    FOOD: "맛집 투어", CAFE: "카페·디저트", ACTIVITY: "액티비티·운동", TRAVEL: "여행·드라이브",
    EXHIBITION: "전시·공연", MOVIE: "영화·넷플릭스", HOME: "집 데이트", WALK: "산책·피크닉",
    DRINK: "술 한잔", FESTIVAL: "페스티벌·팝업",
    // 구버전 호환
    ACTIVE: "액티브", INDOOR: "인도어", CULTURE: "문화생활", NATURE: "자연 속으로",
    NIGHT: "야경/술자리", RELAXED: "여유롭게",
  }[pref] ?? pref;
}

// DATING_STYLE_*_LABELS — 위 import 로 이동됨 (D-1/C-2)

const BUCKET_LABELS: Record<string, string> = {
  JEJU_MONTH: "제주도 한 달 살기", BACKPACKING: "배낭여행", OSAKA: "오사카 2박 3일",
  BANGKOK: "방콕 뚝뚝이", SOLO_ABROAD: "혼자 해외여행", ROAD_TRIP: "아무 계획 없는 드라이브",
  CAMPING: "캠핑 & 불멍", DAYTRIP: "주말 당일치기",
  CONVENIENCE_NIGHT: "새벽 편의점 치킨", HANGANG_RAMYEON: "한강에서 라면",
  MIDNIGHT_MOVIE: "새벽 영화관", ROOFTOP_BAR: "루프탑 바", NIGHT_DRIVE: "야경 드라이브",
  FOOD_TOUR: "맛집 웨이팅 성공", NIGHT_MARKET: "야시장 투어", HOME_PARTY: "홈파티 열기",
  COOK_TOGETHER: "함께 요리 도전",
  MUSICAL: "뮤지컬 관람", MUSEUM_DATE: "미술관 데이트", FESTIVAL: "음악 페스티벌",
  HANOK_VILLAGE: "한옥마을 투어",
  BUNGEE: "번지점프", SURFING: "서핑 배우기", SKI: "스키장",
  HIKING: "한라산 or 설악산", STARGAZING: "별빛 텐트",
};

function getBucketLabel(key: string): string {
  if (key.startsWith("custom:")) return key.slice(7);
  return BUCKET_LABELS[key] ?? key;
}

function getImportantValueLabel(value: string): string {
  return {
    PERSONALITY: "성격/성향", APPEARANCE: "외모", EDUCATION: "학력",
    CAREER: "능력/커리어", FAMILY: "집안/가족", JOB: "직업", WEALTH: "경제력", VALUES: "가치관",
  }[value] ?? value;
}

function getAppearanceStyleLabel(style: string): string {
  return {
    PUPPY: "강아지상", CAT: "고양이상", RABBIT: "토끼상", FOX: "여우상", DEER: "사슴상",
    BEAR: "곰상", HAMSTER: "햄스터상", DINOSAUR: "공룡상", WOLF: "늑대상",
    TOFU: "두부상", SOFT_TOFU: "순두부상", INNOCENT: "청순상", CHIC: "시크상", BAGEL: "베이글상",
    DOLL: "인형상", HARMLESS: "무해상", FRESH: "청량상", ANNOUNCER: "아나운서상",
    ARAB: "아랍상", BOSS: "일진상", MOTHER_IN_LAW_APPROVED: "상견례 프리패스상",
    STUDENT_COUNCIL: "전교회장상", ATHLETIC: "체대상", NERD: "너드상",
    WARM: "훈남상", DANDY: "댄디상", BEAST: "짐승상",
  }[style] ?? style;
}

function getDealBreakerLabel(dealBreaker: string): string {
  return {
    SMOKING: "흡연자", HEAVY_DRINKING: "과음하는 사람", DISLIKES_PETS: "반려동물을 싫어하는 사람",
    LONG_DISTANCE: "장거리 연애", DIFFERENT_RELIGION: "종교가 다른 사람",
    NO_MARRIAGE_PLAN: "결혼 의사가 없는 사람", CHILDREN_PLAN: "자녀 계획이 맞지 않는 사람",
    UNSTABLE_JOB: "직업이 불안정한 사람", CONTACTS_EX: "전 연인과 연락하는 사람",
    LARGE_AGE_GAP: "나이 차이가 많이 나는 사람",
  }[dealBreaker] ?? dealBreaker;
}
