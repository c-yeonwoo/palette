import { useState, useEffect } from "react";
import { MapPin, Briefcase } from "lucide-react";
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

export function MainFeedScreen({ onProfileClick }: MainFeedScreenProps) {
  const [feedItems, setFeedItems] = useState<FeedProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUserAndFeed();
  }, []);

  const fetchUserAndFeed = async () => {
    try {
      setLoading(true);

      // Fetch user profile first to check account type
      const userData = await api.get<UserProfile>('/api/v1/auth/me');
      setUserProfile(userData);

      // Only fetch feed for REGULAR users
      if (userData.accountType === "REGULAR") {
        const feedResponse = await api.get<FeedResponse>("/api/v1/feed");
        setFeedItems(feedResponse.items);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
      toast.error("피드를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-center text-xl font-semibold">Palette</h2>
        <p className="text-sm text-center text-muted-foreground mt-1">
          내 지인의 지인
        </p>
      </div>

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
            title="아직 추천받은 프로필이 없어요"
            description="지인에게 주선을 요청하거나, 프로필을 완성하면 매칭이 시작됩니다"
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
  const { profile, mutualFriends } = item;

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
