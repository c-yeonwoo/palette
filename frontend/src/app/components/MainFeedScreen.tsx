import { useState, useEffect, useRef } from "react";
import { MapPin, SlidersHorizontal, X, Bell, Sparkles, Users, Palette as PaletteIcon, Infinity as InfinityIcon, BarChart3, Sprout, HeartHandshake } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { getCompatibilityDeterministic, COLOR_META, type ColorType } from "../../lib/colorCompatibility";
import { DailyMatchBanner } from "./DailyMatchBanner";
import { jobCategoryLabel } from "../../lib/jobCategory";
import { OnboardingTourCard } from "./onboarding/OnboardingTourCard";
import { onboardingProgress } from "../../lib/onboarding/progress";

interface ProfilePhoto {
  id: string;
  url: string;
  displayOrder: number;
  isPrimary: boolean;
}

interface BasicInfoDto {
  height: number | null;
  bodyType: string | null;
  mbti: string;
}

interface CareerInfoDto {
  category: string | null;
  company: string | null;
  incomeRange: string | null;
}

interface EducationInfoDto {
  level: string | null;
  school: string | null;
  major: string | null;
}

interface LocationInfoDto {
  sido: string | null;
  sigungu: string | null;
}

interface IntroductionDto {
  text: string | null;
  interests: string[] | null;
  interviewAnswers: any;
}

interface ProfileMetricsDto {
  completionRate: number;
  trustScore: number;
  viewCount: number;
}

interface ColorTypeDto {
  type: string | null;
  name: string | null;
  hex: string | null;
  description: string | null;
}

interface Profile {
  id: string;
  userId: string;
  basicInfo: BasicInfoDto;
  careerInfo: CareerInfoDto;
  educationInfo: EducationInfoDto;
  locationInfo: LocationInfoDto;
  introduction: IntroductionDto;
  photos: ProfilePhoto[];
  primaryPhotoUrl: string | null;
  metrics: ProfileMetricsDto;
  colorType?: ColorTypeDto | null;
}

export interface MutualFriend {
  name: string;
  phoneHint?: string;
  userId?: string;
}

interface FeedProfileItem {
  profile: Profile;
  mutualFriends: MutualFriend[];
  degree?: number;
  viewCost?: number;
  isOpened?: boolean;
  nickname?: string | null;
  age?: number | null;
}

interface FeedResponse {
  items: FeedProfileItem[];
  totalCount: number;
}


interface AiSignalRecommendation {
  profile: Profile | null;
  reason: string;
  similarityScore: number;
  isFree: boolean;
  isUnlocked: boolean;
  requiresPass?: boolean;
  unlockPrice: number;
  isOpened: boolean;
  teaserAge: number | null;
  teaserLocation: string | null;
  teaserColorType?: string | null;
  distanceKm?: number | null;
  candidateSource?: string | null;
  insight?: {
    summary: string;
    strengths: string[];
    watchOuts: string[];
    score: number;
  } | null;
}

interface AiSignalResponse {
  recommendations: AiSignalRecommendation[];
  generatedAt: string;
  isSubscriber?: boolean;
  passPriceMonthly?: number;
  passExpiresAt?: string | null;
}

interface MainFeedScreenProps {
  onProfileClick?: (item: FeedProfileItem) => void;
  onNotificationClick?: () => void;
  onNavigateToFriends?: () => void;
  unreadNotifications?: number;
}

interface UserProfile {
  userId: string;
  nickname: string;
  accountType: string;
  isProfileCompleted: boolean;
  colorType?: ColorTypeDto | null;
}

interface FilterState {
  ageMin: string;
  ageMax: string;
  heightMin: string;
  heightMax: string;
  degree: string;
  // ── 추가 (P0) ──
  colorTypes: ColorType[];   // 다중 선택. 비어있으면 전체
  activeOnly: boolean;        // 최근 7일 로그인만
  minTrustScore: "" | "50" | "80";  // 신뢰도(0-100) 최소 점수. 빈값=전체. '등급' 아님(브론즈/실버는 주선자 등급)
}

// 카드 커버 — 팔레트 '물감(paint)' 이미지. 탭하면 걷히고 사진이 드러난다.
const PALETTE_COVER_STYLE = {
  backgroundColor: "hsl(var(--muted))",
  backgroundImage: "url('/paint-overlay.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

interface MainFeedScreenPropsExtended extends MainFeedScreenProps {
  onNavigateToMyPage?: () => void;
  /** 물감 잔액 chip 탭 → 충전 화면 (잔액 가시성 — 비용 게이트 전에 잔액 인지) */
  onNavigateToBilling?: () => void;
  /** AI 허브 (팔레트 Pick 상세·궁합 리포트) */
  onNavigateToAiHub?: () => void;
}

export function MainFeedScreen({ onProfileClick, onNotificationClick, onNavigateToFriends, onNavigateToMyPage, onNavigateToBilling, onNavigateToAiHub, unreadNotifications = 0 }: MainFeedScreenPropsExtended) {
  const [feedItems, setFeedItems] = useState<FeedProfileItem[]>([]);
  const [aiSignal, setAiSignal] = useState<AiSignalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [friendCount, setFriendCount] = useState<number>(0);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ageMin: "", ageMax: "", heightMin: "", heightMax: "", degree: "",
    colorTypes: [], activeOnly: false, minTrustScore: "",
  });
  const [pendingFilters, setPendingFilters] = useState<FilterState>({ ...filters });
  const [balancePoints, setBalancePoints] = useState<number | null>(null);

  useEffect(() => {
    fetchUserAndFeed();
    // 헤더 물감 잔액 (ADR 0044) — 비용 게이트(열람/소개요청) 전에 잔액을 인지시킴
    api.get<{ points: number }>("/api/v1/billing/balance")
      .then((b) => setBalancePoints(b.points))
      .catch(() => { /* 잔액 조회 실패 시 chip 숨김 */ });
  }, []);

  const buildQueryString = (f: FilterState): string => {
    const params = new URLSearchParams();
    if (f.ageMin) params.set("ageMin", f.ageMin);
    if (f.ageMax) params.set("ageMax", f.ageMax);
    if (f.heightMin) params.set("heightMin", f.heightMin);
    if (f.heightMax) params.set("heightMax", f.heightMax);
    if (f.colorTypes.length > 0) params.set("colorTypes", f.colorTypes.join(","));
    if (f.activeOnly) params.set("activeOnly", "true");
    if (f.minTrustScore) params.set("minTrustScore", f.minTrustScore);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const [isFeedVisible, setIsFeedVisible] = useState(true);
  const [homeTab, setHomeTab] = useState<"recommend" | "network">("network");
  // 지인 탭 — 특정 지인(공통 친구)으로 필터 (클라이언트). null = 전체
  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);

  const fetchUserAndFeed = async (f: FilterState = filters) => {
    try {
      setLoading(true);
      const userData = await api.get<UserProfile>('/api/v1/auth/me');
      setUserProfile(userData);
      // 친구 카운트 — O-001 온보딩 안내 카드용
      api.get<unknown[]>('/api/v1/friends')
        .then(arr => setFriendCount(Array.isArray(arr) ? arr.length : 0))
        .catch(() => setFriendCount(0));
      if (userData.accountType === "REGULAR") {
        // 피드 노출 설정 확인
        const profileData = await api.get<{ settings?: { isAcceptingMatches?: boolean } }>('/api/v1/profile').catch(() => null);
        const visible = profileData?.settings?.isAcceptingMatches !== false;
        setIsFeedVisible(visible);

        if (visible) {
          const [feedResponse, aiSignalResponse] = await Promise.all([
            api.get<FeedResponse>(`/api/v1/feed${buildQueryString(f)}`),
            api.get<AiSignalResponse>("/api/v1/feed/ai-signal").catch(() => null),
          ]);
          setFeedItems(feedResponse.items);
          setAiSignal(aiSignalResponse);
        }
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
      toast.error("피드를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const refetchAiSignal = async () => {
    const updated = await api.get<AiSignalResponse>("/api/v1/feed/ai-signal").catch(() => null);
    if (updated) setAiSignal(updated);
  };

  const applyFilters = () => {
    setFilters(pendingFilters);
    setShowFilter(false);
    setHomeTab("network");
    fetchUserAndFeed(pendingFilters);
  };

  const resetFilters = () => {
    const empty: FilterState = {
      ageMin: "", ageMax: "", heightMin: "", heightMax: "", degree: "",
      colorTypes: [], activeOnly: false, minTrustScore: "",
    };
    setPendingFilters(empty);
    setFilters(empty);
    setShowFilter(false);
    fetchUserAndFeed(empty);
  };

  const hasActiveFilters = (
    !!filters.ageMin || !!filters.ageMax ||
    !!filters.heightMin || !!filters.heightMax ||
    filters.colorTypes.length > 0 ||
    filters.activeOnly ||
    !!filters.minTrustScore
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* 통일 헤더 — sticky + bg-card/95 + border-b + h-14 (ADR 0014) */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">소개</h1>
          <div className="flex items-center gap-2">
            {/* 물감 잔액 chip — 탭하면 충전. 비용 게이트 전에 잔액 인지 (MyPage 헤더와 동일 패턴) */}
            {balancePoints !== null && (
              <button
                onClick={onNavigateToBilling}
                className="flex items-center gap-1 h-9 pl-2.5 pr-3 rounded-full bg-brand-soft text-brand-strong hover:brightness-95 transition-all"
                aria-label="물감 잔액 · 충전"
              >
                <PaletteIcon className="w-[15px] h-[15px]" />
                <span className="text-sm font-semibold">{balancePoints.toLocaleString()}</span>
              </button>
            )}
            <button
              onClick={onNotificationClick}
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-foreground"
              aria-label="알림"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
            {onNavigateToAiHub && (
              <button
                onClick={onNavigateToAiHub}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-foreground"
                aria-label="AI 허브"
              >
                <Sparkles className="w-[18px] h-[18px]" />
              </button>
            )}
            {userProfile?.accountType !== "MATCHMAKER_ONLY" && (
              <button
                onClick={() => { setPendingFilters({ ...filters }); setShowFilter(true); }}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  showFilter || hasActiveFilters ? "bg-brand-soft text-brand-strong" : "hover:bg-muted/50 text-foreground"
                }`}
                aria-label="필터"
              >
                <SlidersHorizontal className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 온보딩 안내 카드 (O-001) — 일반 회원만, 모든 단계 완료/dismiss 시 자동 숨김 */}
      {userProfile?.accountType === "REGULAR" && (
        <OnboardingTourCard
          hasFriends={friendCount > 0}
          hasViewedProfile={onboardingProgress.hasViewedProfile()}
          hasSentMatchRequest={onboardingProgress.hasSentMatchRequest()}
          onNavigateToFriends={onNavigateToFriends}
        />
      )}

      {/* Active filter chips — 주선자에게는 숨김 */}
      {hasActiveFilters && userProfile?.accountType !== "MATCHMAKER_ONLY" && (
        <div className="max-w-2xl mx-auto px-5 pt-3">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {(filters.ageMin || filters.ageMax) && (
              <span className="text-xs bg-brand-soft text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">
                {filters.ageMin || "?"}-{filters.ageMax || "?"}세
              </span>
            )}
            {(filters.heightMin || filters.heightMax) && (
              <span className="text-xs bg-brand-soft text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">
                {filters.heightMin || "?"}-{filters.heightMax || "?"}cm
              </span>
            )}
            {filters.colorTypes.length > 0 && (
              <span className="text-xs bg-brand-soft text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">
                {filters.colorTypes.length === 1 ? COLOR_META[filters.colorTypes[0]].name : `${filters.colorTypes.length}색`}
              </span>
            )}
            {filters.activeOnly && (
              <span className="text-xs bg-brand-soft text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">
                최근 7일
              </span>
            )}
            {filters.minTrustScore && (
              <span className="text-xs bg-brand-soft text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">
                신뢰도 {filters.minTrustScore}+
              </span>
            )}
            <button onClick={resetFilters} className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-muted whitespace-nowrap">
              초기화
            </button>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilter && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilter(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-background overflow-y-auto animate-slide-in-right"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background/90 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-base">필터</h3>
              <button onClick={() => setShowFilter(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-6 space-y-7">
              <FilterSection title="나이">
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="최소" min={18} max={60}
                    value={pendingFilters.ageMin}
                    onChange={e => setPendingFilters(p => ({ ...p, ageMin: e.target.value }))}
                    className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <input type="number" placeholder="최대" min={18} max={60}
                    value={pendingFilters.ageMax}
                    onChange={e => setPendingFilters(p => ({ ...p, ageMax: e.target.value }))}
                    className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-sm text-muted-foreground">세</span>
                </div>
              </FilterSection>

              <FilterSection title="키">
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="최소" min={140} max={200}
                    value={pendingFilters.heightMin}
                    onChange={e => setPendingFilters(p => ({ ...p, heightMin: e.target.value }))}
                    className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <input type="number" placeholder="최대" min={140} max={200}
                    value={pendingFilters.heightMax}
                    onChange={e => setPendingFilters(p => ({ ...p, heightMax: e.target.value }))}
                    className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <span className="text-sm text-muted-foreground">cm</span>
                </div>
              </FilterSection>

              {/* 색깔 (8개 chip 다중 선택) — 비어있으면 전체 */}
              <FilterSection title="색깔">
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(COLOR_META) as ColorType[]).map((ct) => {
                    const meta = COLOR_META[ct];
                    const selected = pendingFilters.colorTypes.includes(ct);
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => setPendingFilters(p => ({
                          ...p,
                          colorTypes: selected
                            ? p.colorTypes.filter(c => c !== ct)
                            : [...p.colorTypes, ct],
                        }))}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          selected
                            ? "border-transparent bg-foreground text-background"
                            : "border-border bg-muted/40 hover:bg-muted text-foreground"
                        }`}
                      >
                        {meta.name.replace("따뜻한 ", "").replace("차분한 ", "").replace("활기찬 ", "").replace("부드러운 ", "").replace("싱그러운 ", "").replace("우아한 ", "").replace("밝은 ", "").replace("세련된 ", "")}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">아무것도 안 고르면 전체 색이 보여요</p>
              </FilterSection>

              {/* 활성 사용자 (최근 7일 로그인) — 토글 */}
              <FilterSection title="최근 활동">
                <button
                  type="button"
                  onClick={() => setPendingFilters(p => ({ ...p, activeOnly: !p.activeOnly }))}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                    pendingFilters.activeOnly
                      ? "border-foreground bg-foreground/5"
                      : "border-border bg-muted/40"
                  }`}
                >
                  <span className="text-sm">최근 7일 접속한 사람만</span>
                  <span className={`text-xs font-bold ${pendingFilters.activeOnly ? "text-foreground" : "text-muted-foreground"}`}>
                    {pendingFilters.activeOnly ? "ON" : "OFF"}
                  </span>
                </button>
              </FilterSection>

              {/* 신뢰도 — 사진·영상 인증 점수 기준 (등급 아님). 단일 선택 */}
              <FilterSection title="신뢰도">
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    ["", "전체"],
                    ["50", "보통 이상"],
                    ["80", "높음"],
                  ] as const).map(([val, label]) => (
                    <button
                      key={val || "all"}
                      type="button"
                      onClick={() => setPendingFilters(p => ({ ...p, minTrustScore: val }))}
                      className={`text-xs px-2 py-2 rounded-xl border transition-colors ${
                        pendingFilters.minTrustScore === val
                          ? "border-transparent bg-foreground text-background font-semibold"
                          : "border-border bg-muted/40 hover:bg-muted text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">사진·영상 인증으로 매겨지는 신뢰도 점수 기준</p>
              </FilterSection>

            </div>
            <div className="sticky bottom-0 bg-background/90 backdrop-blur-xl border-t border-border px-6 py-4 flex gap-2.5">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={resetFilters}>초기화</Button>
              <Button className="flex-1 rounded-xl h-11" onClick={applyFilters}>적용하기</Button>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const myColor = (userProfile?.colorType?.type ?? null) as ColorType | null;
        const isMatchmakerOnly = userProfile?.accountType === "MATCHMAKER_ONLY";
        const hasAiSignal = !!aiSignal && aiSignal.recommendations.length > 0;
        return (
          <div className="max-w-2xl mx-auto px-5">
            {loading ? (
              <div className="pt-5"><LoadingState /></div>
            ) : isMatchmakerOnly ? (
              <EmptyState title="주선자 전용 계정" description="주선 기능은 주선자 대시보드에서 이용하실 수 있습니다" />
            ) : !isFeedVisible ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
                <span className="text-4xl">🙈</span>
                <p className="font-semibold text-foreground">소개받기가 잠시 멈춰 있어요</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  내 프로필이 지인의 피드에 보이지 않는 상태예요.<br />
                  마이페이지 → 공개 설정 → 소개 받기를 켜면 다시 시작돼요.
                </p>
              </div>
            ) : (
              <>
                {/* 오늘의 컬러 궁합 — 내 팔레트 컬러가 나온 뒤에만 노출 (mock 제거, ADR 0061) */}
                {myColor && (
                  <div className="pt-4">
                    <DailyMatchBanner myColorType={myColor} />
                  </div>
                )}

                {/* 내부 탭 — 지인 / 팔레트 Pick */}
                <div className="flex gap-1 p-1 mt-4 rounded-2xl bg-surface-sunken">
                  {([["network", "지인"], ["recommend", "팔레트 Pick"]] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setHomeTab(key)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        homeTab === key ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="pt-4">
                  {homeTab === "recommend" ? (
                    hasAiSignal ? (
                      <AiSignalSection
                        aiSignal={aiSignal!}
                        myColorType={myColor}
                        onChanged={refetchAiSignal}
                        onProfileClick={(item) => {
                          const feedItem = feedItems.find(f => f.profile.userId === item.profile.userId);
                          // 팔레트 Pick = 서비스 주선(degree 0). 같은 유저가 지인 피드에 있어도
                          // 주선자 선택/성의표시 없이 바로 요청되도록 degree 0 강제 (지인 모달 우회).
                          onProfileClick?.({ ...(feedItem ?? item), degree: 0, viewCost: 0, mutualFriends: [] });
                        }}
                      />
                    ) : (
                      <PalettePickEmptyGuide onNavigateToFriends={onNavigateToFriends} />
                    )
                  ) : feedItems.length === 0 ? (
                    hasActiveFilters ? (
                      <EmptyState title="조건에 맞는 지인이 없어요" description="필터 조건을 조정해보세요" />
                    ) : friendCount > 0 ? (
                      <EmptyNetworkGuide onNavigateToFriends={onNavigateToFriends} friendCount={friendCount} />
                    ) : (
                      <FirstTimeGuide onNavigateToFriends={onNavigateToFriends} />
                    )
                  ) : (() => {
                    // 지인(공통 친구) 칩 필터 — 현재 피드의 공통 친구로 클라이언트 필터
                    const connectors = Array.from(
                      new Set(feedItems.flatMap((i) => i.mutualFriends.map((m) => m.name)).filter(Boolean))
                    ).sort();
                    const activeConnector = selectedConnector && connectors.includes(selectedConnector) ? selectedConnector : null;
                    const networkItems = activeConnector
                      ? feedItems.filter((i) => i.mutualFriends.some((m) => m.name === activeConnector))
                      : feedItems;
                    return (
                      <>
                        {connectors.length > 1 && (
                          <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
                            <button
                              onClick={() => setSelectedConnector(null)}
                              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                activeConnector === null
                                  ? "border-transparent bg-foreground text-background font-semibold"
                                  : "border-border bg-muted/40 hover:bg-muted text-foreground"
                              }`}
                            >
                              전체
                            </button>
                            {connectors.map((name) => (
                              <button
                                key={name}
                                onClick={() => setSelectedConnector(activeConnector === name ? null : name)}
                                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                  activeConnector === name
                                    ? "border-transparent bg-foreground text-background font-semibold"
                                    : "border-border bg-muted/40 hover:bg-muted text-foreground"
                                }`}
                              >
                                {name}님 소개
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          {networkItems.map((item) => (
                            <ProfileCard
                              key={item.profile.userId}
                              item={item}
                              myColorType={myColor}
                              onClick={() => onProfileClick?.(item)}
                            />
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function ProfileCard({
  item,
  myColorType,
  onClick,
}: {
  item: FeedProfileItem;
  myColorType: ColorType | null;
  onClick: () => void;
}) {
  // ADR 0044 — viewCost 는 "물감(P)" 단위. 친친 기본값 20 (커피 한잔값 2,000원).
  const { profile, mutualFriends, viewCost = 20, isOpened = false, nickname = null, age = null } = item;
  const [revealed, setRevealed] = useState(isOpened);
  const [peeling, setPeeling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const job = jobCategoryLabel(profile.careerInfo.category, { short: true });
  const location = profile.locationInfo.sido;

  const theirColorType = (profile.colorType?.type ?? null) as ColorType | null;
  const compat = getCompatibilityDeterministic(myColorType, theirColorType, profile.userId);
  const theirMeta = theirColorType ? COLOR_META[theirColorType] : null;

  const degree = item.degree;

  const handleClick = () => {
    if (revealed) {
      onClick();
      return;
    }
    if (peeling) return;
    setPeeling(true);
    timerRef.current = setTimeout(() => {
      setRevealed(true);
      setPeeling(false);
      api.post(`/api/v1/feed/open/${profile.userId}`, {}).catch(() => {});
    }, 720);
  };

  const flipped = peeling || revealed;
  const accentHex = theirMeta?.hex ?? null;

  return (
    <div onClick={handleClick} className="cursor-pointer select-none">
      {/* 사진 — 3D 플립 (탭하면 180° 뒤집히며 사진 공개, dim 없음) */}
      <div className="relative aspect-[3/4]" style={{ perspective: "1000px" }}>
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transitionTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)",
          }}
        >
          {/* ── 앞면 (물감 커버) — 잠긴 상태 ── */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-card"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", ...PALETTE_COVER_STYLE }}
          />

          {/* ── 뒷면 (사진) — 4면 라운드. 하단 살짝 페이드 (info card overlap 영역 자연스럽게) ── */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-card bg-muted"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {profile.primaryPhotoUrl ? (
              <img src={profile.primaryPhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted via-accent to-muted/60 flex items-center justify-center">
                <span className="text-5xl opacity-20 select-none">👤</span>
              </div>
            )}

            {/* 하단 페이드 — info card overlap 부분 (사진 하단 ~20px) 만 살짝 어둡게 */}
            {revealed && (
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-black/15 pointer-events-none" />
            )}

            {compat && (
              <div className="absolute top-2 right-2">
                <span className="text-xs font-bold bg-white/90 text-foreground rounded-full px-2 py-0.5 shadow-sm">
                  {compat.label} {compat.score}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 정보 카드 — 사진 밖, 사진 하단을 ~20px 살짝 overlap. 좌측 컬러 액센트 (ADR 0001 "각자의 색") */}
      {revealed && (
        <div
          className="relative z-10 -mt-5 mx-2 rounded-2xl bg-card px-3 py-2.5 shadow-card overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500"
          style={accentHex ? { boxShadow: `inset 0 1px 0 ${accentHex}40, 0 4px 14px rgba(0,0,0,0.06)` } : undefined}
        >
          {accentHex && (
            <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accentHex }} aria-hidden />
          )}
          <div className="pl-2.5">
            <CardInfoSection nickname={nickname ?? null} job={job} age={age ?? null} region={location} colorHex={accentHex} colorName={theirMeta?.name ?? null} />
          </div>
        </div>
      )}

      {/* 지인 연결 — 카드 하단 padding 과 정렬(px-3), 살짝 가까이(mt-1.5), 아이콘 prefix 로 안착감 */}
      <div className="mt-1.5 px-3">
        <RelationshipBadge degree={degree} mutualFriends={mutualFriends} />
      </div>
    </div>
  );
}

/** 카드 하단 소개 섹션 — 닉네임 / 직업군 / 나이 · 지역 / 색 */
function CardInfoSection({
  nickname,
  job,
  age,
  region,
  colorHex,
  colorName,
}: {
  nickname: string | null;
  job: string | null;
  age: number | null;
  region: string | null;
  colorHex: string | null;
  colorName: string | null;
}) {
  // 한 줄로 압축 — frosted glass overlay 안에서 컴팩트하게.
  const detail = [job, age ? `${age}세` : null, region].filter(Boolean).join(" · ");
  return (
    <>
      {nickname && (
        <p className="text-sm font-extrabold text-foreground truncate leading-tight tracking-tight">{nickname}</p>
      )}
      {detail && (
        <p className="text-[11px] font-semibold text-foreground/70 truncate mt-0.5">{detail}</p>
      )}
      {colorHex && colorName && (
        <p
          className="text-[11px] font-bold truncate mt-1 leading-none"
          style={{ color: colorHex }}
        >
          {colorName}
        </p>
      )}
    </>
  );
}

function RelationshipBadge({ degree, mutualFriends }: { degree?: number; mutualFriends: MutualFriend[] }) {
  // 1촌: 직접 연결 — "내 지인" pill + 보조 텍스트
  if (degree === 1) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="flex-shrink-0 text-[10px] font-bold bg-brand-soft text-primary rounded-full px-1.5 py-0.5 leading-none">
          내 지인
        </span>
        <p className="text-[11px] font-medium text-muted-foreground truncate">직접 아는 사이</p>
      </div>
    );
  }

  // 2촌: 공통 지인 통해 — Users 아이콘 + 라벨로 안착감 (정보 카드 푸터 hint 느낌)
  if (degree === 2 && mutualFriends.length > 0) {
    const connector = mutualFriends[0].name;
    const more = mutualFriends.length - 1;
    const label = more > 0 ? `${connector}님 외 ${more}명의 지인` : `${connector}님의 지인`;
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <Users className="w-3 h-3 text-muted-foreground/70 flex-shrink-0" aria-hidden />
        <p className="text-[11px] font-semibold text-muted-foreground truncate">{label}</p>
      </div>
    );
  }

  // degree 없이 mutualFriends만 있는 경우 (fallback)
  if (mutualFriends.length > 0) {
    const name = mutualFriends[0].name;
    const more = mutualFriends.length - 1;
    const label = more > 0 ? `${name}님 외 ${more}명의 지인` : `${name}님의 지인`;
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <Users className="w-3 h-3 text-muted-foreground/70 flex-shrink-0" aria-hidden />
        <p className="text-[11px] font-semibold text-muted-foreground truncate">{label}</p>
      </div>
    );
  }

  return null;
}

function AiSignalSection({
  aiSignal,
  myColorType,
  onProfileClick,
  onChanged,
}: {
  aiSignal: AiSignalResponse;
  myColorType: ColorType | null;
  onProfileClick?: (item: FeedProfileItem) => void;
  onChanged?: () => void | Promise<void>;
}) {
  const recommendations = aiSignal.recommendations;
  const isSubscriber = aiSignal.isSubscriber ?? false;
  const passPrice = aiSignal.passPriceMonthly ?? 9900;
  const hasPublicPool = recommendations.some(r => r.candidateSource === "PUBLIC");
  const hasAcquaintancePool = recommendations.some(r => r.candidateSource === "ACQUAINTANCE" || !r.candidateSource);
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (subscribing) return;
    setSubscribing(true);
    try {
      await api.post("/api/v1/feed/ai-signal/subscribe", {});
      await onChanged?.();
      setShowPaywall(false);
      toast.success("팔레트 Pick 패스가 시작됐어요 ✨");
    } catch {
      // 402 (실 결제 모드, paymentKey 없음) 등 — 베타에서는 결제 미연동
      toast.error("결제 연동을 준비 중이에요. 곧 만나요!");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* 로고 에코 — 두 색의 조화(골드+로즈) 미니 마크. 조화 보조색 적용 지점 (ADR 0073 §2-1c) */}
          <span className="relative inline-block w-6 h-4 flex-shrink-0" aria-hidden="true">
            <span className="absolute left-0 top-0 w-4 h-4 rounded-full bg-brand opacity-80" />
            <span className="absolute right-0 top-0 w-4 h-4 rounded-full bg-brand-2 opacity-80" />
          </span>
          <p className="text-sm text-muted-foreground truncate">
            {isSubscriber ? "오늘 당신과 가장 잘 맞는 색을 골랐어요" : "프로필 궁합도를 기반으로 추천해드려요"}
          </p>
        </div>
        {isSubscriber && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-soft text-brand-strong flex-shrink-0">PASS</span>
        )}
      </div>

      {/* P-008 — 콜드스타트 vs 지인망 모드 라벨 */}
      {(hasPublicPool || hasAcquaintancePool) && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {hasAcquaintancePool && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              지인 추천
            </span>
          )}
          {hasPublicPool && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand-strong">
              공개 발견
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {recommendations.map((rec, i) => {
          if (rec.isUnlocked && rec.profile) {
            return (
              <AiSignalCard
                key={i}
                rec={rec}
                myColorType={myColorType}
                onProfileClick={onProfileClick}
              />
            );
          }

          // 잠긴 카드 — 구독 패스 필요. 궁합 % 티저로 유도.
          const teaserColor = (rec.teaserColorType ?? null) as ColorType | null;
          const teaserCompat = getCompatibilityDeterministic(myColorType, teaserColor, `signal-${i}`);
          const teaserSub = [rec.teaserAge ? `${rec.teaserAge}세` : null, rec.teaserLocation].filter(Boolean).join(" · ");
          return (
            <div key={i}>
              <button
                onClick={() => setShowPaywall(true)}
                className="block w-full text-left relative rounded-2xl overflow-hidden aspect-[3/4] shadow-card active:scale-[0.98] transition-transform"
                style={PALETTE_COVER_STYLE}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center">
                  <div className="flex flex-col items-center bg-white/80 rounded-2xl px-3.5 py-2 shadow-sm">
                    {teaserCompat ? (
                      <>
                        <span className="text-3xl font-extrabold text-foreground">{teaserCompat.score}%</span>
                        <span className="text-xs text-muted-foreground">{teaserCompat.label} 궁합</span>
                      </>
                    ) : (
                      <Sparkles className="w-5 h-5 text-brand-strong" />
                    )}
                    {teaserSub && <span className="text-xs text-muted-foreground mt-0.5">{teaserSub}</span>}
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-brand-soft text-brand-strong shadow-sm">
                    <Sparkles className="w-3 h-3" /> 구독하고 보기
                  </span>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 bg-white/85 text-brand-strong shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* 비구독자: 구독 유도 한 줄 */}
      {!isSubscriber && (
        <button
          onClick={() => setShowPaywall(true)}
          className="mt-2 w-full flex items-center justify-between gap-2 rounded-xl bg-card border border-border px-3.5 py-2.5 shadow-card active:scale-[0.99] transition-transform"
        >
          <span className="flex items-center gap-2 text-xs text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            그날 추천 모두 열람 + 궁합 리포트
          </span>
          <span className="text-xs font-bold text-brand-strong whitespace-nowrap">월 {passPrice.toLocaleString()}원 →</span>
        </button>
      )}

      {showPaywall && (
        <AiPassPaywall
          passPrice={passPrice}
          subscribing={subscribing}
          onSubscribe={handleSubscribe}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}

function AiPassPaywall({
  passPrice,
  subscribing,
  onSubscribe,
  onClose,
}: {
  passPrice: number;
  subscribing: boolean;
  onSubscribe: () => void;
  onClose: () => void;
}) {
  const benefits = [
    { Icon: InfinityIcon, title: "그날 추천 모두 열람", desc: "무료 열람 후에도 그날 추천된 상대를 전부 바로 볼 수 있어요" },
    { Icon: BarChart3, title: "궁합 리포트", desc: "왜 잘 맞는지 색깔 기반 상세 분석 제공" },
    { Icon: Sparkles, title: "우선 추천", desc: "더 정교한 궁합 기반으로 먼저 소개" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-2xl p-6 shadow-overlay animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-brand-strong" />
          </div>
          <h3 className="text-lg font-bold text-foreground">팔레트 Pick 패스</h3>
          <p className="text-sm text-muted-foreground mt-1">색 궁합으로 매일 인연을 추천받아요</p>
        </div>

        <div className="space-y-3 mb-5">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-xl bg-brand-soft flex items-center justify-center flex-shrink-0">
                <b.Icon className="w-4 h-4 text-brand-strong" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-muted/60 px-4 py-3 mb-4 flex items-baseline justify-center gap-1">
          <span className="text-2xl font-extrabold text-foreground">{passPrice.toLocaleString()}원</span>
          <span className="text-sm text-muted-foreground">/ 월</span>
        </div>

        <button
          onClick={onSubscribe}
          disabled={subscribing}
          className="w-full py-3.5 rounded-2xl bg-brand-soft text-brand-strong font-bold shadow-card active:scale-95 transition-transform disabled:opacity-60"
        >
          {subscribing ? "처리 중..." : "구독하고 시작하기"}
        </button>
        <button onClick={onClose} className="w-full py-2.5 mt-1 text-sm text-muted-foreground">
          다음에 할게요
        </button>
      </div>
    </div>
  );
}

function AiSignalCard({
  rec,
  myColorType,
  onProfileClick,
}: {
  rec: AiSignalRecommendation;
  myColorType: ColorType | null;
  onProfileClick?: (item: FeedProfileItem) => void;
}) {
  const profile = rec.profile!;
  const [revealed, setRevealed] = useState(rec.isOpened);
  const [peeling, setPeeling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const job = jobCategoryLabel(profile.careerInfo.category, { short: true });
  const location = profile.locationInfo.sido;
  const theirColor = (profile.colorType?.type ?? null) as ColorType | null;
  const compat = getCompatibilityDeterministic(myColorType, theirColor, profile.userId);
  const accentHex = theirColor ? COLOR_META[theirColor]?.hex ?? null : null;

  const handleClick = () => {
    if (revealed) {
      onProfileClick?.({ profile, mutualFriends: [] as MutualFriend[], degree: 0, viewCost: 0 });
      return;
    }
    if (peeling) return;
    // 플립 시작 → 0.7s 후 revealed (플립 완료). 한 번 더 탭하면 상세로.
    setPeeling(true);
    timerRef.current = setTimeout(() => {
      setRevealed(true);
      setPeeling(false);
      api.post(`/api/v1/feed/open/${profile.userId}`, {}).catch(() => {});
    }, 720);
  };

  // 플립 여부: peeling(진행 중) 또는 revealed(완료) 면 뒷면(프로필)이 앞으로
  const flipped = peeling || revealed;

  return (
    <div onClick={handleClick} className="cursor-pointer select-none">
      <div className="relative aspect-[3/4]" style={{ perspective: "1000px" }}>
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transitionTimingFunction: "cubic-bezier(0.4, 0.0, 0.2, 1)",
          }}
        >
          {/* ── 앞면 (팔레트 무지개 워시 + 티저) — 잠긴 상태 ── */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-sm flex flex-col items-center justify-center gap-2"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", ...PALETTE_COVER_STYLE }}
          >
            {(rec.teaserAge || rec.teaserLocation) && (
              <p className="text-foreground text-xs font-semibold bg-white/75 rounded-full px-2.5 py-0.5">
                {[rec.teaserAge ? `${rec.teaserAge}세` : null, rec.teaserLocation].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="absolute top-2 left-2">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 bg-white/85 text-brand-strong shadow-sm">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
          </div>

          {/* ── 뒷면 (사진) — 4면 라운드. 하단 살짝 페이드 (info card overlap 영역) ── */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-card bg-muted"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {profile.primaryPhotoUrl ? (
              <img src={profile.primaryPhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted via-accent to-muted/60" />
            )}
            {revealed && (
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-black/15 pointer-events-none" />
            )}
            {/* ADR 0025 시절 카드별 'FREE' 뱃지는 ADR 0044/0045 에서 폐기.
                팔레트픽이 계정당 첫 달 통째 무료(AiPassSubscription TRIAL) + 이후 29,900원/월 구독 모델이라
                카드 단위 무료/유료 구분이 불필요. 트라이얼 만료 시점은 별도 글로벌 배너로 안내. */}
            {compat && (
              <div className="absolute top-2 left-2">
                <span className="text-xs font-bold bg-white/90 text-foreground rounded-full px-1.5 py-0.5 shadow-sm">
                  {compat.label} {compat.score}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 정보 카드 — 사진 밖, 사진 하단을 ~20px 살짝 overlap. 좌측 컬러 액센트 */}
      {revealed && (
        <div
          className="relative z-10 -mt-5 mx-2 rounded-2xl bg-card px-3 py-2.5 shadow-card overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500"
          style={accentHex ? { boxShadow: `inset 0 1px 0 ${accentHex}40, 0 4px 14px rgba(0,0,0,0.06)` } : undefined}
        >
          {accentHex && (
            <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accentHex }} aria-hidden />
          )}
          <div className="pl-2.5">
            <CardInfoSection nickname={null} job={job} age={rec.teaserAge ?? null} region={location} colorHex={accentHex} colorName={theirColor ? COLOR_META[theirColor]?.name ?? null : null} />
            {/* P-007 — Pick 3-bullet 근거 */}
            {rec.insight && (rec.insight.strengths.length > 0 || rec.insight.summary) && (
              <div className="mt-2 pt-2 border-t border-border/60 space-y-1">
                {rec.insight.summary && (
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{rec.insight.summary}</p>
                )}
                {rec.insight.strengths.slice(0, 3).map((s, i) => (
                  <p key={i} className="text-[11px] text-foreground flex items-start gap-1">
                    <span className="text-brand-strong mt-0.5">•</span>
                    <span className="line-clamp-1">{s}</span>
                  </p>
                ))}
              </div>
            )}
            {rec.candidateSource === "PUBLIC" && rec.distanceKm != null && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {rec.distanceKm <= 1 ? "가까운 거리" : `약 ${rec.distanceKm}km`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="rounded-2xl aspect-[3/4] bg-muted" />
          <div className="h-3 bg-muted rounded-full mt-2 w-3/4 mx-0.5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center col-span-2">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <MapPin className="w-7 h-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[240px] leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * 신규 사용자가 처음 메인 피드에 진입했을 때 보이는 step-by-step 가이드.
 * "앱이 죽은 것 같은" 빈 화면 대신, 무엇을 해야할지 명확히 안내.
 */
function FirstTimeGuide({ onNavigateToFriends }: { onNavigateToFriends?: () => void }) {
  const steps = [
    {
      Icon: PaletteIcon,
      title: "프로필 다듬기",
      desc: "마이프로필에서 사진을 추가하면 매칭 확률이 올라가요",
    },
    {
      Icon: Users,
      title: "지인 연결하기",
      desc: "친구를 초대하면 친구의 친구까지 소개받을 수 있어요",
    },
    {
      Icon: Sparkles,
      title: "AI 시그널 받기",
      desc: "매일 한 명, AI가 골라준 추천을 무료로 받아보세요",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 환영 메시지 */}
      <div className="bg-brand-soft rounded-2xl p-5 border border-border-subtle">
        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center mb-3">
          <Sparkles className="w-5 h-5 text-brand-strong" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">팔레트에 오신 걸 환영해요</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          지인 네트워크로 신뢰할 수 있는 만남을 만들어가요.
          <br />
          아래 단계로 천천히 시작해보세요.
        </p>
      </div>

      {/* Step-by-step 카드 */}
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-xl p-4 flex items-start gap-3"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center">
              <s.Icon className="w-5 h-5 text-brand-strong" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-muted-foreground font-medium">STEP {i + 1}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {onNavigateToFriends && (
        <button
          onClick={onNavigateToFriends}
          className="w-full bg-brand-soft text-brand-strong font-semibold py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Users className="w-4 h-4" />
          지금 친구 연결하기
        </button>
      )}

      <p className="text-xs text-muted-foreground/60 text-center pt-1">
        지인이 없어도 가까운 지역의 공개 프로필을 둘러볼 수 있어요
      </p>
    </div>
  );
}

/**
 * D-001 — 친구는 있지만 친친 풀이 비어있는 케이스.
 * "친구의 친구가 아직 가입 전" 메시지 + 친구 더 초대 유도.
 */
function EmptyNetworkGuide({ friendCount, onNavigateToFriends }: { friendCount: number; onNavigateToFriends?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="relative mb-7">
        <div className="w-20 h-20 rounded-full bg-brand-soft flex items-center justify-center">
          <Sprout className="w-9 h-9 text-brand-strong" />
        </div>
      </div>

      <h3 className="text-base font-bold mb-1.5">친구의 친구는 곧 만날 수 있어요</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mb-3">
        지인 <strong className="text-foreground">{friendCount}명</strong>과 연결돼 있어요.<br />
        그분들의 친구가 가입하면 자동으로 풀에 나타나요.
      </p>
      <p className="text-xs text-muted-foreground/80 max-w-[260px] mb-7 leading-relaxed">
        팔레트는 1·2촌 네트워크 기반이에요. 지인을 더 초대하면 풀이 빠르게 늘어요.
      </p>

      {onNavigateToFriends && (
        <button
          onClick={onNavigateToFriends}
          className="flex items-center gap-2 bg-foreground text-background font-semibold px-5 py-2.5 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          <Users className="w-4 h-4" />
          지인 더 초대하기
        </button>
      )}

      <p className="text-[11px] text-muted-foreground/60 mt-3 max-w-[240px]">
        초대된 지인이 가입하면 양쪽에 열람권 1장 보너스
      </p>
    </div>
  );
}

/**
 * 팔레트 Pick 추천이 아직 비어있을 때 (콜드스타트 — 주변 사용자·지인망이 얇음).
 * 밋밋한 "준비 중" 대신 무엇을 하면 채워지는지 따뜻하게 안내.
 */
function PalettePickEmptyGuide({ onNavigateToFriends }: { onNavigateToFriends?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-brand-soft flex items-center justify-center mb-6">
        <Sparkles className="w-9 h-9 text-brand-strong" />
      </div>
      <h3 className="text-base font-bold mb-1.5">팔레트 Pick이 곧 도착해요</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mb-3">
        색 궁합으로 매일 어울리는 인연을 골라드려요.<br />
        지금은 주변에서 잘 맞는 분을 찾는 중이에요.
      </p>
      <p className="text-xs text-muted-foreground/80 max-w-[270px] mb-7 leading-relaxed">
        프로필(나의 색·이상형)을 채울수록, 가까운 지역에 사용자가 늘수록 추천이 더 정밀해져요.
      </p>

      {onNavigateToFriends && (
        <button
          onClick={onNavigateToFriends}
          className="flex items-center gap-2 bg-foreground text-background font-semibold px-5 py-2.5 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          <Users className="w-4 h-4" />
          지인 초대하고 풀 넓히기
        </button>
      )}

      <p className="text-[11px] text-muted-foreground/60 mt-3 max-w-[250px]">
        지인이 없어도 가까운 지역의 공개 프로필이 추천에 포함돼요
      </p>
    </div>
  );
}

function NoFriendsNudge({ onNavigateToFriends }: { onNavigateToFriends?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-brand-soft flex items-center justify-center">
          <HeartHandshake className="w-11 h-11 text-brand-strong" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-card border border-border-subtle flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4 text-brand-strong" />
        </div>
      </div>

      <h3 className="text-lg font-bold mb-2">아직 연결된 지인이 없어요</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mb-2">
        친구를 추가하면 친구의 친구를 소개받을 수 있어요
      </p>
      <p className="text-xs text-muted-foreground/70 max-w-[240px] mb-8">
        팔레트는 지인 네트워크 기반이라 친구가 많을수록 더 많은 분을 만날 수 있어요
      </p>

      {onNavigateToFriends && (
        <button
          onClick={onNavigateToFriends}
          className="flex items-center gap-2 bg-brand-soft text-brand-strong font-semibold px-6 py-3 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          <Users className="w-4 h-4" />
          친구 추가하기
        </button>
      )}

      <p className="text-xs text-muted-foreground/60 mt-4">
        초대 코드 공유 또는 연락처로 친구를 찾을 수 있어요
      </p>
    </div>
  );
}
