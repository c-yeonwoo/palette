import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { User, ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { useOnboardingOptions } from "../../lib/onboarding/useOnboardingOptions";
import { useOnboardingFields } from "../../lib/onboarding/useOnboardingFields";
import { SIDO_LIST, SIGUNGU } from "../../lib/regions";
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

/** 4 mini-steps — step 1, 3 만 필수, 2/4 는 건너뛰기 가능
 *  1 → 신원 (필수: 이름, 생년월일, 성별)
 *  2 → 외형/성격 (선택: 키, 체형, MBTI)
 *  3 → 커리어/위치 (필수: 직업, 지역)
 *  4 → 추가 정보 (선택: 전화, 회사, 학교)
 */
type MiniStep = 1 | 2 | 3;

const MINI_STEP_META: Record<MiniStep, { title: string; subtitle: string }> = {
  1: { title: "나를 소개할게요", subtitle: "이름, 생년월일, 성별" },
  2: { title: "조금 더 알려주세요", subtitle: "선택사항이에요. 부담없이!" },
  3: { title: "어디서 무슨 일을 하나요?", subtitle: "직업과 지역" },
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
  const { options } = useOnboardingOptions();   // ADR 0057 — 어드민 관리 칩
  const fields = useOnboardingFields();         // ADR 0058 3b — 라벨·힌트·노출 메타 (선택 필드)
  const bodyTypes = options.bodyType ?? [];
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
    district: initialData?.locationInfo?.district || "",
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
  // 거주지역: 시/도 필수 + 시군구가 있는 시/도면 시군구까지(세종 등 하위 없으면 시/도만)
  const regionValid = !!formData.region && ((SIGUNGU[formData.region]?.length ?? 0) === 0 || !!formData.district);
  const isStep3Valid = !!(formData.jobCategory && regionValid);  // 학력 필수에서 제외

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
    if (miniStep < 3) {
      setMiniStep((miniStep + 1) as MiniStep);
      // 데스크탑에선 .app-frame(#appScroll) 이 스크롤 컨테이너 → 그쪽도 같이 리셋
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.getElementById('appScroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onNext({
        basicInfo: {
          name: formData.name,
          birthYear: formData.birthYear,
          birthMonth: formData.birthMonth,
          birthDay: formData.birthDay,
          gender: formData.gender,
          height: formData.height,
          bodyType: formData.bodyType,
          mbti: `${formData.mbtiE}${formData.mbtiS}${formData.mbtiT}${formData.mbtiP}`,
        },
        careerInfo: { category: formData.jobCategory, company: formData.company, incomeRange: "" },
        educationInfo: { level: formData.education, school: formData.school, major: formData.major },
        locationInfo: { region: formData.region, district: formData.district },
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
            <p className="text-xs text-muted-foreground">{miniStep}/3 단계</p>
          </div>
        </div>

        {/* Overall progress */}
        <Progress value={progressValue} className="h-1.5" />

        {/* Mini-step dots */}
        <div className="flex justify-center gap-2">
          {([1, 2, 3] as MiniStep[]).map((s) => (
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
                        ? "bg-brand-soft text-gold-strong border-brand/40"
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
              이 단계는 <strong>모두 선택사항</strong>이에요. 채울수록 매칭이 더 정확해지지만,
              지금 부담스러우면 <strong>"건너뛰기"</strong> 버튼을 눌러 다음으로 진행해도 됩니다.
            </div>
            {/* Height */}
            {fields.visible("height") && (
            <div>
              <Label className="mb-2 block">
                {fields.label("height", "키")}
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
            )}

            {/* Body Type */}
            {fields.visible("bodyType") && (
            <div>
              <Label className="mb-2 block">{fields.label("bodyType", "체형")}</Label>
              <div className="grid grid-cols-5 gap-2">
                {bodyTypes.map((type) => (
                  <button
                    key={type.code}
                    onClick={() => update('bodyType', type.code)}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.bodyType === type.code
                        ? "bg-brand-soft text-gold-strong border-brand/40"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* MBTI */}
            {fields.visible("mbti") && (
            <div>
              <Label className="mb-2 block">{fields.label("mbti", "MBTI")}</Label>
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
                                ? "bg-brand-soft text-gold-strong border-brand/40"
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
            )}
          </div>
        )}

        {/* ──────────── STEP 3: 커리어/위치 ──────────── */}
        {miniStep === 3 && (
          <div className="space-y-5">
            {/* Job Category (구조 필드 — 항상 노출, 라벨만 메타) */}
            <div>
              <Label className="mb-2 block">{fields.label("jobCategory", "직업 분야")} <span className="text-primary">*</span></Label>
              <div className="grid grid-cols-2 gap-2">
                {jobCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => update('jobCategory', category)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                      formData.jobCategory === category
                        ? "bg-brand-soft text-gold-strong border-brand/40"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* 최종 학력만 수집 — 학교명·전공은 추후 인증(예: SKY 대학 인증)으로 대체 */}
            {fields.visible("education") && (
            <div>
              <Label className="mb-2 block">{fields.label("education", "최종 학력")} <span className="text-muted-foreground text-xs font-normal">(선택)</span></Label>
              <div className="grid grid-cols-5 gap-2">
                {educationLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => update('education', level)}
                    className={`py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.education === level
                        ? "bg-brand-soft text-gold-strong border-brand/40"
                        : "bg-card border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Region (구조 필드) — 시/도 → 시·군·구 2단계 드롭다운 */}
            <div>
              <Label className="mb-2 block">{fields.label("region", "거주 지역")} <span className="text-primary">*</span></Label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value, district: "" }))}
                  className="h-12 px-3 rounded-lg border-2 border-border bg-card focus:border-primary text-sm"
                >
                  <option value="">시/도</option>
                  {SIDO_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={formData.district}
                  onChange={(e) => update('district', e.target.value)}
                  disabled={!formData.region || (SIGUNGU[formData.region]?.length ?? 0) === 0}
                  className="h-12 px-3 rounded-lg border-2 border-border bg-card focus:border-primary text-sm disabled:opacity-50"
                >
                  <option value="">
                    {!formData.region ? "시/군/구" : (SIGUNGU[formData.region]?.length ?? 0) === 0 ? "해당 없음" : "시/군/구"}
                  </option>
                  {(SIGUNGU[formData.region] ?? []).map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4(전화·직장·소득)는 제거됨 — 전화는 별도 인증 프로세스, 직장·소득은 인증 영역에서 처리 */}

        {/* CTA Button */}
        <Button
          onClick={handleNext}
          disabled={!isCurrentStepValid()}
          className="w-full h-14 bg-brand-soft text-gold-strong disabled:opacity-50"
        >
          {miniStep < 3 ? (
            <>
              다음
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            "다음"
          )}
        </Button>

        {/* Skip 버튼 — 선택 단계 (2) 에서 노출 */}
        {miniStep === 2 && (
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
