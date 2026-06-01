import { useState, useEffect, useRef } from "react";
import { MapPin, SlidersHorizontal, X, Bell, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { DailyMatchBanner } from "./DailyMatchBanner";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { getCompatibilityDeterministic, COLOR_META, type ColorType } from "../../lib/colorCompatibility";
import { isMockdataUser } from "../../lib/mockdata-guard";

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
  unlockPrice: number;
  isOpened: boolean;
  teaserAge: number | null;
  teaserLocation: string | null;
}

interface AiSignalResponse {
  recommendations: AiSignalRecommendation[];
  generatedAt: string;
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

  const applyFilters = () => {
    setFilters(pendingFilters);
    setShowFilter(false);
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
      {/* 통일 헤더 — sticky + bg-background/95 + border-b + h-14 (ADR 0014) */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-bold text-foreground">주변 지인</h1>
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
                  showFilter || hasActiveFilters ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-foreground"
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
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {(filters.ageMin || filters.ageMax) && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">
                {filters.ageMin || "?"}-{filters.ageMax || "?"}세
              </span>
            )}
            {(filters.heightMin || filters.heightMax) && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">
                {filters.heightMin || "?"}-{filters.heightMax || "?"}cm
              </span>
            )}
            {filters.region && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">{filters.region}</span>
            )}
            {filters.jobCategory && (
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap font-medium">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilter(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-background overflow-y-auto"
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

      {/* F08 데일리 컬러 매칭 배너 */}
      <div className="max-w-2xl mx-auto pt-2">
        <DailyMatchBanner className="mb-3" />
      </div>

      {/* Feed */}
      <div className="max-w-2xl mx-auto px-4">
        {loading ? (
          <LoadingState />
        ) : userProfile?.accountType === "MATCHMAKER_ONLY" ? (
          <EmptyState title="주선자 전용 계정" description="주선 기능은 주선자 대시보드에서 이용하실 수 있습니다" />
        ) : !isFeedVisible ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
            <span className="text-4xl">🙈</span>
            <p className="font-semibold text-foreground">소개받기가 잠시 멈춰 있어요</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              내 프로필이 지인의 피드에 보이지 않는 상태예요.<br />
              내 프로필 → 설정 → 소개받기를 켜면 다시 시작돼요.
            </p>
          </div>
        ) : feedItems.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState title="조건에 맞는 지인이 없어요" description="필터 조건을 조정해보세요" />
          ) : (
            <div className="space-y-5">
              {/* AI Signal 이 있으면 표시 (비시드 사용자도 보기 가능) */}
              {aiSignal && aiSignal.recommendations.length > 0 && (
                <AiSignalSection
                  recommendations={aiSignal.recommendations}
                  onUnlocked={(updated) => setAiSignal({ recommendations: updated })}
                  onProfileClick={() => {}}
                />
              )}
              {/* 비시드 사용자의 경우 FirstTimeGuide 대신 작은 empty state */}
              {userProfile && !isMockdataUser(userProfile) ? (
                <EmptyState title="지인을 추가해보세요" description="초대 코드로 첫 지인을 연결하면 더 많은 추천을 받을 수 있어요" />
              ) : (
                <FirstTimeGuide onNavigateToFriends={onNavigateToFriends} />
              )}
            </div>
          )
        ) : (
          <div className="space-y-5">
            {/* AI Signal Section — 오늘의 추천 */}
            {aiSignal && aiSignal.recommendations.length > 0 && (
              <AiSignalSection
                recommendations={aiSignal.recommendations}
                onUnlocked={(updated) => setAiSignal({ recommendations: updated })}
                onProfileClick={(rec) => {
                  const feedItem = feedItems.find(f => f.profile.userId === rec.userId);
                  if (feedItem) onProfileClick?.(feedItem);
                }}
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {feedItems.map((item) => (
                <ProfileCard
                  key={item.profile.userId}
                  item={item}
                  myColorType={(userProfile?.colorType?.type ?? null) as ColorType | null}
                  onClick={() => onProfileClick?.(item)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
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
  const { profile, mutualFriends, viewCost = 3000, isOpened = false } = item;
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
    }, 1200);
  };

  return (
    <div onClick={handleClick} className="cursor-pointer select-none">
      {/* Photo card */}
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted shadow-sm">
        {/* 실제 사진 (항상 렌더링, paint 아래에 있음) */}
        {profile.primaryPhotoUrl ? (
          <img src={profile.primaryPhotoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted via-accent to-muted/60 flex items-center justify-center">
            <span className="text-5xl opacity-20 select-none">👤</span>
          </div>
        )}

        {/* 공개 후 그라디언트 */}
        {revealed && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
        )}

        {/* Diagonal Wipe Transition */}
        {!revealed && (
          <div className="absolute inset-0" style={{
            backgroundImage: "url('/paint-overlay.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 0% 0%)",
            animation: peeling ? "diagonal-wipe 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "none",
          }} />
        )}


        {/* 공개 후 하단 정보 */}
        {revealed && (
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            {profile.basicInfo.height && (
              <p className="text-white text-sm font-semibold leading-tight">
                {profile.basicInfo.height}cm
                {profile.basicInfo.mbti && (
                  <span className="font-normal opacity-75"> · {profile.basicInfo.mbti}</span>
                )}
              </p>
            )}
            {(job || location) && (
              <p className="text-white/70 text-xs mt-0.5">
                {[job, location].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        )}

        {/* 미공개 상태: 색깔 타입 힌트 */}
        {!revealed && theirMeta && (
          <div className="absolute top-2 left-2">
            <span
              className="w-5 h-5 rounded-full border-2 border-white/80 shadow block"
              style={{ backgroundColor: theirMeta.hex }}
              title={theirMeta.name}
            />
          </div>
        )}

        {/* 공개 후: 색깔 궁합 배지 */}
        {revealed && compat && (
          <div className="absolute top-2 right-2">
            <span className="text-xs font-bold bg-white/90 text-foreground rounded-full px-2 py-0.5 shadow-sm">
              {compat.label} {compat.score}%
            </span>
          </div>
        )}
      </div>

      {/* 지인 연결 + 색깔 타입 */}
      <div className="mt-1.5 px-0.5 space-y-0.5">
        <RelationshipBadge degree={degree} mutualFriends={mutualFriends} />
        {theirMeta && compat && revealed && (
          <p className="text-xs text-muted-foreground truncate">{compat.tagline}</p>
        )}
      </div>
    </div>
  );
}

function RelationshipBadge({ degree, mutualFriends }: { degree?: number; mutualFriends: MutualFriend[] }) {
  // 1촌: 직접 연결
  if (degree === 1) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <span className="flex-shrink-0 text-xs font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5 leading-none">
          1촌
        </span>
        <p className="text-xs text-muted-foreground truncate">직접 연결</p>
      </div>
    );
  }

  // 2촌: 공통 지인 통해
  if (degree === 2 && mutualFriends.length > 0) {
    const connector = mutualFriends[0].name;
    const extra = mutualFriends.length > 1 ? ` 외 ${mutualFriends.length - 1}명` : "";
    return (
      <div className="flex items-center gap-1 min-w-0">
        <span className="flex-shrink-0 text-xs font-bold bg-secondary text-muted-foreground rounded-full px-1.5 py-0.5 leading-none border border-border">
          2촌
        </span>
        <p className="text-xs text-muted-foreground truncate">
          {connector}{extra} 통해
        </p>
      </div>
    );
  }

  // degree 없이 mutualFriends만 있는 경우 (fallback)
  if (mutualFriends.length > 0) {
    const name = mutualFriends[0].name;
    const extra = mutualFriends.length > 1 ? ` 외 ${mutualFriends.length - 1}명` : "";
    return (
      <div className="flex items-center gap-1 min-w-0">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
        <p className="text-xs text-muted-foreground truncate">{name}{extra}의 지인</p>
      </div>
    );
  }

  return null;
}

function AiSignalSection({
  recommendations,
  onProfileClick,
  onUnlocked,
}: {
  recommendations: AiSignalRecommendation[];
  onProfileClick?: (item: FeedProfileItem) => void;
  onUnlocked?: (updated: AiSignalRecommendation[]) => void;
}) {
  const [unlocking, setUnlocking] = useState(false);

  const jobMap: Record<string, string> = {
    IT_DEVELOPMENT: "IT개발", FINANCE: "금융", EDUCATION: "교육", MEDICAL: "의료",
    MEDIA: "미디어", SERVICE: "서비스", MANUFACTURING: "제조", PUBLIC_OFFICIAL: "공무원",
    PROFESSIONAL: "전문직", OTHER: "기타",
  };

  const handleUnlock = async (rec: AiSignalRecommendation) => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      await api.post("/api/v1/feed/ai-signal/unlock", {});
      // 잠금 해제 후 전체 목록 다시 가져오기
      const updated = await api.get<AiSignalResponse>("/api/v1/feed/ai-signal");
      onUnlocked?.(updated.recommendations);
      toast.success(`${rec.unlockPrice.toLocaleString()}원으로 AI 추천을 열었어요`);
    } catch {
      toast.error("열람에 실패했어요. 다시 시도해주세요.");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="px-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-sm font-semibold">색깔로 찾은 인연</p>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">준비 중</span>
        <span className="ml-auto text-xs text-muted-foreground">매일 1장 무료</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {recommendations.map((rec, i) => {
          if (rec.isUnlocked && rec.profile) {
            // 열람 가능한 카드 → paint reveal 적용
            return (
              <AiSignalCard
                key={i}
                rec={rec}
                jobMap={jobMap}
                onProfileClick={onProfileClick}
              />
            );
          }

          // 잠긴 카드 (2번째, 미결제)
          return (
            <div key={i} className="flex-shrink-0 w-36">
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted shadow-sm">
                {/* 블러 배경 */}
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
                  <span className="text-5xl opacity-10 select-none">👤</span>
                </div>
                {/* 잠금 오버레이 */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  {/* 티저 정보 */}
                  <div className="text-center">
                    {rec.teaserAge && (
                      <p className="text-white/90 text-xs font-semibold">{rec.teaserAge}세</p>
                    )}
                    {rec.teaserLocation && (
                      <p className="text-white/70 text-xs">{rec.teaserLocation}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnlock(rec)}
                    disabled={unlocking}
                    className="mt-1 w-full py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-60"
                  >
                    {unlocking ? "처리 중..." : `열기 ${rec.unlockPrice.toLocaleString()}원`}
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 px-0.5 truncate">{rec.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AiSignalCard({
  rec,
  jobMap,
  onProfileClick,
}: {
  rec: AiSignalRecommendation;
  jobMap: Record<string, string>;
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

  const handleClick = () => {
    if (revealed) {
      onProfileClick?.({ profile, mutualFriends: [] as MutualFriend[], degree: 0, viewCost: 0 });
      return;
    }
    if (peeling) return;
    setPeeling(true);
    timerRef.current = setTimeout(() => {
      setRevealed(true);
      setPeeling(false);
      api.post(`/api/v1/feed/open/${profile.userId}`, {}).catch(() => {});
    }, 1200);
  };


  return (
    <div onClick={handleClick} className="flex-shrink-0 w-36 cursor-pointer select-none">
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted shadow-sm">
        {profile.primaryPhotoUrl ? (
          <img src={profile.primaryPhotoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted via-accent to-muted/60 flex items-center justify-center">
            <span className="text-4xl opacity-20 select-none">👤</span>
          </div>
        )}
        {revealed && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />}

        {/* Diagonal Wipe Transition */}
        {!revealed && (
          <div className="absolute inset-0" style={{
            backgroundImage: "url('/paint-overlay.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 0% 0%)",
            animation: peeling ? "diagonal-wipe 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "none",
          }} />
        )}

        {/* AI badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" /> AI
          </span>
        </div>
        {rec.isFree && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/90 text-white">FREE</span>
          </div>
        )}


        {/* 공개 후 하단 정보 */}
        {revealed && (
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
            {profile.basicInfo.height && (
              <p className="text-white text-xs font-semibold">{profile.basicInfo.height}cm</p>
            )}
            {(job || location) && (
              <p className="text-white/70 text-xs">{[job, location].filter(Boolean).join(" · ")}</p>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 px-0.5 truncate">{rec.reason}</p>
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
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
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
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
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
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
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
        친구를 추가하면 주변 지인을 소개받을 수 있어요
      </p>
      <p className="text-xs text-muted-foreground/70 max-w-[240px] mb-8">
        팔레트는 지인 네트워크 기반이라 친구가 많을수록 더 많은 분을 만날 수 있어요
      </p>

      {onNavigateToFriends && (
        <button
          onClick={onNavigateToFriends}
          className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-2xl shadow-md active:scale-95 transition-transform"
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
