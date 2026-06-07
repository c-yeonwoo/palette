import { useState, useEffect, useRef } from "react";
import { MapPin, SlidersHorizontal, X, Bell, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { getCompatibilityDeterministic, COLOR_META, type ColorType } from "../../lib/colorCompatibility";

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
  region: string;
  jobCategory: string;
  degree: string;
}

const REGIONS = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const JOB_CATEGORIES = [
  { value: "", label: "전체" },
  { value: "IT_DEVELOPMENT", label: "IT/개발" },
  { value: "FINANCE", label: "금융/보험" },
  { value: "EDUCATION", label: "교육" },
  { value: "MEDICAL", label: "의료/보건" },
  { value: "MEDIA", label: "미디어/엔터" },
  { value: "SERVICE", label: "서비스/영업" },
  { value: "MANUFACTURING", label: "제조/생산" },
  { value: "PUBLIC_OFFICIAL", label: "공무원/공공기관" },
  { value: "PROFESSIONAL", label: "전문직" },
  { value: "OTHER", label: "기타" },
];

// 카드 커버 — 팔레트 '물감(paint)' 이미지. 탭하면 걷히고 사진이 드러난다.
const PALETTE_COVER_STYLE = {
  backgroundColor: "hsl(var(--muted))",
  backgroundImage: "url('/paint-overlay.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

export function MainFeedScreen({ onProfileClick, onNotificationClick, onNavigateToFriends, unreadNotifications = 0 }: MainFeedScreenProps) {
  const [feedItems, setFeedItems] = useState<FeedProfileItem[]>([]);
  const [aiSignal, setAiSignal] = useState<AiSignalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    ageMin: "", ageMax: "", heightMin: "", heightMax: "",
    region: "", jobCategory: "", degree: ""
  });
  const [pendingFilters, setPendingFilters] = useState<FilterState>({ ...filters });

  useEffect(() => {
    fetchUserAndFeed();
  }, []);

  const buildQueryString = (f: FilterState): string => {
    const params = new URLSearchParams();
    if (f.ageMin) params.set("ageMin", f.ageMin);
    if (f.ageMax) params.set("ageMax", f.ageMax);
    if (f.heightMin) params.set("heightMin", f.heightMin);
    if (f.heightMax) params.set("heightMax", f.heightMax);
    if (f.region) params.set("region", f.region);
    if (f.jobCategory) params.set("jobCategory", f.jobCategory);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const [isFeedVisible, setIsFeedVisible] = useState(true);
  const [homeTab, setHomeTab] = useState<"recommend" | "network">("network");

  const fetchUserAndFeed = async (f: FilterState = filters) => {
    try {
      setLoading(true);
      const userData = await api.get<UserProfile>('/api/v1/auth/me');
      setUserProfile(userData);
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
    const empty: FilterState = { ageMin: "", ageMax: "", heightMin: "", heightMax: "", region: "", jobCategory: "", degree: "" };
    setPendingFilters(empty);
    setFilters(empty);
    setShowFilter(false);
    fetchUserAndFeed(empty);
  };

  const hasActiveFilters = Object.entries(filters).some(([k, v]) => k !== "degree" && v !== "");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 통일 헤더 — sticky + bg-card/95 + border-b + h-14 (ADR 0014) */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">소개</h1>
          <div className="flex items-center gap-2">
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
            {userProfile?.accountType !== "MATCHMAKER_ONLY" && (
              <button
                onClick={() => { setPendingFilters({ ...filters }); setShowFilter(true); }}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  showFilter || hasActiveFilters ? "bg-brand-soft text-gold-strong" : "hover:bg-muted/50 text-foreground"
                }`}
                aria-label="필터"
              >
                <SlidersHorizontal className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>
        </div>
      </header>

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
            {filters.region && (
              <span className="text-xs bg-brand-soft text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">{filters.region}</span>
            )}
            {filters.jobCategory && (
              <span className="text-xs bg-brand-soft text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">
                {JOB_CATEGORIES.find(j => j.value === filters.jobCategory)?.label}
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

              <FilterSection title="지역">
                <div className="flex flex-wrap gap-1.5">
                  <ChipButton active={!pendingFilters.region} onClick={() => setPendingFilters(p => ({ ...p, region: "" }))}>전체</ChipButton>
                  {REGIONS.map(r => (
                    <ChipButton key={r} active={pendingFilters.region === r} onClick={() => setPendingFilters(p => ({ ...p, region: p.region === r ? "" : r }))}>
                      {r}
                    </ChipButton>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title="직업">
                <div className="flex flex-wrap gap-1.5">
                  {JOB_CATEGORIES.map(j => (
                    <ChipButton key={j.value} active={pendingFilters.jobCategory === j.value} onClick={() => setPendingFilters(p => ({ ...p, jobCategory: j.value }))}>
                      {j.label}
                    </ChipButton>
                  ))}
                </div>
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
                {/* 내부 탭 — 지인 / 팔레트 Pick */}
                <div className="flex gap-1 p-1 mt-5 rounded-2xl bg-surface-sunken">
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
                          onProfileClick?.(feedItem ?? item);
                        }}
                      />
                    ) : (
                      <EmptyState title="팔레트 Pick을 준비 중이에요" description="프로필을 완성하면 더 정밀하게 추천해드려요" />
                    )
                  ) : feedItems.length === 0 ? (
                    hasActiveFilters ? (
                      <EmptyState title="조건에 맞는 지인이 없어요" description="필터 조건을 조정해보세요" />
                    ) : (
                      <FirstTimeGuide onNavigateToFriends={onNavigateToFriends} />
                    )
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {feedItems.map((item) => (
                        <ProfileCard
                          key={item.profile.userId}
                          item={item}
                          myColorType={myColor}
                          onClick={() => onProfileClick?.(item)}
                        />
                      ))}
                    </div>
                  )}
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
  const { profile, mutualFriends, viewCost = 3000, isOpened = false, nickname = null, age = null } = item;
  const [revealed, setRevealed] = useState(isOpened);
  const [peeling, setPeeling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const jobMap: Record<string, string> = {
    IT_DEVELOPMENT: "IT개발", FINANCE: "금융", EDUCATION: "교육", MEDICAL: "의료",
    MEDIA: "미디어", SERVICE: "서비스", MANUFACTURING: "제조", PUBLIC_OFFICIAL: "공무원",
    PROFESSIONAL: "전문직", OTHER: "기타",
  };
  const job = profile.careerInfo.category ? jobMap[profile.careerInfo.category] ?? null : null;
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

          {/* ── 뒷면 (사진만, dim 제거) — 공개 상태. 아래 소개 섹션과 이어지도록 위쪽만 라운드 ── */}
          <div
            className="absolute inset-0 rounded-t-2xl overflow-hidden shadow-card bg-muted"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {profile.primaryPhotoUrl ? (
              <img src={profile.primaryPhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted via-accent to-muted/60 flex items-center justify-center">
                <span className="text-5xl opacity-20 select-none">👤</span>
              </div>
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

      {/* 소개 섹션 — 사진 바로 밑 (공개 후). 배경 = 상대 팔레트 컬러 파스텔 */}
      {revealed && (
        <div
          className="rounded-b-2xl px-3 py-2.5 shadow-card"
          style={{ backgroundColor: accentHex ? `${accentHex}1F` : "hsl(var(--surface-sunken))" }}
        >
          <CardInfoSection nickname={nickname ?? null} job={job} age={age ?? null} region={location} />
        </div>
      )}

      {/* 지인 연결 */}
      <div className="mt-2 px-0.5">
        <RelationshipBadge degree={degree} mutualFriends={mutualFriends} />
      </div>
    </div>
  );
}

/** 카드 하단 소개 섹션 — 닉네임 / 직업군 / 나이 · 지역 */
function CardInfoSection({
  nickname,
  job,
  age,
  region,
}: {
  nickname: string | null;
  job: string | null;
  age: number | null;
  region: string | null;
}) {
  const sub = [age ? `${age}세` : null, region].filter(Boolean).join(" · ");
  return (
    <>
      {nickname && <p className="text-sm font-bold text-foreground truncate leading-tight">{nickname}</p>}
      {job && <p className="text-xs text-muted-foreground truncate mt-0.5">{job}</p>}
      {sub && <p className="text-xs text-muted-foreground truncate mt-0.5">{sub}</p>}
    </>
  );
}

function RelationshipBadge({ degree, mutualFriends }: { degree?: number; mutualFriends: MutualFriend[] }) {
  // 1촌: 직접 연결
  if (degree === 1) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <span className="flex-shrink-0 text-xs font-bold bg-brand-soft text-primary rounded-full px-1.5 py-0.5 leading-none">
          내 지인
        </span>
        <p className="text-xs text-muted-foreground truncate">직접 아는 사이</p>
      </div>
    );
  }

  // 2촌: 공통 지인 통해
  if (degree === 2 && mutualFriends.length > 0) {
    const connector = mutualFriends[0].name;
    const more = mutualFriends.length - 1;
    const label = more > 0 ? `${connector}님 외 ${more}명의 친구` : `${connector}님의 친구`;
    return (
      <div className="flex items-center gap-1 min-w-0">
        <span className="flex-shrink-0 text-xs font-bold bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5 leading-none border border-border">
          친구의 친구
        </span>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
    );
  }

  // degree 없이 mutualFriends만 있는 경우 (fallback)
  if (mutualFriends.length > 0) {
    const name = mutualFriends[0].name;
    const more = mutualFriends.length - 1;
    const label = more > 0 ? `${name}님 외 ${more}명의 지인` : `${name}님의 지인`;
    return (
      <div className="flex items-center gap-1 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
        <p className="text-xs text-muted-foreground truncate">{label}</p>
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
  const [showPaywall, setShowPaywall] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const jobMap: Record<string, string> = {
    IT_DEVELOPMENT: "IT개발", FINANCE: "금융", EDUCATION: "교육", MEDICAL: "의료",
    MEDIA: "미디어", SERVICE: "서비스", MANUFACTURING: "제조", PUBLIC_OFFICIAL: "공무원",
    PROFESSIONAL: "전문직", OTHER: "기타",
  };

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
        <p className="text-sm text-muted-foreground">
          {isSubscriber ? "오늘 당신과 가장 잘 맞는 색을 골랐어요" : "프로필 궁합도를 기반으로 추천해드려요"}
        </p>
        {isSubscriber && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-soft text-gold-strong">PASS</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {recommendations.map((rec, i) => {
          if (rec.isUnlocked && rec.profile) {
            return (
              <AiSignalCard
                key={i}
                rec={rec}
                jobMap={jobMap}
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
                      <Sparkles className="w-5 h-5 text-gold-strong" />
                    )}
                    {teaserSub && <span className="text-xs text-muted-foreground mt-0.5">{teaserSub}</span>}
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-brand-soft text-gold-strong shadow-sm">
                    <Sparkles className="w-3 h-3" /> 구독하고 보기
                  </span>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 bg-white/85 text-gold-strong shadow-sm">
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
            매일 무제한 추천 + 궁합 리포트
          </span>
          <span className="text-xs font-bold text-gold-strong whitespace-nowrap">월 {passPrice.toLocaleString()}원 →</span>
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
    { emoji: "♾️", title: "매일 추천 무제한", desc: "하루 1장 제한 없이 팔레트 Pick을 모두 열람" },
    { emoji: "📊", title: "궁합 리포트", desc: "왜 잘 맞는지 색깔 기반 상세 분석 제공" },
    { emoji: "✨", title: "우선 추천", desc: "더 정교한 궁합 기반으로 먼저 소개" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl p-6 shadow-overlay animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-gold-strong" />
          </div>
          <h3 className="text-lg font-bold text-foreground">팔레트 Pick 패스</h3>
          <p className="text-sm text-muted-foreground mt-1">색 궁합으로 매일 인연을 추천받아요</p>
        </div>

        <div className="space-y-3 mb-5">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-xl">{b.emoji}</span>
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
          className="w-full py-3.5 rounded-2xl bg-brand-soft text-gold-strong font-bold shadow-card active:scale-95 transition-transform disabled:opacity-60"
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
  jobMap,
  myColorType,
  onProfileClick,
}: {
  rec: AiSignalRecommendation;
  jobMap: Record<string, string>;
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

  const job = profile.careerInfo.category ? jobMap[profile.careerInfo.category] ?? null : null;
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
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 bg-white/85 text-gold-strong shadow-sm">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </div>
          </div>

          {/* ── 뒷면 (사진만, dim 제거) — 공개 상태. 위쪽만 라운드 ── */}
          <div
            className="absolute inset-0 rounded-t-2xl overflow-hidden shadow-card bg-muted"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {profile.primaryPhotoUrl ? (
              <img src={profile.primaryPhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted via-accent to-muted/60" />
            )}
            {rec.isFree && (
              <div className="absolute top-2 right-2">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-green-500/90 text-white">FREE</span>
              </div>
            )}
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

      {/* 소개 섹션 — 사진 바로 밑 (공개 후). 배경 = 상대 팔레트 컬러 파스텔 */}
      {revealed && (
        <div
          className="rounded-b-2xl px-3 py-2.5 shadow-card"
          style={{ backgroundColor: accentHex ? `${accentHex}1F` : "hsl(var(--surface-sunken))" }}
        >
          <CardInfoSection nickname={null} job={job} age={rec.teaserAge ?? null} region={location} />
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

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
        active ? "bg-brand-soft text-gold-strong" : "bg-muted text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
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
      <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-5">
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
      emoji: "🎨",
      title: "프로필 다듬기",
      desc: "마이프로필에서 사진을 추가하면 매칭 확률이 올라가요",
    },
    {
      emoji: "👥",
      title: "지인 연결하기",
      desc: "친구를 초대하면 친구의 친구까지 소개받을 수 있어요",
    },
    {
      emoji: "✨",
      title: "AI 시그널 받기",
      desc: "매일 한 명, AI가 골라준 추천을 무료로 받아보세요",
    },
  ];

  return (
    <div className="space-y-4">
      {/* 환영 메시지 */}
      <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-5 border border-orange-100">
        <div className="text-3xl mb-2">🌟</div>
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
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center text-xl">
              {s.emoji}
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
          className="w-full bg-brand-soft text-gold-strong font-semibold py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <span>👥</span>
          지금 친구 연결하기
        </button>
      )}

      <p className="text-xs text-muted-foreground/60 text-center pt-1">
        베타 기간 동안은 친구 없이도 시드 유저 12명을 둘러볼 수 있어요
      </p>
    </div>
  );
}

function NoFriendsNudge({ onNavigateToFriends }: { onNavigateToFriends?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <span className="text-4xl">🫂</span>
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
          <span className="text-sm">✨</span>
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
          className="flex items-center gap-2 bg-brand-soft text-gold-strong font-semibold px-6 py-3 rounded-2xl shadow-md active:scale-95 transition-transform"
        >
          <span className="text-base">👥</span>
          친구 추가하기
        </button>
      )}

      <p className="text-xs text-muted-foreground/60 mt-4">
        초대 코드 공유 또는 연락처로 친구를 찾을 수 있어요
      </p>
    </div>
  );
}
