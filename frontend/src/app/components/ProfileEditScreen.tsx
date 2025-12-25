import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { ArrowLeft, Loader2, Save, Plus, Video, Star, X } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface ProfileEditScreenProps {
  onBack: () => void;
  onSave: () => void;
  userGender?: string; // "MALE" or "FEMALE"
}

interface ProfileData {
  id: string;
  userId: string;
  basicInfo: {
    height: number | null;
    bodyType: string | null;
  };
  careerInfo: {
    category: string | null;
    company: string | null;
    position: string | null;
  };
  educationInfo: {
    level: string | null;
    school: string | null;
    major: string | null;
  };
  locationInfo: {
    sido: string | null;
    sigungu: string | null;
    hometownSido: string | null;
    hometownSigungu: string | null;
  };
  lifestyleInfo: {
    smoking: string | null;
    drinking: string | null;
    religion: string | null;
  };
  introduction: {
    text: string | null;
    interests: string[];
  };
  idealType: {
    datePreferences: string[];
    importantValues: string[];
    personalities: string[];
    appearanceStyles: string[];
    dealBreakers: string[];
  };
  settings: {
    isAcceptingMatches: boolean;
    hiddenAt: string | null;
  };
}

// 선호하는 성격 옵션
const personalities = [
  "유머있는", "다정한", "지적인", "활발한", "차분한",
  "섬세한", "솔직한", "적극적인", "배려심많은", "독립적인"
];

// 남자가 선택하는 여자 외모 스타일 (enum -> 한글)
const femaleAppearanceStyles: Record<string, string> = {
  PUPPY: "강아지상",
  CAT: "고양이상",
  RABBIT: "토끼상",
  FOX: "여우상",
  DEER: "사슴상",
  TOFU: "두부상",
  SOFT_TOFU: "순두부상",
  ARAB: "아랍상",
  BOSS: "일진상",
  MOTHER_IN_LAW_APPROVED: "상견례입구컷상"
};

// 여자가 선택하는 남자 외모 스타일 (enum -> 한글)
const maleAppearanceStyles: Record<string, string> = {
  PUPPY: "강아지상",
  CAT: "고양이상",
  STUDENT_COUNCIL: "전교회장상",
  ATHLETIC: "체대상",
  NERD: "너드상",
  TOFU: "두부상",
  ARAB: "아랍상",
  DINOSAUR: "공룡상"
};

// Deal Breakers (절대 안되는 것들) - 최대 3개
const dealBreakerOptions: Record<string, string> = {
  SMOKING: "흡연자",
  HEAVY_DRINKING: "과음하는 사람",
  DISLIKES_PETS: "반려동물을 싫어하는 사람",
  LONG_DISTANCE: "장거리 연애",
  DIFFERENT_RELIGION: "종교가 다른 사람",
  NO_MARRIAGE_PLAN: "결혼 의사가 없는 사람",
  CHILDREN_PLAN: "자녀 계획이 맞지 않는 사람",
  UNSTABLE_JOB: "직업이 불안정한 사람",
  CONTACTS_EX: "전 연인과 연락하는 사람",
  LARGE_AGE_GAP: "나이 차이가 많이 나는 사람"
};

export function ProfileEditScreen({ onBack, onSave, userGender }: ProfileEditScreenProps) {
  // 사용자 성별에 따라 다른 외모 스타일 옵션 제공
  const appearanceStyleOptions = userGender === "MALE" ? femaleAppearanceStyles : maleAppearanceStyles;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<(string | null)[]>(Array(6).fill(null));
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [video, setVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "ideal">("about");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get<ProfileData>('/api/v1/profile');
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('프로필을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      await api.put('/api/v1/profile', {
        basicInfo: profile.basicInfo,
        careerInfo: profile.careerInfo,
        educationInfo: profile.educationInfo,
        locationInfo: profile.locationInfo,
        lifestyleInfo: profile.lifestyleInfo,
        introduction: profile.introduction,
        idealType: profile.idealType,
        settings: profile.settings
      });
      toast.success('프로필이 저장되었습니다');
      onSave();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('프로필 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">프로필을 불러올 수 없습니다</p>
          <Button onClick={onBack} variant="outline">
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-center relative">
            <button
              onClick={onBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">프로필 수정</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("about")}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === "about"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              내소개
            </button>
            <button
              onClick={() => setActiveTab("ideal")}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === "ideal"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              이상형
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* About Me Tab Content */}
        {activeTab === "about" && (
          <>
        {/* Photos and Video */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">프로필 사진 및 동영상</h3>

          {/* Photos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>프로필 사진 (최대 6장)</Label>
              <p className="text-sm text-muted-foreground">
                {photos.filter(p => p !== null).length}/6장
              </p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              <Star className="w-3 h-3 inline text-amber-500" /> 표시를 눌러 메인 사진을 선택하세요
            </p>
            <div className="grid grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`relative aspect-square bg-muted rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                    index === mainPhotoIndex
                      ? 'border-primary ring-2 ring-primary/20'
                      : photo
                      ? 'border-border hover:border-primary/50'
                      : 'border-dashed border-muted-foreground/30 hover:border-primary/50'
                  }`}
                >
                  {photo ? (
                    <>
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setMainPhotoIndex(index)}
                        className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1 hover:bg-primary/90"
                      >
                        <Star className={`w-3 h-3 ${index === mainPhotoIndex ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => {
                          const newPhotos = [...photos];
                          newPhotos[index] = null;
                          setPhotos(newPhotos);
                        }}
                        className="absolute top-1 left-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Video */}
          <div>
            <Label className="mb-3 block">프로필 동영상 (선택)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div
                className={`relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                  video
                    ? 'border-primary bg-primary/5'
                    : 'border-dashed border-muted-foreground/30 hover:border-primary/50 bg-muted'
                }`}
              >
                {video ? (
                  <>
                    <video src={video} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setVideo(null)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <Video className="w-5 h-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">동영상</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 5-30초 권장, MP4/MOV, 최대 50MB
            </p>
          </div>
        </section>

        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">기본 정보</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="height">키 (cm)</Label>
              <Input
                id="height"
                type="number"
                value={profile.basicInfo.height || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    basicInfo: {
                      ...profile.basicInfo,
                      height: e.target.value ? Number(e.target.value) : null
                    }
                  })
                }
                placeholder="예: 170"
              />
            </div>
            <div>
              <Label className="mb-2 block">체형</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "SLIM", label: "슬림" },
                  { value: "AVERAGE", label: "보통" },
                  { value: "ATHLETIC", label: "탄탄" },
                  { value: "MUSCULAR", label: "건장" },
                  { value: "CURVY", label: "풍만" },
                ].map((type) => (
                  <Badge
                    key={type.value}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        basicInfo: { ...profile.basicInfo, bodyType: type.value }
                      })
                    }
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      profile.basicInfo.bodyType === type.value
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={profile.basicInfo.bodyType === type.value ? "default" : "outline"}
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Career Info */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">직업 정보</h3>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">직업 분야</Label>
              <div className="flex flex-wrap gap-2">
                {[
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
                ].map((category) => (
                  <Badge
                    key={category.value}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        careerInfo: { ...profile.careerInfo, category: category.value }
                      })
                    }
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      profile.careerInfo.category === category.value
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={profile.careerInfo.category === category.value ? "default" : "outline"}
                  >
                    {category.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="company">회사명</Label>
              <Input
                id="company"
                value={profile.careerInfo.company || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    careerInfo: { ...profile.careerInfo, company: e.target.value || null }
                  })
                }
                placeholder="회사명을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="position">직책</Label>
              <Input
                id="position"
                value={profile.careerInfo.position || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    careerInfo: { ...profile.careerInfo, position: e.target.value || null }
                  })
                }
                placeholder="직책을 입력하세요"
              />
            </div>
          </div>
        </section>

        {/* Education Info */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">학력 정보</h3>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">학력</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "HIGH_SCHOOL", label: "고졸" },
                  { value: "ASSOCIATE", label: "전문대" },
                  { value: "BACHELOR", label: "대졸" },
                  { value: "MASTER", label: "석사" },
                  { value: "DOCTORATE", label: "박사" },
                ].map((level) => (
                  <Badge
                    key={level.value}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        educationInfo: { ...profile.educationInfo, level: level.value }
                      })
                    }
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      profile.educationInfo.level === level.value
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={profile.educationInfo.level === level.value ? "default" : "outline"}
                  >
                    {level.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="school">학교명</Label>
              <Input
                id="school"
                value={profile.educationInfo.school || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    educationInfo: { ...profile.educationInfo, school: e.target.value || null }
                  })
                }
                placeholder="학교명을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="major">전공</Label>
              <Input
                id="major"
                value={profile.educationInfo.major || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    educationInfo: { ...profile.educationInfo, major: e.target.value || null }
                  })
                }
                placeholder="전공을 입력하세요"
              />
            </div>
          </div>
        </section>

        {/* Location Info */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">지역 정보</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sido">거주 시/도</Label>
                <Input
                  id="sido"
                  value={profile.locationInfo.sido || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      locationInfo: { ...profile.locationInfo, sido: e.target.value || null }
                    })
                  }
                  placeholder="예: 서울"
                />
              </div>
              <div>
                <Label htmlFor="sigungu">시/군/구</Label>
                <Input
                  id="sigungu"
                  value={profile.locationInfo.sigungu || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      locationInfo: { ...profile.locationInfo, sigungu: e.target.value || null }
                    })
                  }
                  placeholder="예: 강남구"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hometownSido">고향 시/도</Label>
                <Input
                  id="hometownSido"
                  value={profile.locationInfo.hometownSido || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      locationInfo: { ...profile.locationInfo, hometownSido: e.target.value || null }
                    })
                  }
                  placeholder="예: 부산"
                />
              </div>
              <div>
                <Label htmlFor="hometownSigungu">시/군/구</Label>
                <Input
                  id="hometownSigungu"
                  value={profile.locationInfo.hometownSigungu || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      locationInfo: { ...profile.locationInfo, hometownSigungu: e.target.value || null }
                    })
                  }
                  placeholder="예: 해운대구"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Lifestyle Info */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">라이프스타일</h3>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">흡연</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "NEVER", label: "비흡연" },
                  { value: "SOMETIMES", label: "가끔" },
                  { value: "OFTEN", label: "자주" },
                ].map((option) => (
                  <Badge
                    key={option.value}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        lifestyleInfo: { ...profile.lifestyleInfo, smoking: option.value }
                      })
                    }
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      profile.lifestyleInfo.smoking === option.value
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={profile.lifestyleInfo.smoking === option.value ? "default" : "outline"}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">음주</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "NEVER", label: "안마심" },
                  { value: "SOMETIMES", label: "가끔" },
                  { value: "OFTEN", label: "자주" },
                ].map((option) => (
                  <Badge
                    key={option.value}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        lifestyleInfo: { ...profile.lifestyleInfo, drinking: option.value }
                      })
                    }
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      profile.lifestyleInfo.drinking === option.value
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={profile.lifestyleInfo.drinking === option.value ? "default" : "outline"}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">종교</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "NONE", label: "무교" },
                  { value: "CHRISTIANITY", label: "기독교" },
                  { value: "CATHOLICISM", label: "천주교" },
                  { value: "BUDDHISM", label: "불교" },
                  { value: "OTHER", label: "기타" },
                ].map((option) => (
                  <Badge
                    key={option.value}
                    onClick={() =>
                      setProfile({
                        ...profile,
                        lifestyleInfo: { ...profile.lifestyleInfo, religion: option.value }
                      })
                    }
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      profile.lifestyleInfo.religion === option.value
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={profile.lifestyleInfo.religion === option.value ? "default" : "outline"}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Introduction */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">자기소개</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="introductionText">소개글</Label>
              <Textarea
                id="introductionText"
                value={profile.introduction.text || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    introduction: { ...profile.introduction, text: e.target.value || null }
                  })
                }
                placeholder="자신을 소개해주세요"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="interests">관심사 (쉼표로 구분)</Label>
              <Input
                id="interests"
                value={profile.introduction.interests.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    introduction: {
                      ...profile.introduction,
                      interests: e.target.value.split(",").map((s) => s.trim()).filter((s) => s)
                    }
                  })
                }
                placeholder="예: 영화, 독서, 요리"
              />
            </div>
          </div>
        </section>
          </>
        )}

        {/* Ideal Type Tab Content */}
        {activeTab === "ideal" && (
          <>
        {/* Ideal Type */}
        <section className="space-y-6">
          <h3 className="text-xl font-semibold">이상형</h3>

          {/* Date Preferences */}
          <div>
            <Label className="mb-3 block">연인과 어떤 데이트를 선호하시나요? (복수 선택)</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "ACTIVE", label: "액티브한 데이트", desc: "여행, 운동, 액티비티" },
                { value: "INDOOR", label: "인도어 데이트", desc: "집, 카페, 영화관" },
                { value: "CULTURE", label: "문화 데이트", desc: "전시, 공연, 맛집 투어" },
                { value: "NATURE", label: "자연 데이트", desc: "산책, 드라이브, 피크닉" },
              ].map((pref) => (
                <button
                  key={pref.value}
                  type="button"
                  onClick={() => {
                    const current = profile.idealType.datePreferences;
                    const newPrefs = current.includes(pref.value)
                      ? current.filter(p => p !== pref.value)
                      : [...current, pref.value];
                    setProfile({
                      ...profile,
                      idealType: { ...profile.idealType, datePreferences: newPrefs }
                    });
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    profile.idealType.datePreferences.includes(pref.value)
                      ? "bg-gradient-to-r from-pink-50 to-rose-50 border-pink-400"
                      : "bg-white border-slate-200 hover:border-pink-300"
                  }`}
                >
                  <p className="font-medium text-slate-900 mb-1">{pref.label}</p>
                  <p className="text-sm text-slate-600">{pref.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Important Values */}
          <div>
            <Label className="mb-3 block">
              중요하게 보는 세 가지는? (최대 3개)
              <span className="text-sm text-slate-500 ml-2">
                {profile.idealType.importantValues.length}/3
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {["PERSONALITY", "APPEARANCE", "EDUCATION", "CAREER", "FAMILY", "JOB", "WEALTH", "VALUES"].map((value) => {
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
                const isSelected = profile.idealType.importantValues.includes(value);
                return (
                  <Badge
                    key={value}
                    onClick={() => {
                      const current = profile.idealType.importantValues;
                      let newValues;
                      if (isSelected) {
                        newValues = current.filter(v => v !== value);
                      } else if (current.length < 3) {
                        newValues = [...current, value];
                      } else {
                        return;
                      }
                      setProfile({
                        ...profile,
                        idealType: { ...profile.idealType, importantValues: newValues }
                      });
                    }}
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={isSelected ? "default" : "outline"}
                  >
                    {labels[value]}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Personalities */}
          <div>
            <Label className="mb-3 block">
              어떤 성격의 사람을 선호하시나요? (최대 5개)
              <span className="text-sm text-slate-500 ml-2">
                {profile.idealType.personalities.length}/5
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {personalities.map((personality) => {
                const isSelected = profile.idealType.personalities.includes(personality);
                return (
                  <Badge
                    key={personality}
                    onClick={() => {
                      const current = profile.idealType.personalities;
                      let newPersonalities;
                      if (isSelected) {
                        newPersonalities = current.filter(p => p !== personality);
                      } else if (current.length < 5) {
                        newPersonalities = [...current, personality];
                      } else {
                        return;
                      }
                      setProfile({
                        ...profile,
                        idealType: { ...profile.idealType, personalities: newPersonalities }
                      });
                    }}
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={isSelected ? "default" : "outline"}
                  >
                    {personality}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Appearance Styles */}
          <div>
            <Label className="mb-3 block">선호하는 외모 스타일은? (하나만 선택)</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(appearanceStyleOptions).map(([enumValue, koreanLabel]) => {
                const isSelected = profile.idealType.appearanceStyles.includes(enumValue);
                return (
                  <Badge
                    key={enumValue}
                    onClick={() => {
                      const current = profile.idealType.appearanceStyles;
                      const newStyles = isSelected
                        ? []
                        : [enumValue];
                      setProfile({
                        ...profile,
                        idealType: { ...profile.idealType, appearanceStyles: newStyles }
                      });
                    }}
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={isSelected ? "default" : "outline"}
                  >
                    {koreanLabel}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Deal Breakers */}
          <div>
            <Label className="mb-3 block">
              절대 안되는 것들은? (최대 3개)
              <span className="text-sm text-slate-500 ml-2">
                {profile.idealType.dealBreakers.length}/3
              </span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(dealBreakerOptions).map(([enumValue, koreanLabel]) => {
                const isSelected = profile.idealType.dealBreakers.includes(enumValue);
                return (
                  <Badge
                    key={enumValue}
                    onClick={() => {
                      const current = profile.idealType.dealBreakers;
                      let newDealBreakers;
                      if (isSelected) {
                        newDealBreakers = current.filter(d => d !== enumValue);
                      } else if (current.length < 3) {
                        newDealBreakers = [...current, enumValue];
                      } else {
                        return;
                      }
                      setProfile({
                        ...profile,
                        idealType: { ...profile.idealType, dealBreakers: newDealBreakers }
                      });
                    }}
                    className={`cursor-pointer px-4 py-2 transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                        : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                    }`}
                    variant={isSelected ? "default" : "outline"}
                  >
                    {koreanLabel}
                  </Badge>
                );
              })}
            </div>
          </div>
        </section>
          </>
        )}

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장하기'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
