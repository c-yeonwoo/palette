import { useState, useEffect, useRef } from "react";
import { MapPin, SlidersHorizontal, X, Bell, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { FortuneBanner } from "./FortuneBanner";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

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
}

interface FeedProfileItem {
  profile: Profile;
  mutualFriends: string[];
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
  isStub: boolean;
}

interface MainFeedScreenProps {
  onProfileClick?: (item: FeedProfileItem) => void;
  onNotificationClick?: () => void;
  unreadNotifications?: number;
}

interface UserProfile {
  userId: string;
  nickname: string;
  accountType: string;
  isProfileCompleted: boolean;
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

export function MainFeedScreen({ onProfileClick, onNotificationClick, unreadNotifications = 0 }: MainFeedScreenProps) {
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

  const fetchUserAndFeed = async (f: FilterState = filters) => {
    try {
      setLoading(true);
      const userData = await api.get<UserProfile>('/api/v1/auth/me');
      setUserProfile(userData);
      if (userData.accountType === "REGULAR") {
        const [feedResponse, aiSignalResponse] = await Promise.all([
          api.get<FeedResponse>(`/api/v1/feed${buildQueryString(f)}`),
          api.get<AiSignalResponse>("/api/v1/feed/ai-signal").catch(() => null),
        ]);
        setFeedItems(feedResponse.items);
        setAiSignal(aiSignalResponse);
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
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground tracking-[0.18em] uppercase mb-0.5">Palette</p>
            <h1 className="text-[26px] font-bold tracking-tight leading-none">주변 지인</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNotificationClick}
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center bg-card shadow-sm text-foreground"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => { setPendingFilters({ ...filters }); setShowFilter(true); }}
              className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${
                showFilter || hasActiveFilters ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5">
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
        )}
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilter(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-background overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background/90 backdrop-blur-xl border-b border-border px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-base">필터</h3>
              <button onClick={() => setShowFilter(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-6 space-y-7">
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
            <div className="sticky bottom-0 bg-background/90 backdrop-blur-xl border-t border-border px-5 py-4 flex gap-2.5">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={resetFilters}>초기화</Button>
              <Button className="flex-1 rounded-xl h-11" onClick={applyFilters}>적용하기</Button>
            </div>
          </div>
        </div>
      )}

      {/* Fortune Banner */}
      {!loading && userProfile?.accountType === "REGULAR" && <FortuneBanner />}

      {/* AI Signal Section */}
      {!loading && aiSignal && aiSignal.recommendations.length > 0 && (
        <AiSignalSection
          recommendations={aiSignal.recommendations}
          onProfileClick={onProfileClick}
          onUnlocked={(updated) => setAiSignal({ ...aiSignal, recommendations: updated })}
        />
      )}

      {/* Feed */}
      <div className="px-4">
        {loading ? (
          <LoadingState />
        ) : userProfile?.accountType === "MATCHMAKER_ONLY" ? (
          <EmptyState title="주선자 전용 계정" description="주선 기능은 주선자 대시보드에서 이용하실 수 있습니다" />
        ) : feedItems.length === 0 ? (
          <EmptyState
            title="아직 주변 지인이 없어요"
            description={hasActiveFilters ? "필터 조건을 조정해보세요" : "지인에게 주선을 요청하거나 프로필을 완성해보세요"}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {feedItems.map((item) => (
              <ProfileCard key={item.profile.userId} item={item} onClick={() => onProfileClick?.(item)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ item, onClick }: { item: FeedProfileItem; onClick: () => void }) {
  const { profile, mutualFriends, viewCost = 3000, isOpened = false } = item;
  const [revealed, setRevealed] = useState(isOpened);
  const [peeling, setPeeling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jobMap: Record<string, string> = {
    IT_DEVELOPMENT: "IT개발", FINANCE: "금융", EDUCATION: "교육", MEDICAL: "의료",
    MEDIA: "미디어", SERVICE: "서비스", MANUFACTURING: "제조", PUBLIC_OFFICIAL: "공무원",
    PROFESSIONAL: "전문직", OTHER: "기타",
  };
  const job = profile.careerInfo.category ? jobMap[profile.careerInfo.category] ?? null : null;
  const location = profile.locationInfo.sido;

  const mutualText = mutualFriends.length === 0 ? null
    : mutualFriends.length === 1 ? `${mutualFriends[0]}의 지인`
    : `${mutualFriends[0]} 외 ${mutualFriends.length - 1}명의 지인`;

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
    }, 1300);
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

        {/* 대각선 wipe: 왼쪽위→오른쪽아래로 닦이며 사라짐 */}
        {!revealed && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/paint-overlay.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              clipPath: peeling
                ? "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)"
                : "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
              transition: peeling ? "clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />
        )}

        {/* Cost pill */}
        <div className="absolute top-2.5 right-2.5">
          {!revealed ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm text-primary-foreground/80">
              {(viewCost / 1000).toFixed(0)}천원
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white/90">
              {(viewCost / 1000).toFixed(0)}천원
            </span>
          )}
        </div>

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
              <p className="text-white/70 text-[11px] mt-0.5">
                {[job, location].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mutual friend */}
      {mutualText && (
        <div className="flex items-center gap-1 mt-1.5 px-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground truncate">{mutualText}</p>
        </div>
      )}
    </div>
  );
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
        <p className="text-sm font-semibold">오늘의 AI 시그널</p>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">준비 중</span>
        <span className="ml-auto text-[10px] text-muted-foreground">매일 1장 무료</span>
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
                      <p className="text-white/70 text-[10px]">{rec.teaserLocation}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnlock(rec)}
                    disabled={unlocking}
                    className="mt-1 w-full py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-60"
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
              <p className="text-[10px] text-muted-foreground mt-1.5 px-0.5 truncate">{rec.reason}</p>
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

  const job = profile.careerInfo.category ? jobMap[profile.careerInfo.category] ?? null : null;
  const location = profile.locationInfo.sido;

  const handleClick = () => {
    if (revealed) {
      onProfileClick?.({ profile, mutualFriends: [], degree: 0, viewCost: 0 });
      return;
    }
    if (peeling) return;
    setPeeling(true);
    timerRef.current = setTimeout(() => {
      setRevealed(true);
      setPeeling(false);
      api.post(`/api/v1/feed/open/${profile.userId}`, {}).catch(() => {});
    }, 1300);
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

        {/* 대각선 wipe: 왼쪽위→오른쪽아래로 닦이며 사라짐 */}
        {!revealed && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/paint-overlay.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              clipPath: peeling
                ? "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)"
                : "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
              transition: peeling ? "clip-path 1.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            }}
          />
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
              <p className="text-white/70 text-[10px]">{[job, location].filter(Boolean).join(" · ")}</p>
            )}
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 px-0.5 truncate">{rec.reason}</p>
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
