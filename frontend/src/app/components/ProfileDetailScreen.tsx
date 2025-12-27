import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChevronLeft, Loader2, Send, Users, ExternalLink } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface ProfileDetailScreenProps {
  userId: string;
  onBack: () => void;
  mutualFriends?: string[];  // 공통 친구 닉네임 리스트
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
  metrics: {
    trustScore: number;
  };
}

export function ProfileDetailScreen({ userId, onBack, mutualFriends = [] }: ProfileDetailScreenProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userInfo, setUserInfo] = useState<PublicUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "ideal">("about");
  const [showMatchmakerModal, setShowMatchmakerModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [selectedMatchmaker, setSelectedMatchmaker] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

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

  const handleMatchRequest = () => {
    if (mutualFriends.length === 0) {
      toast.error("공통 친구가 없어 주선을 요청할 수 없습니다");
      return;
    }
    setShowMatchmakerModal(true);
    setModalStep(1);
  };

  const handleMatchmakerSelect = (matchmaker: string) => {
    setSelectedMatchmaker(matchmaker);
  };

  const handleNextStep = () => {
    if (!selectedMatchmaker) {
      toast.error("주선자를 선택해주세요");
      return;
    }
    setModalStep(2);
  };

  const handleConfirmMatchRequest = () => {
    // TODO: 실제 주선 요청 API 호출
    toast.success(`${selectedMatchmaker}님께 주선을 요청했습니다`);
    setShowMatchmakerModal(false);
    setModalStep(1);
    setSelectedMatchmaker(null);
    setRequestMessage("");
  };

  const handleCloseModal = () => {
    setShowMatchmakerModal(false);
    setModalStep(1);
    setSelectedMatchmaker(null);
    setRequestMessage("");
  };

  const getMutualFriendsText = () => {
    if (mutualFriends.length === 0) return "";
    if (mutualFriends.length === 1) return `${mutualFriends[0]}의 지인`;
    return `${mutualFriends[0]} 외 ${mutualFriends.length - 1}명의 지인`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
      <h3 className="text-lg font-semibold">{title}</h3>
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
          <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
            {item}
          </Badge>
        ))}
      </div>
    );
  };

  const InterviewAnswer = ({ question, answer }: { question: string; answer: string }) => {
    return (
      <div className="space-y-2 pb-3 border-b border-border/50 last:border-0">
        <p className="text-sm font-medium text-primary">{question}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{answer}</p>
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">{userInfo.nickname}님의 프로필</h2>
          </div>
        </div>
      </div>

      {/* Mutual Friends Banner */}
      {mutualFriends.length > 0 && (
        <div className="bg-primary/5 border-b border-primary/10 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Users className="w-4 h-4" />
            <span className="font-medium">{getMutualFriendsText()}</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-1 p-1">
          {sortedPhotos.slice(0, 6).map((photo, index) => (
            <div key={photo.id} className="aspect-[3/4] bg-muted relative overflow-hidden">
              <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {sortedPhotos.length < 6 && Array.from({ length: 6 - sortedPhotos.length }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-[3/4] bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">사진 없음</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-border px-6 mt-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === "about" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              내소개
              {activeTab === "about" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("ideal")}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === "ideal" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              이상형
              {activeTab === "ideal" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === "about" ? (
            <>
              {/* Basic Info */}
              <Section title="기본 정보">
                <div className="bg-card rounded-xl p-4 border border-border divide-y divide-border">
                  <InfoRow label="키" value={profile.basicInfo.height ? `${profile.basicInfo.height}cm` : null} />
                  <InfoRow label="체형" value={getBodyTypeDisplay(profile.basicInfo.bodyType)} />
                  <InfoRow label="MBTI" value={profile.basicInfo.mbti} />
                </div>
              </Section>

              {/* Career & Education */}
              <Section title="직업 & 학력">
                <div className="bg-card rounded-xl p-4 border border-border divide-y divide-border">
                  <InfoRow label="직군" value={getJobCategoryDisplay(profile.careerInfo.category)} />
                  <InfoRow label="회사" value={profile.careerInfo.company} />
                  <InfoRow label="학력" value={getEducationDisplay(profile.educationInfo.level)} />
                  <InfoRow label="학교" value={profile.educationInfo.school} />
                  <InfoRow label="전공" value={profile.educationInfo.major} />
                </div>
              </Section>

              {/* Location */}
              <Section title="위치">
                <div className="bg-card rounded-xl p-4 border border-border">
                  <InfoRow
                    label="거주지"
                    value={profile.locationInfo.sido && profile.locationInfo.sigungu
                      ? `${profile.locationInfo.sido} ${profile.locationInfo.sigungu}`
                      : null
                    }
                  />
                </div>
              </Section>

              {/* Lifestyle */}
              <Section title="라이프스타일">
                <div className="bg-card rounded-xl p-4 border border-border divide-y divide-border">
                  <InfoRow label="흡연" value={getFrequencyDisplay(profile.lifestyleInfo.smoking)} />
                  <InfoRow label="음주" value={getFrequencyDisplay(profile.lifestyleInfo.drinking)} />
                  <InfoRow label="종교" value={getReligionDisplay(profile.lifestyleInfo.religion)} />
                </div>
              </Section>

              {/* Introduction */}
              <Section title="자기소개">
                {profile?.introduction.interviewAnswers ? (
                  <div className="bg-card rounded-lg border border-border p-4">
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
        <div className="max-w-2xl mx-auto">
          <Button
            size="lg"
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleMatchRequest}
          >
            <Send className="w-5 h-5 mr-2" />
            주선 요청하기
          </Button>
        </div>
      </div>

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
                          selectedMatchmaker === friend
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
                              <p className="font-medium">{friend}</p>
                              <p className="text-xs text-muted-foreground">
                                {userInfo?.nickname}님과 공통 친구
                              </p>
                            </div>
                          </div>
                          {selectedMatchmaker === friend && (
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
                    disabled={!selectedMatchmaker}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Write Message */}
            {modalStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right duration-300">
                {/* Modal Header */}
                <div className="border-b border-border px-6 py-4">
                  <h3 className="text-lg font-semibold text-center">주선 요청</h3>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    {selectedMatchmaker}님께 전달할 메시지를 작성해주세요
                  </p>
                </div>

                {/* Message Input */}
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        <p className="text-sm font-medium text-primary">선택된 주선자</p>
                      </div>
                      <p className="font-medium">{selectedMatchmaker}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        요청 메시지 <span className="text-muted-foreground">(선택사항)</span>
                      </label>
                      <textarea
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        placeholder="예: 안녕하세요! 프로필을 보고 관심이 생겨서 주선을 요청드립니다."
                        className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                        maxLength={200}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {requestMessage.length}/200
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="border-t border-border px-6 py-4 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setModalStep(1)}
                  >
                    이전
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirmMatchRequest}
                  >
                    요청하기
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
