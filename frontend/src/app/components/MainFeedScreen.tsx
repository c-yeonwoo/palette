import { useState, useEffect } from "react";
import { MapPin, Briefcase, SlidersHorizontal, X } from "lucide-react";
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

interface ProfileMetadataDto {
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
  deletedAt: string | null;
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
  metadata: ProfileMetadataDto;
  metrics: ProfileMetricsDto;
}

interface FeedProfileItem {
  profile: Profile;
  mutualFriends: string[];  // 공통 친구들의 닉네임 리스트
  degree?: number;          // 1촌=1, 2촌=2, 3촌=3
  viewCost?: number;        // 0=무료, 3000=3천원, 5000=5천원
}

interface FeedResponse {
  items: FeedProfileItem[];
  totalCount: number;
}

interface MainFeedScreenProps {
  onProfileClick?: (item: FeedProfileItem) => void;
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
  degree: string; // "" | "1" | "2"
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

export function MainFeedScreen({ onProfileClick }: MainFeedScreenProps) {
  const [feedItems, setFeedItems] = useState<FeedProfileItem[]>([]);
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
    if (f.degree) params.set("degree", f.degree);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const fetchUserAndFeed = async (f: FilterState = filters) => {
    try {
      setLoading(true);
      const userData = await api.get<UserProfile>('/api/v1/auth/me');
      setUserProfile(userData);

      if (userData.accountType === "REGULAR") {
        const feedResponse = await api.get<FeedResponse>(`/api/v1/feed${buildQueryString(f)}`);
        setFeedItems(feedResponse.items);
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
    const empty = { ageMin: "", ageMax: "", heightMin: "", heightMax: "", region: "", jobCategory: "", degree: "" };
    setPendingFilters(empty);
    setFilters(empty);
    setShowFilter(false);
    fetchUserAndFeed(empty);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Palette</h2>
            <p className="text-xs text-muted-foreground">내 지인의 지인</p>
          </div>
          <button
            onClick={() => { setPendingFilters({ ...filters }); setShowFilter(true); }}
            className={`relative p-2 rounded-full transition-colors ${showFilter ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {hasActiveFilters && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filter chips */}
      {hasActiveFilters && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto bg-card border-b border-border">
          {filters.ageMin || filters.ageMax ? (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
              나이: {filters.ageMin || "?"}-{filters.ageMax || "?"}세
            </span>
          ) : null}
          {filters.heightMin || filters.heightMax ? (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
              키: {filters.heightMin || "?"}-{filters.heightMax || "?"}cm
            </span>
          ) : null}
          {filters.region && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">{filters.region}</span>
          )}
          {filters.jobCategory && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">
              {JOB_CATEGORIES.find(j => j.value === filters.jobCategory)?.label || filters.jobCategory}
            </span>
          )}
          <button onClick={resetFilters} className="text-xs text-muted-foreground underline whitespace-nowrap">
            초기화
          </button>
        </div>
      )}

      {/* Filter Panel Overlay */}
      {showFilter && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilter(false)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-background overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b border-border px-4 py-4 flex items-center justify-between">
              <h3 className="font-semibold">필터</h3>
              <button onClick={() => setShowFilter(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-5 space-y-6">
              {/* Age */}
              <div className="space-y-2">
                <p className="text-sm font-medium">나이</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number" placeholder="최소" min={18} max={60}
                    value={pendingFilters.ageMin}
                    onChange={e => setPendingFilters(p => ({ ...p, ageMin: e.target.value }))}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                  <span className="text-muted-foreground">~</span>
                  <input
                    type="number" placeholder="최대" min={18} max={60}
                    value={pendingFilters.ageMax}
                    onChange={e => setPendingFilters(p => ({ ...p, ageMax: e.target.value }))}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                  <span className="text-sm text-muted-foreground">세</span>
                </div>
              </div>

              {/* Height */}
              <div className="space-y-2">
                <p className="text-sm font-medium">키</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number" placeholder="최소" min={140} max={200}
                    value={pendingFilters.heightMin}
                    onChange={e => setPendingFilters(p => ({ ...p, heightMin: e.target.value }))}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                  <span className="text-muted-foreground">~</span>
                  <input
                    type="number" placeholder="최대" min={140} max={200}
                    value={pendingFilters.heightMax}
                    onChange={e => setPendingFilters(p => ({ ...p, heightMax: e.target.value }))}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                  <span className="text-sm text-muted-foreground">cm</span>
                </div>
              </div>

              {/* Region */}
              <div className="space-y-2">
                <p className="text-sm font-medium">지역</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPendingFilters(p => ({ ...p, region: "" }))}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${!pendingFilters.region ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                  >
                    전체
                  </button>
                  {REGIONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setPendingFilters(p => ({ ...p, region: p.region === r ? "" : r }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${pendingFilters.region === r ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Category */}
              <div className="space-y-2">
                <p className="text-sm font-medium">직업</p>
                <div className="flex flex-wrap gap-2">
                  {JOB_CATEGORIES.map(j => (
                    <button
                      key={j.value}
                      onClick={() => setPendingFilters(p => ({ ...p, jobCategory: j.value }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${pendingFilters.jobCategory === j.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                    >
                      {j.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2촌만 노출되므로 촌수 필터 제거 */}
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={resetFilters}>초기화</Button>
              <Button className="flex-1" onClick={applyFilters}>적용하기</Button>
            </div>
          </div>
        </div>
      )}

      {/* Fortune Banner */}
      {!loading && userProfile?.accountType === "REGULAR" && (
        <div className="pt-4">
          <FortuneBanner />
        </div>
      )}

      {/* Feed Content */}
      <div className="p-6">
        {loading ? (
          <LoadingState />
        ) : userProfile?.accountType === "MATCHMAKER_ONLY" ? (
          <EmptyState
            title="주선자 전용 계정입니다"
            description="주선 기능은 주선자 대시보드에서 이용하실 수 있습니다"
          />
        ) : feedItems.length === 0 ? (
          <EmptyState
            title="조건에 맞는 프로필이 없어요"
            description={hasActiveFilters ? "필터 조건을 조정해보세요" : "지인에게 주선을 요청하거나, 프로필을 완성하면 매칭이 시작됩니다"}
          />
        ) : (
          <div className="space-y-4">
            {feedItems.map((item) => (
              <ProfileCard
                key={item.profile.userId}
                item={item}
                onClick={() => onProfileClick?.(item)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ item, onClick }: { item: FeedProfileItem; onClick: () => void }) {
  const { profile, mutualFriends, degree = 2, viewCost = 3000 } = item;

  const getBodyTypeDisplay = (bodyType: string | null) => {
    if (!bodyType) return null;
    const bodyTypeMap: Record<string, string> = {
      SLIM: "슬림",
      AVERAGE: "보통",
      ATHLETIC: "탄탄",
      MUSCULAR: "근육질",
      CHUBBY: "통통",
      CURVY: "풍만",
    };
    return bodyTypeMap[bodyType] || bodyType;
  };

  const getJobCategoryDisplay = (category: string | null) => {
    if (!category) return null;
    const jobMap: Record<string, string> = {
      IT_DEVELOPMENT: "IT/개발",
      FINANCE: "금융/보험",
      EDUCATION: "교육",
      MEDICAL: "의료/보건",
      MEDIA: "미디어/엔터",
      SERVICE: "서비스/영업",
      MANUFACTURING: "제조/생산",
      PUBLIC_OFFICIAL: "공무원/공공기관",
      PROFESSIONAL: "전문직",
      OTHER: "기타",
    };
    return jobMap[category] || category;
  };

  const getMutualFriendsText = () => {
    if (mutualFriends.length === 0) return "";
    if (mutualFriends.length === 1) return `${mutualFriends[0]}의 지인`;
    return `${mutualFriends[0]} 외 ${mutualFriends.length - 1}명의 지인`;
  };

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Photo */}
      <div className="aspect-[4/5] bg-muted relative">
        {profile.primaryPhotoUrl ? (
          <img
            src={profile.primaryPhotoUrl}
            alt="프로필"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            사진 없음
          </div>
        )}
        {/* Degree badge */}
        <div className="absolute top-2 left-2">
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/90 text-white">
            2촌 · {(viewCost / 1000).toFixed(0)}천원
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Basic Info */}
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {profile.basicInfo.height && <span>{profile.basicInfo.height}cm</span>}
          {profile.basicInfo.bodyType && <span>· {getBodyTypeDisplay(profile.basicInfo.bodyType)}</span>}
          {profile.basicInfo.mbti && <span>· {profile.basicInfo.mbti}</span>}
        </div>

        {/* Location */}
        {(profile.locationInfo.sido || profile.locationInfo.sigungu) && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>
              {profile.locationInfo.sido} {profile.locationInfo.sigungu}
            </span>
          </div>
        )}

        {/* Job */}
        {profile.careerInfo.category && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Briefcase className="w-4 h-4" />
            <span>
              {profile.careerInfo.company || getJobCategoryDisplay(profile.careerInfo.category)}
            </span>
          </div>
        )}

        {/* Education */}
        {profile.educationInfo.level && (
          <div className="text-sm text-muted-foreground">
            {profile.educationInfo.school || profile.educationInfo.level}
          </div>
        )}

        {/* Introduction */}
        {profile.introduction.text && (
          <p className="text-sm text-muted-foreground line-clamp-2">{profile.introduction.text}</p>
        )}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
          <div className="aspect-[4/5] bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">{description}</p>
    </div>
  );
}
