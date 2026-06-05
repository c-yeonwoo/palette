import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { User, ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface BasicInfoScreenProps {
  onNext: (data: any) => void;
  onBack?: () => void;
  initialData?: {
    basicInfo?: any;
    careerInfo?: any;
    educationInfo?: any;
    locationInfo?: any;
  };
}

const jobCategories = [
  "IT/개발", "금융/보험", "교육", "의료/보건", "미디어/엔터",
  "서비스/영업", "제조/생산", "공무원/공공기관", "전문직", "기타"
];

const educationLevels = ["고졸", "전문대", "대졸", "석사", "박사"];
const bodyTypes = ["슬림", "보통", "탄탄", "건장", "통통"];
const regions = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전",
  "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
];

/** 4 mini-steps — step 1, 3 만 필수, 2/4 는 건너뛰기 가능
 *  1 → 신원 (필수: 이름, 생년월일, 성별)
 *  2 → 외형/성격 (선택: 키, 체형, MBTI)
 *  3 → 커리어/위치 (필수: 직업, 지역)
 *  4 → 추가 정보 (선택: 전화, 회사, 학교)
 */
type MiniStep = 1 | 2 | 3 | 4;

const MINI_STEP_META: Record<MiniStep, { title: string; subtitle: string; emoji: string }> = {
  1: { title: "나를 소개할게요", subtitle: "이름, 생년월일, 성별", emoji: "👋" },
  2: { title: "조금 더 알려주세요", subtitle: "선택사항이에요. 부담없이!", emoji: "✨" },
  3: { title: "어디서 무슨 일을 하나요?", subtitle: "직업과 지역", emoji: "💼" },
  4: { title: "마지막 단계예요", subtitle: "다 선택 항목 — 건너뛰셔도 돼요", emoji: "🎯" },
};

interface UserProfile {
  userId: string;
  nickname: string;
  accountType: string;
  isProfileCompleted: boolean;
  realName?: string;
  birthDate?: string;
  gender?: string;
  phoneNumber?: string;
}

export function BasicInfoScreen({ onNext, onBack, initialData }: BasicInfoScreenProps) {
  const [miniStep, setMiniStep] = useState<MiniStep>(1);
  const [formData, setFormData] = useState({
    name: initialData?.basicInfo?.name || "",
    birthYear: initialData?.basicInfo?.birthYear || "",
    birthMonth: initialData?.basicInfo?.birthMonth || "",
    birthDay: initialData?.basicInfo?.birthDay || "",
    gender: initialData?.basicInfo?.gender || "",
    height: initialData?.basicInfo?.height || 170,
    bodyType: initialData?.basicInfo?.bodyType || "",
    mbtiE: initialData?.basicInfo?.mbti?.[0] || "",
    mbtiS: initialData?.basicInfo?.mbti?.[1] || "",
    mbtiT: initialData?.basicInfo?.mbti?.[2] || "",
    mbtiP: initialData?.basicInfo?.mbti?.[3] || "",
    jobCategory: initialData?.careerInfo?.category || "",
    company: initialData?.careerInfo?.company || "",
    education: initialData?.educationInfo?.level || "",
    school: initialData?.educationInfo?.school || "",
    major: initialData?.educationInfo?.major || "",
    region: initialData?.locationInfo?.region || "",
    phoneNumber: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const birthYears = Array.from({ length: currentYear - 1959 }, (_, i) => String(currentYear - i));
  const birthMonths = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const birthDays = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

  // Pre-fill from server
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await api.get<UserProfile>('/api/v1/auth/me');
        setFormData(prev => {
          const next = { ...prev };
          if (userData.realName) next.name = userData.realName;
          if (userData.birthDate) {
            const [y, m, d] = userData.birthDate.split('-');
            next.birthYear = y; next.birthMonth = m; next.birthDay = d;
          }
          if (userData.gender) {
            next.gender = { MALE: '남성', FEMALE: '여성' }[userData.gender] ?? userData.gender;
          }
          if (userData.phoneNumber) next.phoneNumber = userData.phoneNumber;
          return next;
        });
      } catch {
        toast.error('사용자 정보를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

  const calculateAge = () => {
    if (formData.birthYear) {
      const age = currentYear - parseInt(formData.birthYear);
      return age > 0 ? ` (만 ${age}세)` : "";
    }
    return "";
  };

  // Per-step validation — step 2/4 는 선택, 항상 통과 가능
  const isStep1Valid = !!(formData.name && formData.birthYear && formData.birthMonth && formData.birthDay && formData.gender);
  const isStep3Valid = !!(formData.jobCategory && formData.region);  // 학력 필수에서 제외

  const isCurrentStepValid = () => {
    if (miniStep === 1) return isStep1Valid;
    if (miniStep === 3) return isStep3Valid;
    return true; // step 2, 4 는 모두 선택
  };

  const handleBack = () => {
    if (miniStep > 1) setMiniStep((miniStep - 1) as MiniStep);
    else if (onBack) onBack();
  };

  const handleNext = () => {
    if (miniStep < 4) {
      setMiniStep((miniStep + 1) as MiniStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNext({
        basicInfo: {
          name: formData.name,
          birthYear: formData.birthYear,
          birthMonth: formData.birthMonth,
          birthDay: formData.birthDay,
          gender: formData.gender,
          phoneNumber: formData.phoneNumber,
          height: formData.height,
          bodyType: formData.bodyType,
          mbti: `${formData.mbtiE}${formData.mbtiS}${formData.mbtiT}${formData.mbtiP}`,
        },
        careerInfo: { category: formData.jobCategory, company: formData.company, incomeRange: "" },
        educationInfo: { level: formData.education, school: formData.school, major: formData.major },
        locationInfo: { region: formData.region, district: "" },
      });
    }
  };

  const update = (field: keyof typeof formData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const meta = MINI_STEP_META[miniStep];
  const progressValue = 20; // overall onboarding step 1/5

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 space-y-3 sticky top-0 z-10">
        <div className="relative flex items-center justify-center">
          <button
            onClick={handleBack}
            className="absolute left-0 p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-base font-semibold">기본 정보</h2>
            <p className="text-xs text-muted-foreground">{miniStep}/4 단계</p>
          </div>
        </div>

        {/* Overall progress */}
        <Progress value={progressValue} className="h-1.5" />

        {/* Mini-step dots */}
        <div className="flex justify-center gap-2">
          {([1, 2, 3, 4] as MiniStep[]).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === miniStep ? "bg-primary w-6" : s < miniStep ? "bg-primary/50 w-2" : "bg-muted w-2"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6 space-y-6">
        {/* Step header card */}
        <div className="text-center py-2">
          <div className="text-4xl mb-2">{meta.emoji}</div>
          <h3 className="text-xl font-bold text-foreground">{meta.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{meta.subtitle}</p>
        </div>

        {/* ──────────── STEP 1: 신원 ──────────── */}
        {miniStep === 1 && (
          <div className="space-y-5">
            {/* Name */}
            <div>
              <Label className="mb-2 block">이름 <span className="text-primary">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="본명을 입력해주세요"
                  value={formData.name}
                  onChange={(e) => update('name', e.target.value)}
                  className="pl-11 h-12 bg-card border-border"
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">상대방에게는 이름이 공개되지 않아요</p>
            </div>

            {/* Birth Date */}
            <div>
              <Label className="mb-2 block">
                생년월일 <span className="text-primary">*</span>
                <span className="text-muted-foreground font-normal">{calculateAge()}</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={formData.birthYear}
                  onChange={(e) => update('birthYear', e.target.value)}
                  className="h-12 px-3 rounded-lg border-2 border-border bg-card focus:border-primary text-sm"
                >
                  <option value="">년도</option>
                  {birthYears.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
                <select
                  value={formData.birthMonth}
                  onChange={(e) => update('birthMonth', e.target.value)}
                  className="h-12 px-3 rounded-lg border-2 border-border bg-card focus:border-primary text-sm"
                >
                  <option value="">월</option>
                  {birthMonths.map(m => <option key={m} value={m}>{parseInt(m)}월</option>)}
                </select>
                <select
                  value={formData.birthDay}
                  onChange={(e) => update('birthDay', e.target.value)}
                  className="h-12 px-3 rounded-lg border-2 border-border bg-card focus:border-primary text-sm"
                >
                  <option value="">일</option>
                  {birthDays.map(d => <option key={d} value={d}>{parseInt(d)}일</option>)}
                </select>
              </div>
            </div>

            {/* Gender */}
            <div>
              <Label className="mb-2 block">성별 <span className="text-primary">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                {["남성", "여성"].map((g) => (
                  <button
                    key={g}
                    onClick={() => update('gender', g)}
                    className={`py-3.5 rounded-xl border-2 font-medium transition-all ${
                      formData.gender === g
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ──────────── STEP 2: 외형/성격 (모두 선택) ──────────── */}
        {miniStep === 2 && (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              💡 이 단계는 <strong>모두 선택사항</strong>이에요. 채울수록 매칭이 더 정확해지지만,
              지금 부담스러우면 <strong>"건너뛰기"</strong> 버튼을 눌러 다음으로 진행해도 됩니다.
            </div>
            {/* Height */}
            <div>
              <Label className="mb-2 block">
                키
                <span className="text-muted-foreground font-normal"> — {formData.height}cm</span>
              </Label>
              <input
                type="range"
                min="140"
                max="220"
                value={formData.height}
                onChange={(e) => update('height', parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>140cm</span>
                <span>220cm</span>
              </div>
            </div>

            {/* Body Type */}
            <div>
              <Label className="mb-2 block">체형</Label>
              <div className="grid grid-cols-5 gap-2">
                {bodyTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => update('bodyType', type)}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.bodyType === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* MBTI */}
            <div>
              <Label className="mb-2 block">MBTI <span className="text-primary">*</span></Label>
              <div className="grid grid-cols-4 gap-3">
                {([ ["E","I","외향/내향","mbtiE"], ["S","N","감각/직관","mbtiS"], ["T","F","사고/감정","mbtiT"], ["P","J","인식/판단","mbtiP"] ] as [string,string,string,keyof typeof formData][]).map(
                  ([a, b, label, field]) => (
                    <div key={field} className="space-y-1.5">
                      <p className="text-xs text-center text-muted-foreground font-medium">{label}</p>
                      <div className="grid grid-cols-2 gap-1">
                        {[a, b].map((type) => (
                          <button
                            key={type}
                            onClick={() => update(field, type)}
                            className={`py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                              formData[field] === type
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border text-muted-foreground hover:border-primary/40"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
              {formData.mbtiE && formData.mbtiS && formData.mbtiT && formData.mbtiP && (
                <div className="mt-3 text-center bg-brand-soft rounded-lg py-2">
                  <p className="text-sm font-bold text-primary">
                    {formData.mbtiE}{formData.mbtiS}{formData.mbtiT}{formData.mbtiP}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────── STEP 3: 커리어/위치 ──────────── */}
        {miniStep === 3 && (
          <div className="space-y-5">
            {/* Job Category */}
            <div>
              <Label className="mb-2 block">직업 분야 <span className="text-primary">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {jobCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => update('jobCategory', category)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                      formData.jobCategory === category
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Education (선택) */}
            <div>
              <Label className="mb-2 block">최종 학력 <span className="text-muted-foreground text-xs font-normal">(선택)</span></Label>
              <div className="grid grid-cols-5 gap-2">
                {educationLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => update('education', level)}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.education === level
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div>
              <Label className="mb-2 block">거주 지역 <span className="text-primary">*</span></Label>
              <div className="grid grid-cols-4 gap-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    onClick={() => update('region', region)}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.region === region
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ──────────── STEP 4: 선택 정보 ──────────── */}
        {miniStep === 4 && (
          <div className="space-y-5">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary">
              💡 추가 정보를 입력하면 신뢰도와 매칭 확률이 올라가요!
            </div>

            {/* Phone */}
            <div>
              <Label className="mb-2 block">핸드폰 번호</Label>
              <Input
                type="tel"
                placeholder="010-1234-5678"
                value={formData.phoneNumber}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^\d]/g, '');
                  if (value.length > 3 && value.length <= 7) value = `${value.slice(0, 3)}-${value.slice(3)}`;
                  else if (value.length > 7) value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
                  update('phoneNumber', value);
                }}
                className="h-12 bg-card border-border"
                maxLength={13}
              />
            </div>

            {/* Company */}
            <div>
              <Label className="mb-2 block">직장명</Label>
              <Input
                placeholder="예: 구글"
                value={formData.company}
                onChange={(e) => update('company', e.target.value)}
                className="h-12 bg-card border-border"
                maxLength={30}
              />
            </div>

            {/* School & Major */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-2 block">학교명</Label>
                <Input
                  placeholder="예: 서울대학교"
                  value={formData.school}
                  onChange={(e) => update('school', e.target.value)}
                  className="h-12 bg-card border-border"
                />
              </div>
              <div>
                <Label className="mb-2 block">전공</Label>
                <Input
                  placeholder="예: 경영학"
                  value={formData.major}
                  onChange={(e) => update('major', e.target.value)}
                  className="h-12 bg-card border-border"
                />
              </div>
            </div>

            {/* Income */}
            <div>
              <Label className="mb-2 block">소득 인증</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 border-dashed hover:border-primary/40 hover:bg-secondary"
                onClick={() => toast.info('홈택스 연동 기능은 준비 중입니다')}
              >
                소득인증하기
              </Button>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                홈택스 연동으로 인증하면 고소득 뱃지가 프로필에 표시됩니다. (연소득 7,500만원 이상)
              </p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <Button
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="w-full h-14 bg-primary text-primary-foreground disabled:opacity-50"
        >
          {miniStep < 4 ? (
            <>
              다음
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            "다음 — 사진 등록"
          )}
        </Button>

        {/* Skip 버튼 — 선택 단계 (2, 4) 에서 노출 */}
        {(miniStep === 2 || miniStep === 4) && (
          <Button
            variant="ghost"
            onClick={handleNext}
            className="w-full text-muted-foreground text-sm"
          >
            지금은 건너뛰기 (나중에 마이프로필에서 추가)
          </Button>
        )}
      </div>
    </div>
  );
}
