import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ChevronLeft, Loader2, Send, Users, ExternalLink, Lock, CreditCard, EyeOff } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { getCompatibilityDeterministic, COLOR_META, COMPAT_STYLE, type ColorType } from "../../lib/colorCompatibility";
import { CategoryCard } from "./profile/CategoryCard";
import { PROFILE_GROUPS, toProfileValues } from "../../lib/profileSchema";

interface MutualFriend {
  name: string;
  phoneHint?: string;
  userId?: string;
}

interface ProfileDetailScreenProps {
  userId: string;
  onBack: () => void;
  mutualFriends?: MutualFriend[];  // 공통 친구 리스트
  degree?: number;                 // 1=1촌, 2=2촌, 3=3촌
  viewCost?: number;               // 열람 비용 (0=무료)
  onNavigateToFriends?: () => void;
}

interface PublicUserResponse {
  nickname: string;
  gender: string;
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
  colorType: {
    type: string | null;
    name: string | null;
    hex: string | null;
    description: string | null;
  } | null;
  metrics: {
    trustScore: number;
  };
}

function PhotoCarousel({ photos }: { photos: Array<{ id: string; url: string }> }) {
  const [idx, setIdx] = useState(0);
  const startX = useRef<number | null>(null);

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(photos.length - 1, i + 1));

  return (
    <div className="relative select-none">
      <div
        className="relative h-[480px] bg-black overflow-hidden flex items-center justify-center"
        onTouchStart={e => { startX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (startX.current === null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          if (dx < -40) next();
          else if (dx > 40) prev();
          startX.current = null;
        }}
      >
        {/* 블러 배경 */}
        <img src={photos[idx].url} alt="" className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40 pointer-events-none" aria-hidden />
        {/* 실제 사진 — 중앙 정렬 */}
        <img src={photos[idx].url} alt="" className="absolute inset-0 w-full h-full object-contain z-10" />
      </div>

      {/* prev/next tap zones */}
      {idx > 0 && (
        <button onClick={prev} className="absolute left-0 top-0 h-full w-1/3" aria-label="이전 사진" />
      )}
      {idx < photos.length - 1 && (
        <button onClick={next} className="absolute right-0 top-0 h-full w-1/3" aria-label="다음 사진" />
      )}

      {/* dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === idx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
          ))}
        </div>
      )}

      {/* counter */}
      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
        <span className="text-white text-xs font-medium">{idx + 1} / {photos.length}</span>
      </div>
    </div>
  );
}

export function ProfileDetailScreen({ userId, onBack, mutualFriends = [], degree = 2, viewCost = 3000, onNavigateToFriends }: ProfileDetailScreenProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userInfo, setUserInfo] = useState<PublicUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "ideal">("about");
  const [showMatchmakerModal, setShowMatchmakerModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedMatchmaker, setSelectedMatchmaker] = useState<MutualFriend | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<100 | 300 | 500>(300);

  // Cooltime state
  const [inCoolTime, setInCoolTime] = useState(false);
  const [coolTimeRemainingDays, setCoolTimeRemainingDays] = useState(0);

  // Payment gate state
  const [isPaid, setIsPaid] = useState(viewCost === 0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Vouch state
  const [vouchCount, setVouchCount] = useState(0);
  const [isVouchedByMe, setIsVouchedByMe] = useState(false);
  const [isVouching, setIsVouching] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  // Hide state
  const [isHidden, setIsHidden] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);

  useEffect(() => {
    // If free (1촌), fetch directly; if paid, show gate first
    if (viewCost === 0) {
      fetchProfileData();
    } else {
      // Check if already paid
      checkPaymentStatus();
    }
    checkMatchmakingRequest();
    checkCoolTime();
    fetchVouchInfo();
    // 1촌(mutualFriends가 있으면)이거나 직접 알면 보증 가능 여부 확인
    setIsFriend(mutualFriends.length > 0 || viewCost === 0);
  }, [userId]);

  const checkPaymentStatus = async () => {
    try {
      const data = await api.get<{ canView: boolean; isAlreadyPaid: boolean }>(
        `/api/v1/payment/profile-view-cost?targetUserId=${userId}`
      );
      if (data.canView) {
        setIsPaid(true);
        fetchProfileData();
      } else {
        setIsLoading(false);
        setShowPaymentModal(true);
      }
    } catch {
      // If can't check, show gate
      setIsLoading(false);
      setShowPaymentModal(true);
    }
  };

  const handlePay = async () => {
    setIsProcessingPayment(true);
    try {
      await api.post("/api/v1/payment/profile-view", {
        targetUserId: userId,
        paymentMethod: "MOCK_CARD",
      });
      setIsPaid(true);
      setShowPaymentModal(false);
      toast.success("결제가 완료되었습니다!");
      await fetchProfileData();
    } catch {
      toast.error("결제에 실패했습니다");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const [profileResponse, userResponse] = await Promise.all([
        api.get<ProfileData>(`/api/v1/profile/public/${userId}`),
        api.get<PublicUserResponse>(`/api/v1/users/${userId}/public`)
      ]);
      setProfile(profileResponse);
      setUserInfo(userResponse);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("프로필을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const checkMatchmakingRequest = async () => {
    try {
      const response = await api.get<{ exists: boolean }>(`/api/v1/matchmaking/check/${userId}`);
      setAlreadyRequested(response.exists);
    } catch (error) {
      console.error("Failed to check matchmaking request:", error);
    }
  };

  const checkCoolTime = async () => {
    try {
      const res = await api.get<{ inCoolTime: boolean; remainingDays: number }>("/api/v1/matchmaking/cooltime-status");
      setInCoolTime(res.inCoolTime);
      setCoolTimeRemainingDays(res.remainingDays);
    } catch {
      // ignore
    }
  };

  const fetchVouchInfo = async () => {
    try {
      const res = await api.get<{ vouchCount: number; isVouchedByMe: boolean; voucherNicknames: string[] }>(
        `/api/v1/vouch/${userId}`
      );
      setVouchCount(res.vouchCount);
      setIsVouchedByMe(res.isVouchedByMe);
    } catch {
      // ignore
    }
  };

  const handleVouch = async () => {
    setIsVouching(true);
    try {
      if (isVouchedByMe) {
        await api.delete(`/api/v1/vouch/${userId}`);
        setVouchCount(v => v - 1);
        setIsVouchedByMe(false);
        toast.info("보증을 취소했습니다");
      } else {
        await api.post(`/api/v1/vouch/${userId}`);
        setVouchCount(v => v + 1);
        setIsVouchedByMe(true);
        toast.success("사진 보증 완료! 이 분의 신뢰도가 높아졌어요 ✅");
      }
    } catch (e: any) {
      toast.error(e?.message || "보증에 실패했습니다");
    } finally {
      setIsVouching(false);
    }
  };

  const handleHideConfirm = async () => {
    setIsHiding(true);
    try {
      await api.post(`/api/v1/feed/hide/${userId}`, {});
      setIsHidden(true);
      setShowHideConfirm(false);
      onBack();
    } catch {
      toast.error("처리에 실패했습니다");
    } finally {
      setIsHiding(false);
    }
  };

  const handleMatchRequest = () => {
    if (mutualFriends.length === 0) {
      toast.error("공통 친구가 없어 주선을 요청할 수 없습니다");
      return;
    }
    setShowMatchmakerModal(true);
    setModalStep(1);
  };

  const handleMatchmakerSelect = (matchmaker: MutualFriend) => {
    setSelectedMatchmaker(matchmaker);
  };

  const handleNextStep = () => {
    if (!selectedMatchmaker) {
      toast.error("주선자를 선택해주세요");
      return;
    }
    setModalStep(2);
  };

  const handleConfirmMatchRequest = async () => {
    if (!selectedMatchmaker) return;

    try {
      await api.post("/api/v1/matchmaking/request", {
        targetUserId: userId,
        matchmakerName: selectedMatchmaker.name,
        message: requestMessage || null,
        offeredPoints: selectedPoints,
      });

      toast.success(`${selectedMatchmaker.name}님께 주선을 요청했습니다`);
      setAlreadyRequested(true);
      setShowMatchmakerModal(false);
      setModalStep(1);
      setSelectedMatchmaker(null);
      setRequestMessage("");
    } catch (error) {
      console.error("Failed to create matchmaking request:", error);
      toast.error("주선 요청에 실패했습니다");
    }
  };

  const handleCloseModal = () => {
    setShowMatchmakerModal(false);
    setModalStep(1);
    setSelectedMatchmaker(null);
    setRequestMessage("");
    setSelectedPoints(300);
  };

  const getMutualFriendsText = () => {
    if (mutualFriends.length === 0) return "";
    if (mutualFriends.length === 1) return `${mutualFriends[0].name}의 지인`;
    return `${mutualFriends[0].name} 외 ${mutualFriends.length - 1}명의 지인`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Payment gate modal
  if (showPaymentModal && !isPaid) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">프로필 열람</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-xl font-bold mb-2">
            {degree === 2 ? "2촌" : "3촌"} 프로필 열람
          </h2>
          <p className="text-muted-foreground mb-1">
            {degree === 2 ? "2촌 친구의 친구" : "3촌 지인"}입니다
          </p>
          {mutualFriends.length > 0 && (
            <p className="text-sm text-primary mb-4">
              공통 친구: {mutualFriends.map(f => f.name).join(", ")}
            </p>
          )}

          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-xs mb-6">
            <p className="text-sm text-muted-foreground mb-1">열람 비용</p>
            <p className="text-3xl font-bold text-primary">
              {viewCost.toLocaleString()}원
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              결제 후 24시간 동안 프로필을 열람할 수 있습니다
            </p>
          </div>

          <Button
            className="w-full max-w-xs gap-2 h-12 text-base"
            onClick={handlePay}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {isProcessingPayment ? "결제 중..." : `${viewCost.toLocaleString()}원 결제하기`}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            결제 후 24시간 동안 프로필을 열람할 수 있습니다
          </p>

          <Button variant="ghost" className="mt-4 text-muted-foreground" onClick={onBack}>
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  if (!profile || !userInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <p className="text-muted-foreground mb-4">프로필을 찾을 수 없습니다</p>
        <Button onClick={onBack}>돌아가기</Button>
      </div>
    );
  }

  // Section components (same as MyProfileScreen)
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex justify-between items-center py-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
    );
  };

  const ChipGroup = ({ items }: { items: string[] }) => {
    if (items.length === 0) return <p className="text-muted-foreground text-sm">정보 없음</p>;
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={index} variant="secondary">
            {item}
          </Badge>
        ))}
      </div>
    );
  };

  const InterviewAnswer = ({ question, answer }: { question: string; answer: string }) => {
    return (
      <div className="space-y-1.5 pb-3 border-b border-border/50 last:border-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{question}</p>
        <p className="text-sm leading-relaxed text-foreground">{answer}</p>
      </div>
    );
  };

  // Display mappings
  const getBodyTypeDisplay = (bodyType: string | null) => {
    if (!bodyType) return null;
    const map: Record<string, string> = {
      SLIM: "슬림", AVERAGE: "보통", ATHLETIC: "탄탄",
      MUSCULAR: "근육질", CHUBBY: "통통", CURVY: "풍만"
    };
    return map[bodyType] || bodyType;
  };

  const getJobCategoryDisplay = (category: string | null) => {
    if (!category) return null;
    const map: Record<string, string> = {
      IT_DEVELOPMENT: "IT/개발", FINANCE: "금융/보험", EDUCATION: "교육",
      MEDICAL: "의료/보건", MEDIA: "미디어/엔터", SERVICE: "서비스/영업",
      MANUFACTURING: "제조/생산", PUBLIC_OFFICIAL: "공무원/공공기관",
      PROFESSIONAL: "전문직", OTHER: "기타"
    };
    return map[category] || category;
  };

  const getEducationDisplay = (level: string | null) => {
    if (!level) return null;
    const map: Record<string, string> = {
      HIGH_SCHOOL: "고졸", ASSOCIATE: "전문대졸", BACHELOR: "대졸",
      MASTER: "석사", DOCTORATE: "박사"
    };
    return map[level] || level;
  };

  const getFrequencyDisplay = (freq: string | null) => {
    if (!freq) return null;
    const map: Record<string, string> = {
      NEVER: "안 함", SOMETIMES: "가끔", OFTEN: "자주"
    };
    return map[freq] || freq;
  };

  const getReligionDisplay = (religion: string | null) => {
    if (!religion) return null;
    const map: Record<string, string> = {
      NONE: "무교", CHRISTIANITY: "기독교", CATHOLICISM: "천주교",
      BUDDHISM: "불교", OTHER: "기타"
    };
    return map[religion] || religion;
  };

  const getDatePreferenceDisplay = (prefs: string[]) => {
    const map: Record<string, string> = {
      ACTIVE: "활동적인", INDOOR: "실내 데이트", CULTURE: "문화생활", NATURE: "자연/야외"
    };
    return prefs.map(p => map[p] || p);
  };

  const getImportantValueDisplay = (values: string[]) => {
    const map: Record<string, string> = {
      PERSONALITY: "성격/성향", APPEARANCE: "외모", EDUCATION: "학력",
      CAREER: "능력/커리어", FAMILY: "집안/가족", JOB: "직업",
      WEALTH: "경제력", VALUES: "가치관"
    };
    return values.map(v => map[v] || v);
  };

  const getAppearanceStyleDisplay = (styles: string[]) => {
    const map: Record<string, string> = {
      PUPPY: "강아지상", CAT: "고양이상", RABBIT: "토끼상", FOX: "여우상",
      DEER: "사슴상", TOFU: "두부상", SOFT_TOFU: "순두부상", ARAB: "아랍상",
      BOSS: "일진상", MOTHER_IN_LAW_APPROVED: "상견례입구컷상",
      STUDENT_COUNCIL: "전교회장상", ATHLETIC: "체대상", NERD: "너드상",
      DINOSAUR: "공룡상"
    };
    return styles.map(s => map[s] || s);
  };

  const getDealBreakerDisplay = (dealBreakers: string[]) => {
    const map: Record<string, string> = {
      SMOKING: "흡연",
      EXCESSIVE_DRINKING: "과음",
      HEAVY_DRINKING: "과음",
      DIFFERENT_RELIGION: "종교 차이",
      LONG_DISTANCE: "장거리 연애",
      DIFFERENT_VALUES: "가치관 차이",
      NO_JOB: "무직",
      DEBT: "빚",
      DIVORCED: "이혼 경력",
      AGE_GAP: "나이 차이",
      PETS: "반려동물",
      CHILDREN: "아이 있음"
    };
    return dealBreakers.map(d => map[d] || d);
  };

  const sortedPhotos = [...profile.photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const accentColor = profile.colorType?.hex ?? null;

  const getContrastColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#111111' : '#FFFFFF';
  };
  const buttonTextColor = accentColor ? getContrastColor(accentColor) : undefined;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div
        className="sticky top-0 z-20 backdrop-blur-sm border-b border-border"
        style={accentColor
          ? { backgroundColor: `${accentColor}18`, borderBottomColor: `${accentColor}40` }
          : { backgroundColor: "hsl(var(--card) / 0.95)" }
        }
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-base font-semibold">{userInfo.nickname}님의 프로필</h2>
          </div>
          <button
            onClick={() => setShowHideConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
          >
            <EyeOff className="w-3.5 h-3.5" />
            추천받지 않기
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Photo Carousel */}
        <div className="px-4 pt-3 flex justify-center">
          {sortedPhotos.length > 0 ? (
            <div className="rounded-2xl overflow-hidden w-full max-w-[320px]">
              <PhotoCarousel photos={sortedPhotos} />
            </div>
          ) : (
            <div className="aspect-[3/4] max-h-[420px] w-full max-w-[320px] bg-muted flex items-center justify-center rounded-2xl">
              <span className="text-sm text-muted-foreground">사진 없음</span>
            </div>
          )}
        </div>

        {/* 색깔 궁합 + AI 분석 배너 */}
        <ColorCompatBanner
          theirColorType={(profile.colorType?.type ?? null) as ColorType | null}
          theirColorName={profile.colorType?.name ?? null}
          theirColorHex={profile.colorType?.hex ?? null}
          theirProfile={profile}
          targetUserId={userId}
        />

        {/* Tabs */}
        <div className="border-b border-border px-6 mt-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === "about" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              내소개
              {activeTab === "about" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: accentColor ?? "hsl(var(--primary))" }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab("ideal")}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === "ideal" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              원하는 이상형
              {activeTab === "ideal" && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: accentColor ?? "hsl(var(--primary))" }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === "about" ? (
            <>
              {/* 기본정보 — CategoryCard 3종 */}
              <div className="space-y-3">
                {PROFILE_GROUPS.map((group) => (
                  <CategoryCard
                    key={group.key}
                    group={group}
                    values={toProfileValues(profile)}
                    mode="view"
                  />
                ))}
              </div>

              {/* Introduction */}
              <Section title="자기소개">
                {profile?.introduction.interviewAnswers ? (
                  <div
                    className="bg-card rounded-lg p-4"
                    style={accentColor
                      ? { border: `1px solid ${accentColor}40` }
                      : { border: "1px solid hsl(var(--border))" }
                    }
                  >
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
                  </div>
                ) : (
                  <div className="bg-card rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground text-center py-8">자기소개를 작성해주세요</p>
                  </div>
                )}
              </Section>

              {/* Personality Tests */}
              {profile.personalityTests && profile.personalityTests.length > 0 && (
                <Section title="나는 이런 사람이에요">
                  <div className="bg-card rounded-lg border border-border p-4">
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
                  </div>
                </Section>
              )}
            </>
          ) : (
            <>
              {/* Appearance Styles */}
              <Section title="외모 스타일">
                <ChipGroup items={getAppearanceStyleDisplay(profile.idealType.appearanceStyles)} />
              </Section>

              {/* Personalities */}
              <Section title="성격">
                <ChipGroup items={profile.idealType.personalities} />
              </Section>

              {/* Date Preferences */}
              <Section title="데이트 스타일">
                <ChipGroup items={getDatePreferenceDisplay(profile.idealType.datePreferences)} />
              </Section>

              {/* Important Values */}
              <Section title="중요하게 생각하는 것">
                <ChipGroup items={getImportantValueDisplay(profile.idealType.importantValues)} />
              </Section>

              {/* Deal Breakers */}
              <Section title="절대 안 되는 것">
                <ChipGroup items={getDealBreakerDisplay(profile.idealType.dealBreakers)} />
              </Section>
            </>
          )}
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-20">
        <div className="max-w-2xl mx-auto space-y-2">
          {inCoolTime && (
            <p className="text-xs text-center text-amber-600 flex items-center justify-center gap-1">
              ⏳ 매칭 성사 후 쿨타임 중 · {coolTimeRemainingDays}일 후 새 요청 가능
            </p>
          )}
          {mutualFriends.length === 0 ? (
            <div className="rounded-2xl bg-muted/60 border border-border p-4 text-center space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">주선 요청을 하려면 공통 친구가 필요해요</p>
                <p className="text-xs text-muted-foreground">친구를 연결하면 지인을 통한 신뢰있는 주선이 가능해요.</p>
              </div>
              {onNavigateToFriends && (
                <Button variant="outline" size="sm" className="w-full" onClick={onNavigateToFriends}>
                  친구 연결하기
                </Button>
              )}
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full h-14"
              onClick={handleMatchRequest}
              disabled={alreadyRequested || inCoolTime}
              variant={alreadyRequested || inCoolTime ? "secondary" : "default"}
              style={(!alreadyRequested && !inCoolTime && accentColor)
                ? { backgroundColor: accentColor, borderColor: accentColor, color: buttonTextColor }
                : {}
              }
            >
              <Send className="w-5 h-5 mr-2" />
              {alreadyRequested
                ? "주선 요청 완료"
                : inCoolTime
                ? `쿨타임 중 (${coolTimeRemainingDays}일 남음)`
                : "주선 요청하기"}
            </Button>
          )}
        </div>
      </div>

      {/* Hide Confirm Dialog */}
      <Dialog open={showHideConfirm} onOpenChange={setShowHideConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>추천받지 않겠습니까?</DialogTitle>
            <DialogDescription>
              피드에 앞으로 노출되지 않고, 상대방도 나를 볼 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowHideConfirm(false)} disabled={isHiding}>
              취소
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleHideConfirm} disabled={isHiding}>
              {isHiding ? <Loader2 className="w-4 h-4 animate-spin" /> : "확인"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Matchmaker Selection Modal */}
      {showMatchmakerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Step 1: Select Matchmaker */}
            {modalStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right duration-300">
                {/* Modal Header */}
                <div className="border-b border-border px-6 py-4">
                  <h3 className="text-lg font-semibold text-center">주선 요청</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    어떤 분께 주선을 요청하시겠습니까?
                  </p>
                </div>

                {/* Matchmaker List */}
                <div className="overflow-y-auto max-h-[50vh] p-4">
                  <div className="space-y-2">
                    {mutualFriends.map((friend, index) => (
                      <button
                        key={index}
                        onClick={() => handleMatchmakerSelect(friend)}
                        className={`w-full text-left px-4 py-4 rounded-xl border-2 transition-all ${
                          selectedMatchmaker?.name === friend.name
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-accent/5"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{friend.name}</p>
                              {friend.phoneHint && (
                                <p className="text-xs text-muted-foreground">{friend.phoneHint}</p>
                              )}
                            </div>
                          </div>
                          {selectedMatchmaker?.name === friend.name && (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="border-t border-border px-6 py-4 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCloseModal}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleNextStep}
                    disabled={!selectedMatchmaker?.name}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Points + Message */}
            {modalStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right duration-300">
                {/* Modal Header */}
                <div className="border-b border-border px-6 py-4">
                  <h3 className="text-lg font-semibold text-center">주선 요청</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    주선자에게 감사 포인트를 설정해주세요
                  </p>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto max-h-[65vh]">
                  {/* Selected matchmaker summary */}
                  <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">선택된 주선자</p>
                      <p className="font-semibold text-sm">{selectedMatchmaker?.name}</p>
                    </div>
                  </div>

                  {/* Points selection */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">감사 포인트</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        주선자가 수락하는 순간 즉시 지급돼요
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { points: 100 as const, label: "기본", desc: "~1,000원" },
                        { points: 300 as const, label: "성의표시", desc: "~3,000원", recommended: true },
                        { points: 500 as const, label: "적극요청", desc: "~5,000원" },
                      ]).map(({ points, label, desc, recommended }) => (
                        <button
                          key={points}
                          onClick={() => setSelectedPoints(points)}
                          className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                            selectedPoints === points
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          {recommended && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              추천
                            </span>
                          )}
                          <p className="font-bold text-base mt-1">{points}P</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground/70">{desc}</p>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ※ 상대방이 거절해도 포인트는 환불되지 않아요
                    </p>
                  </div>

                  {/* Optional message */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      한마디 <span className="text-muted-foreground text-xs">(선택 · 주선자가 수락 후 전달)</span>
                    </label>
                    <textarea
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="주선자에게 전할 말이 있으면 남겨주세요"
                      className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {requestMessage.length}/200
                    </p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="border-t border-border px-6 py-4 flex gap-2.5">
                  <Button variant="outline" className="flex-1" onClick={() => setModalStep(1)}>
                    이전
                  </Button>
                  <Button className="flex-1 gap-1.5" onClick={handleConfirmMatchRequest}>
                    {selectedPoints}P로 요청하기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 색깔 궁합 배너 ──────────────────────────────────────────
// ─── AI 매칭 인사이트 생성 ────────────────────────────────────────────
function generateMatchInsights(
  myProfile: any,
  theirProfile: ProfileData,
  compat: ReturnType<typeof getCompatibilityDeterministic>,
): string[] {
  const points: string[] = [];

  // 1. 색깔 궁합 기반 인사이트
  if (compat) {
    const colorInsight: Record<string, string> = {
      complement: "서로 다른 에너지가 빈자리를 채워줘요. 함께할수록 균형이 생기는 관계예요.",
      synergy:    "같은 방향을 바라보며 함께 성장할 수 있어요. 추진력이 배가되는 조합이에요.",
      harmony:    "자연스럽게 어우러지는 궁합이에요. 편안하게 대화가 이어질 것 같아요.",
      contrast:   "강한 대비가 서로에게 새로운 시각을 열어줘요. 만남 자체가 자극이 될 수 있어요.",
      neutral:    "안정적인 기반 위에서 천천히 쌓아가기 좋은 관계예요.",
    };
    const insight = colorInsight[compat.type];
    if (insight) points.push(insight);
  }

  // 2. 자기소개 인터뷰 기반 — 상대방의 답변 키워드로 대화 풍부도 예측
  const answers = theirProfile.introduction.interviewAnswers;
  if (answers) {
    const filled = [answers.hobby, answers.charm, answers.passion, answers.happiness]
      .filter((a): a is string => !!a && a.trim().length > 0);
    if (filled.length >= 3) {
      points.push("자기소개가 풍부해서 처음 만남에도 대화가 끊기지 않을 것 같아요.");
    } else if (filled.length > 0) {
      const snippet = filled[0].length > 18 ? filled[0].slice(0, 18) + "…" : filled[0];
      points.push(`"${snippet}" — 답변에서 느껴지는 취향이 흥미로운 대화 소재가 될 거예요.`);
    }
  }

  // 3. 라이프스타일 호환성 비교
  const ml = myProfile?.lifestyleInfo;
  const tl = theirProfile.lifestyleInfo;
  if (ml && tl) {
    const noSmoke = (v: string | null) => !v || v === "NEVER";
    const lightDrink = (v: string | null) => !v || v === "NEVER" || v === "OCCASIONALLY";
    if (noSmoke(ml.smoking) && noSmoke(tl.smoking) && lightDrink(ml.drinking) && lightDrink(tl.drinking)) {
      points.push("생활 패턴이 비슷해요. 일상을 함께 그려나가기 편할 거예요.");
    } else if (ml.religion && tl.religion && ml.religion === tl.religion && ml.religion !== "NONE") {
      points.push("종교적 가치관이 일치해요. 중요한 부분에서 공감대가 생기기 쉬워요.");
    }
  }

  // 4. 중요 가치관
  const values = theirProfile.idealType.importantValues;
  const valueLabel: Record<string, string> = {
    PERSONALITY: "성격", APPEARANCE: "외모", STABILITY: "안정감",
    HUMOR: "유머 감각", CARE: "배려심", AMBITION: "열정", HONESTY: "솔직함",
  };
  if (values.length > 0 && points.length < 3) {
    const labels = values.slice(0, 2).map(v => valueLabel[v] ?? v).join("과 ");
    points.push(`${labels}을 중시하는 가치관이 관계에서 신뢰를 만들어줄 것 같아요.`);
  }

  // 최소 2개 보장
  if (points.length < 2) {
    points.push("프로필을 더 읽다 보면 예상치 못한 공통점을 발견하게 될 거예요.");
  }

  return points.slice(0, 3);
}

// ─── 색깔 궁합 + AI 분석 통합 배너 ───────────────────────────────────
function ColorCompatBanner({
  theirColorType,
  theirColorName,
  theirColorHex,
  theirProfile,
  targetUserId,
}: {
  theirColorType: ColorType | null;
  theirColorName: string | null;
  theirColorHex: string | null;
  theirProfile: ProfileData;
  targetUserId: string;
}) {
  const [myColorType, setMyColorType] = useState<ColorType | null>(null);
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    api.get<any>("/api/v1/profile")
      .then((p) => {
        setMyColorType((p.colorType?.type ?? null) as ColorType | null);
        setMyProfile(p);
      })
      .catch(() => {});
  }, []);

  if (!theirColorType || !theirColorHex || !theirColorName) return null;

  const theirMeta = COLOR_META[theirColorType];
  const myMeta = myColorType ? COLOR_META[myColorType] : null;
  const compat = getCompatibilityDeterministic(myColorType, theirColorType, targetUserId);
  const style = compat ? COMPAT_STYLE[compat.type] : null;

  const insights = generateMatchInsights(myProfile, theirProfile, compat);

  return (
    <div className="px-4 pt-3">
      {compat && myMeta ? (
        <div className={`rounded-2xl border px-4 py-4 ${style!.bg} ${style!.border}`}>
          {/* 상단: 두 색 도트 + 궁합 레이블 + AI 뱃지 */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center shrink-0">
              <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: myMeta.hex }} />
              <span className="w-7 h-7 rounded-full border-2 border-white shadow-sm -ml-2" style={{ backgroundColor: theirMeta.hex }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold uppercase tracking-wide ${style!.text}`}>{compat.label}</span>
                <span className={`text-xs font-semibold ${style!.text}`}>{compat.score}%</span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{compat.tagline}</p>
            </div>
            <span className="shrink-0 text-[10px] font-medium text-neutral-400 bg-black/5 px-2 py-0.5 rounded-full">✦ AI 분석</span>
          </div>

          {/* 구분선 */}
          <div className="border-t border-black/5 pt-3 space-y-2">
            {insights.map((pt, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-[10px] mt-[3px] font-bold shrink-0 ${style!.text}`}>•</span>
                <p className="text-xs text-neutral-600 leading-relaxed">{pt}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 내 색깔 없을 때 — 상대 색깔 + 단순 분석 */
        <div
          className="rounded-2xl px-4 py-3.5 space-y-2"
          style={{ backgroundColor: `${theirColorHex}12`, border: `1px solid ${theirColorHex}35` }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: theirColorHex }} />
            <span className="text-sm font-semibold" style={{ color: theirColorHex }}>{theirColorName}</span>
            {theirMeta?.energy && <span className="text-xs text-neutral-400">{theirMeta.energy}</span>}
          </div>
          <div className="border-t border-black/5 pt-2 space-y-1.5">
            {generateMatchInsights(null, theirProfile, null).map((pt, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] mt-[3px] font-bold shrink-0 text-neutral-400">•</span>
                <p className="text-xs text-neutral-500 leading-relaxed">{pt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
