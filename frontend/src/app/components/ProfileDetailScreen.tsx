import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ChevronLeft, Loader2, Send, Users, ExternalLink, Lock, EyeOff, Palette as PaletteIcon, BadgeCheck } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { CategoryCard } from "./profile/CategoryCard";
import { ProfileDiscoveryDeck } from "./profile/ProfileDiscoveryDeck";
import { ProfilePhotoEssay } from "./profile/ProfilePhotoEssay";
import { ProfileMagazineShell } from "./profile/ProfileMagazineShell";
import { ProfileMagazineHeader } from "./profile/ProfileMagazineHeader";
import { ProfileMagazineHero } from "./profile/ProfileMagazineHero";
import { ProfileDetailsCollapsible } from "./profile/ProfileDetailsCollapsible";
import { ProfileIdealTypeSummary } from "./profile/ProfileIdealTypeSummary";
import { VouchSheet } from "./profile/VouchSheet";
import { buildHeroSpecLine } from "../../lib/profileEssay";
import { PROFILE_GROUPS, toProfileValues } from "../../lib/profileSchema";
import { onboardingProgress } from "../../lib/onboarding/progress";
import { jobCategoryLabel } from "../../lib/jobCategory";
import { InfoHint } from "./InfoHint";
import { SafetyMenu } from "./safety/SafetyMenu";
import { vouchDisplayLine, type VouchItem, type VouchResponse } from "../../lib/vouchPresets";

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
  /**
   * 열람 비용. ADR 0042 + ADR 0044 (가격 v2) — 단위는 **물감 (P)**, 1 물감 = 100원.
   * 친친(degree=2) = 20 물감, 한 다리 더 건너(degree=3) = 30 물감, 1촌 = 0.
   * (legacy 호출자가 원 단위로 넘기던 시기와의 호환을 위해 prop 이름은 유지)
   */
  viewCost?: number;
  onNavigateToFriends?: () => void;
  /** 잔액 부족 시 BillingScreen 으로 이동 (옵셔널 — 미주입 시 토스트만) */
  onNavigateToBilling?: () => void;
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
    datingStyle?: Record<string, string> | null;   // C-2 — 10문항 연애 스타일
  };
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
  idealType: {
    datePreferences: string[];
    importantValues: string[];
    personalities: string[];
    appearanceStyles: string[];
    dealBreakers: string[];
    // DA-001 — 나이/키 범위 (선호 조건)
    ageMin?: number | null;
    ageMax?: number | null;
    heightMin?: number | null;
    heightMax?: number | null;
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
    // C-3 — 백엔드에서 이미 내려주는데 타입에 빠져있던 4개 필드
    reasoning?: string | null;
    personalitySummary?: string | null;
    idealTypeInsight?: string | null;
    strengths?: string[] | null;
  } | null;
  metrics: {
    trustScore: number;
  };
  settings?: { detailsVisibleToFriends?: boolean } | null;
}

export function ProfileDetailScreen({ userId, onBack, mutualFriends = [], degree = 2, viewCost = 20, onNavigateToFriends, onNavigateToBilling }: ProfileDetailScreenProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userInfo, setUserInfo] = useState<PublicUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMatchmakerModal, setShowMatchmakerModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedMatchmaker, setSelectedMatchmaker] = useState<MutualFriend | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [alreadyRequested, setAlreadyRequested] = useState(false);

  // Cooltime state
  const [inCoolTime, setInCoolTime] = useState(false);
  const [coolTimeRemainingDays, setCoolTimeRemainingDays] = useState(0);

  // Payment gate state
  // 게이트 노출 기준은 "degree>=2 && 미열람" — 베타 무료(cost 0)여도 게이트는 띄운다 (열람 동기 유발).
  const [isPaid, setIsPaid] = useState(degree < 2);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  // 실제 열람 비용(물감) — 백엔드 권위값. 베타엔 0. 버튼/안내 표기에 사용.
  const [unlockCost, setUnlockCost] = useState<number>(viewCost);
  // 열람 전 색 궁합 teaser (백엔드 profile-view-cost 가 내려줌)
  const [teaser, setTeaser] = useState<{ headline: string; viewerColorHex: string | null; targetColorHex: string | null } | null>(null);

  // Vouch state — L0/L1/L2 (칩·한마디 옵셔널)
  const [vouchCount, setVouchCount] = useState(0);
  const [vouches, setVouches] = useState<VouchItem[]>([]);
  const [isVouchedByMe, setIsVouchedByMe] = useState(false);
  const [myVouch, setMyVouch] = useState<VouchItem | null>(null);
  const [showVouchSheet, setShowVouchSheet] = useState(false);
  const [isVouching, setIsVouching] = useState(false);
  const [myInterests, setMyInterests] = useState<string[]>([]);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  /** 1촌이면 보증 CTA 노출 (백엔드도 1촌·성사 매칭만 허용) */
  const canVouch = degree === 1 || isVouchedByMe;
  // Hide state
  const [isHidden, setIsHidden] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [showHideConfirm, setShowHideConfirm] = useState(false);

  useEffect(() => {
    // 1촌/직접 연결(degree<2)은 게이트 없이 바로 열람. 친친(degree>=2)은 게이트 → 미열람이면 노출.
    // 베타 무료라도 게이트는 띄우고, '열람하기' 누르면 (무료로) 바로 상세로 넘어간다.
    if (degree < 2) {
      fetchProfileData();
    } else {
      checkPaymentStatus();
    }
    checkMatchmakingRequest();
    checkCoolTime();
    fetchVouchInfo();
    api
      .get<{ introduction?: { interests?: string[] } }>("/api/v1/profile")
      .then((p) => setMyInterests(p.introduction?.interests ?? []))
      .catch(() => {});
  }, [userId]);

  const checkPaymentStatus = async () => {
    try {
      const data = await api.get<{
        cost: number;
        isAlreadyPaid: boolean;
        teaser?: { headline: string; viewerColorHex: string | null; targetColorHex: string | null } | null;
      }>(`/api/v1/payment/profile-view-cost?targetUserId=${userId}`);
      setUnlockCost(data.cost);
      if (data.teaser) setTeaser(data.teaser);
      // 이미 열람한 프로필만 게이트 생략. (베타 무료여도 첫 열람은 게이트 노출 → 열람 동기)
      if (data.isAlreadyPaid) {
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
      // PA-023 — ADR 0042 단일 잔액(물감) 차감. 백엔드가 BillingService.consume(10, "view_friend_of_friend").
      await api.post("/api/v1/payment/profile-view", { targetUserId: userId });
      setIsPaid(true);
      setShowPaymentModal(false);
      toast.success(unlockCost > 0 ? `${unlockCost} 물감으로 프로필을 열람했어요` : "프로필을 열었어요");
      await fetchProfileData();
    } catch (e: any) {
      // 402 INSUFFICIENT_BALANCE → 충전 화면으로 유도
      if (e?.status === 402 || e?.message === "INSUFFICIENT_BALANCE" || /INSUFFICIENT_BALANCE/.test(e?.message ?? "")) {
        toast.error(`물감이 부족해요 · ${unlockCost} 물감이 필요합니다`);
        if (onNavigateToBilling) onNavigateToBilling();
      } else {
        toast.error("열람에 실패했어요");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const [profileResponse, userResponse] = await Promise.all([
        api.get<ProfileData>(`/api/v1/profile/users/${userId}`),
        api.get<PublicUserResponse>(`/api/v1/users/${userId}/public`)
      ]);
      setProfile(profileResponse);
      setUserInfo(userResponse);
      // 온보딩 진척 (O-001) — 친친 프로필 1회 열람 완료 마킹
      onboardingProgress.markViewedProfile();
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

  const applyVouchResponse = (res: VouchResponse) => {
    setVouchCount(res.vouchCount);
    setVouches(res.vouches ?? []);
    setIsVouchedByMe(res.isVouchedByMe);
    setMyVouch(res.myVouch ?? null);
  };

  const fetchVouchInfo = async () => {
    try {
      const res = await api.get<VouchResponse>(`/api/v1/vouch/${userId}`);
      applyVouchResponse(res);
    } catch {
      // ignore
    }
  };

  const handleUnvouch = async () => {
    setIsVouching(true);
    try {
      const res = await api.delete<VouchResponse>(`/api/v1/vouch/${userId}`);
      applyVouchResponse(res);
      toast.info("보증을 취소했어요");
    } catch {
      toast.error("보증 취소에 실패했어요");
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

  // 팔레트 Pick — 팔리(시스템 주선자)가 이어줌 (degree 0, ADR 0078)
  const isPalettePick = degree === 0;

  // 내 지인(1촌)이고, 상대가 '지인에게 상세 공개'를 끈 경우 → 소개글·성향·이상형 숨김 (핵심정보만) (ADR 0035)
  const detailsHidden = degree === 1 && !(profile?.settings?.detailsVisibleToFriends ?? false);

  const handleMatchRequest = () => {
    if (mutualFriends.length === 0) {
      toast.error("공통 친구가 없어 소개를 요청할 수 없습니다");
      return;
    }
    setShowMatchmakerModal(true);
    setModalStep(1);
  };

  const handleDirectRequest = async () => {
    try {
      await api.post("/api/v1/matchmaking/direct", { targetUserId: userId });
      toast.success("팔리에게 부탁했어요 · 상대에게 바로 전달됐어요");
      setAlreadyRequested(true);
    } catch {
      toast.error("이미 요청했거나 지금은 요청할 수 없어요");
    }
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
        offeredPoints: 0,
      });

      toast.success(`${selectedMatchmaker.name}님께 소개를 요청했습니다`);
      // 온보딩 진척 (O-001) — 소개 요청 1회 보냄 마킹
      onboardingProgress.markSentMatchRequest();
      setAlreadyRequested(true);
      setShowMatchmakerModal(false);
      setModalStep(1);
      setSelectedMatchmaker(null);
      setRequestMessage("");
    } catch (error: any) {
      console.error("Failed to create matchmaking request:", error);
      // 최고가 액션(100 물감) — 잔액 부족 시 충전 화면으로 유도 (프로필 열람 게이트와 동일 처리)
      if (error?.status === 402 || /INSUFFICIENT_BALANCE/.test(error?.message ?? "")) {
        toast.error("물감이 부족해요 · 소개 요청에는 100 물감이 필요합니다");
        setShowMatchmakerModal(false);
        setModalStep(1);
        if (onNavigateToBilling) onNavigateToBilling();
      } else {
        toast.error("소개 요청에 실패했습니다");
      }
    }
  };

  const handleCloseModal = () => {
    setShowMatchmakerModal(false);
    setModalStep(1);
    setSelectedMatchmaker(null);
    setRequestMessage("");
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
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">프로필 열람</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-brand-soft rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-xl font-bold mb-2">
            {degree === 2 ? "친구의 친구" : "한 다리 더 건너"} 프로필 열람
          </h2>
          <p className="text-muted-foreground mb-1">
            {degree === 2 ? "친구의 친구" : "친구의 친구의 친구"}예요
          </p>
          {mutualFriends.length > 0 && (
            <p className="text-sm text-primary mb-4">
              공통 친구: {mutualFriends.map(f => f.name).join(", ")}
            </p>
          )}

          {/* 열람 전 색 궁합 teaser — 궁금증 유발 (실제 두 사람 컬러타입 궁합 기반) */}
          {teaser && (
            <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-xs mb-4">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span
                  className="w-9 h-9 rounded-full border-2 border-background shadow-soft"
                  style={{ backgroundColor: teaser.viewerColorHex ?? undefined }}
                  aria-hidden
                />
                <span className="text-sm text-muted-foreground">×</span>
                <span
                  className="w-9 h-9 rounded-full border-2 border-background shadow-soft"
                  style={{ backgroundColor: teaser.targetColorHex ?? undefined }}
                  aria-hidden
                />
              </div>
              <p className="text-xs font-semibold text-primary mb-1">🎨 AI 색 궁합</p>
              <p className="text-sm font-medium text-foreground leading-snug">{teaser.headline}</p>
              <p className="text-xs text-muted-foreground mt-2">열람하면 더 깊은 분석을 볼 수 있어요</p>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-xs mb-6">
            {unlockCost > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-1">필요 물감</p>
                <p className="text-3xl font-bold text-primary flex items-center justify-center gap-1.5">
                  <PaletteIcon className="w-6 h-6" />
                  {unlockCost.toLocaleString()} 물감
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  잔액에서 자동 차감돼요 · 이 프로필은 다시 무료로 볼 수 있어요
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-primary">베타 기간 무료</p>
                <p className="text-xs text-muted-foreground mt-2">
                  지금은 베타라 무료로 열람할 수 있어요
                </p>
              </>
            )}
          </div>

          <Button
            className="w-full max-w-xs gap-2 h-12 text-base"
            onClick={handlePay}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PaletteIcon className="w-4 h-4" />
            )}
            {isProcessingPayment ? "처리 중..." : unlockCost > 0 ? `${unlockCost.toLocaleString()} 물감 사용하기` : "지금 열람하기"}
          </Button>
          {unlockCost > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              1 물감 = 100원 · 잔액 부족 시 충전 화면으로 안내해 드려요
            </p>
          )}

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

  // hidden-profile fallback helper
  const getJobCategoryDisplay = (category: string | null) => jobCategoryLabel(category);

  const sortedPhotos = [...profile.photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const accentColor = profile.colorType?.hex ?? null;
  const heroSpecLine = buildHeroSpecLine(profile, getJobCategoryDisplay);
  const essayContextParts: string[] = [];
  if (mutualFriends.length > 0) {
    const names = mutualFriends.slice(0, 2).map((f) => f.name).join("·");
    essayContextParts.push(
      mutualFriends.length > 2 ? `공통 친구 ${names} 외` : `공통 친구 ${names}`,
    );
  }
  const commonInterests = (profile.introduction.interests ?? []).filter((i) =>
    myInterests.includes(i),
  );
  if (commonInterests.length > 0) {
    essayContextParts.push(`둘 다 ${commonInterests.slice(0, 3).join("·")}`);
  }
  const essayContextLine =
    essayContextParts.length > 0 ? essayContextParts.join(" · ") : null;

  return (
    <>
    <ProfileMagazineShell
      accentColor={accentColor}
      bottomBar={(
        <div className="sticky bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4 z-20">
          <div className="max-w-2xl mx-auto space-y-2">
          {inCoolTime && (
            <p className="text-xs text-center text-amber-600 flex items-center justify-center gap-1">
              ⏳ 매칭 성사 후 쿨타임 중 · {coolTimeRemainingDays}일 후 새 요청 가능
            </p>
          )}
          {degree === 1 ? (
            <div className="rounded-2xl bg-muted/40 border border-border p-4 text-center space-y-1">
              <p className="text-sm font-medium text-foreground">이미 친구예요</p>
              <p className="text-xs text-muted-foreground">
                지인끼리는 소개 요청 없이 직접 연락할 수 있어요.
              </p>
            </div>
          ) : !isPalettePick && mutualFriends.length === 0 ? (
            <div className="rounded-2xl bg-muted/60 border border-border p-4 text-center space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">소개 요청을 하려면 공통 친구가 필요해요</p>
                <p className="text-xs text-muted-foreground">친구를 연결하면 지인을 통한 신뢰있는 주선이 가능해요.</p>
              </div>
              {onNavigateToFriends && (
                <Button variant="outline" size="sm" className="w-full" onClick={onNavigateToFriends}>
                  친구 연결하기
                </Button>
              )}
            </div>
          ) : (
            <>
              <Button
                size="lg"
                className="w-full h-14 bg-brand-soft text-brand-strong hover:bg-brand-soft/90 font-bold"
                onClick={isPalettePick ? handleDirectRequest : handleMatchRequest}
                disabled={alreadyRequested || inCoolTime}
                variant={alreadyRequested || inCoolTime ? "secondary" : "default"}
              >
                <Send className="w-5 h-5 mr-2" />
                {alreadyRequested
                  ? (isPalettePick ? "부탁 완료" : "소개 요청 완료")
                  : inCoolTime
                  ? `쿨타임 중 (${coolTimeRemainingDays}일 남음)`
                  : isPalettePick
                  ? "팔리에게 이어달라고 부탁하기"
                  : "소개 요청하기"}
              </Button>
              {isPalettePick && !alreadyRequested && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  팔리가 주선자예요. 상대에게 바로 전달돼요.
                </p>
              )}
            </>
          )}
          </div>
        </div>
      )}
    >
      <ProfileMagazineHeader
        title={`${userInfo.nickname}님의 프로필`}
        onBack={onBack}
        accentColor={accentColor}
        rightSlot={(
          <>
            <button
              type="button"
              onClick={() => setShowHideConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" />
              추천받지 않기
            </button>
            <SafetyMenu
              targetName={userInfo.nickname}
              targetUserId={userId}
              onBlock={onBack}
            />
          </>
        )}
      />

      <ProfileMagazineHero
        nickname={userInfo.nickname}
        heroSpecLine={heroSpecLine}
        colorType={profile.colorType}
        primaryPhotoUrl={sortedPhotos[0]?.url ?? null}
      />

        {/* 연결 맥락 — 지인망 신뢰 신호 */}
        {!detailsHidden && mutualFriends.length > 0 && (
          <div
            className="mx-4 mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ backgroundColor: accentColor ? `${accentColor}14` : "hsl(var(--muted))" }}
          >
            <Users className="w-4 h-4 flex-shrink-0" style={{ color: accentColor ?? undefined }} />
            <p className="text-[13px] leading-snug text-foreground">
              <span className="font-semibold">{mutualFriends[0].name}</span>
              {mutualFriends.length > 1 ? ` 님 외 ${mutualFriends.length - 1}명` : " 님"}
              <span className="text-muted-foreground"> · 이 분을 이어줄 수 있어요</span>
            </p>
          </div>
        )}

        {/* 1촌 보증 CTA — 칩/한마디는 시트에서 옵셔널 */}
        {canVouch && !detailsHidden && (
          <div className="mx-4 mt-3 flex items-center gap-2">
            {isVouchedByMe ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowVouchSheet(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium border border-border bg-card hover:bg-muted transition-colors"
                >
                  <BadgeCheck className="w-4 h-4 text-brand-strong" />
                  보증 수정
                </button>
                <button
                  type="button"
                  onClick={handleUnvouch}
                  disabled={isVouching}
                  className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  {isVouching ? <Loader2 className="w-4 h-4 animate-spin" /> : "취소"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowVouchSheet(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium bg-brand-soft text-brand-strong hover:bg-brand-soft/90 transition-colors"
              >
                <BadgeCheck className="w-4 h-4" />
                이 분 보증하기
              </button>
            )}
          </div>
        )}

        {!detailsHidden && (
          <ProfileDiscoveryDeck
            profile={profile}
            targetUserId={userId}
            mutualFriends={mutualFriends}
          />
        )}

        <div className="p-6 space-y-6">
          {(
            <>
              {detailsHidden ? (
                <>
                  {/* 비공개 프로필 — 팩트만 노출 */}
                  <div className="space-y-3">
                    {PROFILE_GROUPS.map((group) => (
                      <CategoryCard key={group.key} group={group} values={toProfileValues(profile)} mode="view" />
                    ))}
                  </div>
                  <div className="rounded-2xl bg-muted/60 border border-border p-4 text-center">
                    <p className="text-sm font-medium text-foreground">핵심 정보만 공개된 프로필이에요</p>
                    <p className="text-xs text-muted-foreground mt-0.5">이 분은 지인에게 소개글·성향·이상형을 비공개했어요</p>
                  </div>
                </>
              ) : (
                <>
              <ProfilePhotoEssay
                introText={profile.introduction.text}
                interviewAnswers={profile.introduction.interviewAnswers}
                extraPhotos={sortedPhotos.slice(1)}
                contextLine={essayContextLine}
                accentColor={accentColor}
              />

              {profile.personalityTests && profile.personalityTests.length > 0 && (
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
              )}

              {vouchCount > 0 && (
                <div
                  className="rounded-xl p-4 border space-y-3"
                  style={{
                    backgroundColor: accentColor ? `${accentColor}10` : "hsl(var(--muted))",
                    borderColor: accentColor ? `${accentColor}25` : "hsl(var(--border))",
                  }}
                >
                  <p className="text-xs font-semibold text-muted-foreground">
                    친구 {vouchCount}명이 보증해요
                  </p>
                  <div className="space-y-2.5">
                    {vouches.slice(0, 5).map((v, i) => (
                      <div key={i} className="text-sm text-foreground leading-relaxed">
                        <span className="font-medium">{v.voucherNickname}</span>
                        <span className="text-muted-foreground"> · </span>
                        <span>{vouchDisplayLine(v)}</span>
                      </div>
                    ))}
                    {vouches.length === 0 && (
                      <p className="text-sm text-foreground leading-relaxed">
                        가깝게 지내는 지인들이 이 분을 보증했어요.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <ProfileDetailsCollapsible
                profile={profile}
                open={detailsExpanded}
                onOpenChange={setDetailsExpanded}
              />
                </>
              )}
            </>
          )}

          {!detailsHidden && <ProfileIdealTypeSummary idealType={profile.idealType} />}
        </div>
    </ProfileMagazineShell>

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

      <VouchSheet
        open={showVouchSheet}
        onClose={() => setShowVouchSheet(false)}
        targetName={userInfo?.nickname ?? ""}
        targetUserId={userId}
        initialPresetKey={myVouch?.presetKey}
        initialMessage={myVouch?.message}
        onSuccess={applyVouchResponse}
      />

      {/* Matchmaker Selection Modal */}
      {showMatchmakerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Step 1: Select Matchmaker */}
            {modalStep === 1 && (
              <div className="flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-right duration-300">
                {/* Modal Header */}
                <div className="border-b border-border px-6 py-4 shrink-0">
                  <h3 className="text-lg font-semibold text-center">소개 요청</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    어떤 분께 소개를 요청하시겠습니까?
                  </p>
                </div>

                {/* Matchmaker List */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {mutualFriends.map((friend, index) => (
                      <button
                        key={index}
                        onClick={() => handleMatchmakerSelect(friend)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                          selectedMatchmaker?.name === friend.name
                            ? "border-brand/50 bg-brand-soft/50"
                            : "border-border hover:border-primary/50 hover:bg-accent/5"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                              <Users className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{friend.name}</p>
                              {friend.phoneHint && (
                                <p className="text-xs text-muted-foreground">{friend.phoneHint}</p>
                              )}
                            </div>
                          </div>
                          {selectedMatchmaker?.name === friend.name && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-3 h-3 text-white"
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
                <div className="border-t border-border px-6 py-4 flex gap-3 shrink-0">
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
              <div className="flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-right duration-300">
                {/* Modal Header */}
                <div className="border-b border-border px-6 py-4 shrink-0">
                  <h3 className="text-lg font-semibold text-center">소개 요청</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    주선자에게 소개를 요청할게요
                  </p>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
                  {/* Selected matchmaker summary */}
                  <div className="flex items-center gap-3 bg-secondary rounded-xl px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">선택된 주선자</p>
                      <p className="font-semibold text-sm">{selectedMatchmaker?.name}</p>
                    </div>
                  </div>

                  {/* ADR 0044 — 소개 요청 100 물감 차감 안내 (압축: 헤드라인 + ⓘ) */}
                  <div className="rounded-xl bg-primary/5 border border-primary/15 px-3.5 py-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-primary">소개 요청 1회 — 100 물감 (10,000원)</p>
                    <InfoHint title="100 물감은 이렇게 쓰여요" tone="primary">
                      차감 즉시 요청이 진행돼요. 주선자가 거절하거나 만료되면 자동 환불됩니다.
                    </InfoHint>
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
                <div className="border-t border-border px-6 py-4 flex gap-2.5 shrink-0">
                  <Button variant="outline" className="flex-1" onClick={() => setModalStep(1)}>
                    이전
                  </Button>
                  <Button className="flex-1 gap-1.5" onClick={handleConfirmMatchRequest}>
                    100 물감으로 요청하기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
