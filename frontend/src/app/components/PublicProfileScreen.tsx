import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

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
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
  metrics: {
    completionRate: number;
    trustScore: number;
  };
}

interface UserProfile {
  nickname: string;
  gender?: string;
  viewCount?: number;
}

export function PublicProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "ideal">("about");

  useEffect(() => {
    const fetchProfile = async () => {
      const shareMatch = window.location.pathname.match(/^\/share\/(.+)$/);
      const profileMatch = window.location.pathname.match(/^\/profile\/(.+)$/);

      try {
        if (shareMatch) {
          // Share link resolution
          const code = shareMatch[1];
          const data = await api.get<{ nickname: string; gender: string; profile: ProfileData; viewCount: number }>(
            `/api/v1/share/${code}`,
            { requiresAuth: false }
          );
          setProfile(data.profile);
          setUserProfile({ nickname: data.nickname, gender: data.gender, viewCount: data.viewCount });
        } else if (profileMatch) {
          const userId = profileMatch[1];
          const profileData = await api.get<ProfileData>(`/api/v1/profile/public/${userId}`, { requiresAuth: false });
          setProfile(profileData);
          const userData = await api.get<UserProfile>(`/api/v1/users/${userId}/public`, { requiresAuth: false });
          setUserProfile(userData);
        } else {
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('프로필을 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">프로필을 찾을 수 없습니다</p>
          <Button onClick={() => window.location.href = '/'}>홈으로 가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary shadow-md">
        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl font-bold mb-2 text-primary-foreground">Palette</h1>
          <p className="text-primary-foreground/80">나의 색을 찾고, 너의 색과 조화를 이루다</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="relative">
            {/* Profile Photo */}
            {profile.primaryPhotoUrl ? (
              <img
                src={profile.primaryPhotoUrl}
                alt="프로필 사진"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl">
                {userProfile.nickname.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Completion Badge */}
            {profile.metrics.completionRate === 100 && (
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-xl font-bold">{userProfile.nickname}</h3>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === "about"
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              내소개
            </button>
            <button
              onClick={() => setActiveTab("ideal")}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === "ideal"
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              이상형
            </button>
          </div>
        </div>

        {/* About Me Tab Content */}
        {activeTab === "about" && (
          <div className="space-y-4">
            <Section title="기본 정보">
              <div className="space-y-2 text-sm">
                {profile.basicInfo.height && (
                  <InfoRow label="키" value={`${profile.basicInfo.height}cm`} />
                )}
                {profile.basicInfo.bodyType && (
                  <InfoRow label="체형" value={getBodyTypeLabel(profile.basicInfo.bodyType)} />
                )}
                {profile.basicInfo.mbti && (
                  <InfoRow label="MBTI" value={profile.basicInfo.mbti} />
                )}
                {profile.careerInfo.company && (
                  <InfoRow label="직장" value={profile.careerInfo.company} />
                )}
                {profile.educationInfo.school && (
                  <InfoRow label="학력" value={`${profile.educationInfo.school} ${profile.educationInfo.major || ''}`} />
                )}
                {profile.locationInfo.sido && (
                  <InfoRow label="지역" value={`${profile.locationInfo.sido} ${profile.locationInfo.sigungu || ''}`} />
                )}
              </div>
            </Section>

            <Section title="사진">
              {profile.primaryPhotoUrl ? (
                <div className="flex items-center justify-center">
                  <img
                    src={profile.primaryPhotoUrl}
                    alt="프로필 사진"
                    className="w-48 h-48 rounded-lg object-cover"
                  />
                </div>
              ) : (
                <EmptyContent message="등록된 사진이 없습니다" />
              )}
            </Section>

            <Section title="자기소개">
              {profile.introduction.interviewAnswers ? (
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
              ) : (
                <EmptyContent message="자기소개가 없습니다" />
              )}
            </Section>

            <Section title="라이프스타일">
              <div className="space-y-2 text-sm">
                {profile.lifestyleInfo.smoking && (
                  <InfoRow label="흡연" value={getFrequencyLabel(profile.lifestyleInfo.smoking)} />
                )}
                {profile.lifestyleInfo.drinking && (
                  <InfoRow label="음주" value={getFrequencyLabel(profile.lifestyleInfo.drinking)} />
                )}
                {profile.lifestyleInfo.religion && (
                  <InfoRow label="종교" value={getReligionLabel(profile.lifestyleInfo.religion)} />
                )}
              </div>
            </Section>

            {/* Personality Tests */}
            {profile.personalityTests && profile.personalityTests.length > 0 && (
              <Section title="나는 이런 사람이에요">
                <div className="flex flex-wrap gap-2">
                  {profile.personalityTests.map((test, index) => (
                    <a
                      key={index}
                      href={test.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-secondary border border-border rounded-full px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      {test.title}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}

        {/* Ideal Type Tab Content */}
        {activeTab === "ideal" && (
          <div className="space-y-4">
            <Section title="Q1. 연인과 어떤 데이트를 선호하시나요?">
              {profile.idealType.datePreferences && profile.idealType.datePreferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.datePreferences.map((pref, idx) => (
                    <Badge key={idx} variant="secondary">
                      {getDatePreferenceLabel(pref)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="선택된 항목이 없습니다" />
              )}
            </Section>

            <Section title="Q2. 무엇을 가장 중요하게 생각하시나요?">
              {profile.idealType.importantValues && profile.idealType.importantValues.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.importantValues.map((value, idx) => (
                    <Badge key={idx} variant="secondary">
                      {getImportantValueLabel(value)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="선택된 항목이 없습니다" />
              )}
            </Section>

            <Section title="Q3. 선호하는 성격은?">
              {profile.idealType.personalities && profile.idealType.personalities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.personalities.map((personality, idx) => (
                    <Badge key={idx} variant="secondary">
                      {personality}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="선택된 항목이 없습니다" />
              )}
            </Section>

            <Section title="Q4. 선호하는 외모 스타일은?">
              {profile.idealType.appearanceStyles && profile.idealType.appearanceStyles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.appearanceStyles.map((style, idx) => (
                    <Badge key={idx} variant="secondary">
                      {getAppearanceStyleLabel(style)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="선택된 항목이 없습니다" />
              )}
            </Section>

            <Section title="Q5. 절대 안 되는 것">
              {profile.idealType.dealBreakers && profile.idealType.dealBreakers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.idealType.dealBreakers.map((breaker, idx) => (
                    <Badge key={idx} variant="outline">
                      {getDealBreakerLabel(breaker)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyContent message="선택된 항목이 없습니다" />
              )}
            </Section>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-8 bg-secondary rounded-2xl p-8 text-center border border-border">
          <h3 className="text-2xl font-bold mb-2">이 분을 소개받고 싶으신가요?</h3>
          <p className="text-muted-foreground mb-6">
            Palette에 가입하고 더 많은 프로필을 만나보세요
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => window.location.href = '/'}
          >
            지금 가입하기
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <h3 className="font-semibold mb-3 text-sm">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function InterviewAnswer({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="space-y-2 pb-3 border-b border-border/50 last:border-0">
      <p className="text-sm font-medium text-primary">{question}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{answer}</p>
    </div>
  );
}

function EmptyContent({ message }: { message: string }) {
  return (
    <div className="text-center py-4 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function getBodyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SLIM: "슬림",
    AVERAGE: "보통",
    ATHLETIC: "운동함",
    MUSCULAR: "근육질",
    CURVY: "글래머"
  };
  return labels[type] || type;
}

function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    NEVER: "안 함",
    SOMETIMES: "가끔",
    OFTEN: "자주",
    VERY_OFTEN: "매우 자주"
  };
  return labels[frequency] || frequency;
}

function getReligionLabel(religion: string): string {
  const labels: Record<string, string> = {
    NONE: "무교",
    CHRISTIAN: "기독교",
    CATHOLIC: "천주교",
    BUDDHIST: "불교",
    OTHER: "기타"
  };
  return labels[religion] || religion;
}

function getDatePreferenceLabel(pref: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "액티브한 데이트",
    INDOOR: "인도어 데이트",
    CULTURE: "문화 데이트",
    NATURE: "자연 데이트"
  };
  return labels[pref] || pref;
}

function getImportantValueLabel(value: string): string {
  const labels: Record<string, string> = {
    PERSONALITY: "성격/성향",
    APPEARANCE: "외모",
    EDUCATION: "학력",
    CAREER: "능력/커리어",
    FAMILY: "집안/가족",
    JOB: "직업",
    WEALTH: "경제력",
    VALUES: "가치관"
  };
  return labels[value] || value;
}

function getAppearanceStyleLabel(style: string): string {
  const labels: Record<string, string> = {
    CAT: "고양이상",
    DOG: "강아지상",
    RABBIT: "토끼상",
    DEER: "사슴상",
    FOX: "여우상",
    BEAR: "곰상",
    DINOSAUR: "공룡상"
  };
  return labels[style] || style;
}

function getDealBreakerLabel(breaker: string): string {
  const labels: Record<string, string> = {
    SMOKING: "흡연자",
    HEAVY_DRINKING: "과음하는 사람",
    DIFFERENT_RELIGION: "다른 종교",
    LIVES_FAR: "거리가 먼 사람",
    CONTACTS_EX: "전 연인과 연락하는 사람",
    NO_JOB: "무직",
    DEBT: "빚이 있는 사람"
  };
  return labels[breaker] || breaker;
}
