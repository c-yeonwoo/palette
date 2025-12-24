import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface ProfileEditScreenProps {
  onBack: () => void;
  onSave: () => void;
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
    ageRange: { min: number; max: number } | null;
    heightRange: { min: number; max: number } | null;
    bodyTypes: string[];
    personalities: string[];
    dateStyle: string | null;
    purpose: string | null;
    dealBreakers: string | null;
  };
  settings: {
    isAcceptingMatches: boolean;
    hiddenAt: string | null;
  };
}

export function ProfileEditScreen({ onBack, onSave }: ProfileEditScreenProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
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

      <div className="p-6 space-y-8">
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
              <Label htmlFor="bodyType">체형</Label>
              <select
                id="bodyType"
                value={profile.basicInfo.bodyType || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    basicInfo: { ...profile.basicInfo, bodyType: e.target.value || null }
                  })
                }
                className="w-full p-2 border rounded-md text-base"
              >
                <option value="">선택 안함</option>
                <option value="SLIM">슬림</option>
                <option value="AVERAGE">보통</option>
                <option value="ATHLETIC">운동함</option>
                <option value="MUSCULAR">근육질</option>
                <option value="CURVY">글래머</option>
              </select>
            </div>
          </div>
        </section>

        {/* Career Info */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">직업 정보</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="careerCategory">직업 분야</Label>
              <select
                id="careerCategory"
                value={profile.careerInfo.category || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    careerInfo: { ...profile.careerInfo, category: e.target.value || null }
                  })
                }
                className="w-full p-2 border rounded-md text-base"
              >
                <option value="">선택 안함</option>
                <option value="IT_DEVELOPMENT">IT/개발</option>
                <option value="FINANCE">금융</option>
                <option value="EDUCATION">교육</option>
                <option value="MEDICAL">의료</option>
                <option value="MEDIA">미디어</option>
                <option value="SERVICE">서비스</option>
                <option value="MANUFACTURING">제조</option>
                <option value="PUBLIC_OFFICIAL">공무원</option>
                <option value="PROFESSIONAL">전문직</option>
                <option value="OTHER">기타</option>
              </select>
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
              <Label htmlFor="educationLevel">학력</Label>
              <select
                id="educationLevel"
                value={profile.educationInfo.level || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    educationInfo: { ...profile.educationInfo, level: e.target.value || null }
                  })
                }
                className="w-full p-2 border rounded-md text-base"
              >
                <option value="">선택 안함</option>
                <option value="HIGH_SCHOOL">고등학교</option>
                <option value="ASSOCIATE">전문대</option>
                <option value="BACHELOR">대학교</option>
                <option value="MASTER">석사</option>
                <option value="DOCTORATE">박사</option>
              </select>
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
              <Label htmlFor="smoking">흡연</Label>
              <select
                id="smoking"
                value={profile.lifestyleInfo.smoking || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    lifestyleInfo: { ...profile.lifestyleInfo, smoking: e.target.value || null }
                  })
                }
                className="w-full p-2 border rounded-md text-base"
              >
                <option value="">선택 안함</option>
                <option value="NEVER">비흡연</option>
                <option value="SOMETIMES">가끔</option>
                <option value="OFTEN">자주</option>
              </select>
            </div>
            <div>
              <Label htmlFor="drinking">음주</Label>
              <select
                id="drinking"
                value={profile.lifestyleInfo.drinking || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    lifestyleInfo: { ...profile.lifestyleInfo, drinking: e.target.value || null }
                  })
                }
                className="w-full p-2 border rounded-md text-base"
              >
                <option value="">선택 안함</option>
                <option value="NEVER">안함</option>
                <option value="SOMETIMES">가끔</option>
                <option value="OFTEN">자주</option>
              </select>
            </div>
            <div>
              <Label htmlFor="religion">종교</Label>
              <select
                id="religion"
                value={profile.lifestyleInfo.religion || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    lifestyleInfo: { ...profile.lifestyleInfo, religion: e.target.value || null }
                  })
                }
                className="w-full p-2 border rounded-md text-base"
              >
                <option value="">선택 안함</option>
                <option value="NONE">무교</option>
                <option value="CHRISTIANITY">기독교</option>
                <option value="CATHOLICISM">천주교</option>
                <option value="BUDDHISM">불교</option>
                <option value="OTHER">기타</option>
              </select>
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

        {/* Ideal Type */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">이상형</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="idealAgeMin">나이 (최소)</Label>
                <Input
                  id="idealAgeMin"
                  type="number"
                  value={profile.idealType.ageRange?.min || ""}
                  onChange={(e) => {
                    const min = e.target.value ? Number(e.target.value) : null;
                    setProfile({
                      ...profile,
                      idealType: {
                        ...profile.idealType,
                        ageRange: min && profile.idealType.ageRange
                          ? { min, max: profile.idealType.ageRange.max }
                          : null
                      }
                    });
                  }}
                  placeholder="예: 25"
                />
              </div>
              <div>
                <Label htmlFor="idealAgeMax">나이 (최대)</Label>
                <Input
                  id="idealAgeMax"
                  type="number"
                  value={profile.idealType.ageRange?.max || ""}
                  onChange={(e) => {
                    const max = e.target.value ? Number(e.target.value) : null;
                    setProfile({
                      ...profile,
                      idealType: {
                        ...profile.idealType,
                        ageRange: max && profile.idealType.ageRange
                          ? { min: profile.idealType.ageRange.min, max }
                          : null
                      }
                    });
                  }}
                  placeholder="예: 35"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="idealPersonalities">선호 성격 (쉼표로 구분)</Label>
              <Input
                id="idealPersonalities"
                value={profile.idealType.personalities.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    idealType: {
                      ...profile.idealType,
                      personalities: e.target.value.split(",").map((s) => s.trim()).filter((s) => s)
                    }
                  })
                }
                placeholder="예: 밝은, 유머러스한, 배려심있는"
              />
            </div>
            <div>
              <Label htmlFor="idealDateStyle">데이트 스타일</Label>
              <select
                id="idealDateStyle"
                value={profile.idealType.dateStyle || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    idealType: { ...profile.idealType, dateStyle: e.target.value || null }
                  })
                }
                className="w-full p-2 border rounded-md text-base"
              >
                <option value="">선택 안함</option>
                <option value="ACTIVE">활동적인</option>
                <option value="INDOOR">실내</option>
                <option value="CULTURAL">문화생활</option>
                <option value="BALANCED">균형잡힌</option>
              </select>
            </div>
            <div>
              <Label htmlFor="idealPurpose">만남의 목적</Label>
              <select
                id="idealPurpose"
                value={profile.idealType.purpose || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    idealType: { ...profile.idealType, purpose: e.target.value || null }
                  })
                }
                className="w-full p-2 border rounded-md text-base"
              >
                <option value="">선택 안함</option>
                <option value="SERIOUS_DATING">진지한 만남</option>
                <option value="MARRIAGE_PREMISE">결혼 전제</option>
                <option value="FRIENDS_FIRST">친구부터</option>
              </select>
            </div>
            <div>
              <Label htmlFor="idealDealBreakers">비선호 사항</Label>
              <Textarea
                id="idealDealBreakers"
                value={profile.idealType.dealBreakers || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    idealType: { ...profile.idealType, dealBreakers: e.target.value || null }
                  })
                }
                placeholder="선호하지 않는 사항을 입력하세요"
                rows={2}
              />
            </div>
          </div>
        </section>

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
