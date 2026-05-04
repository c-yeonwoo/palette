import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { User, Calendar, Ruler, Briefcase, GraduationCap, MapPin, ArrowLeft } from "lucide-react";
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

const incomeRanges = [
  { value: "INCOME_RANGE_1", label: "5,000만원 이하" },
  { value: "INCOME_RANGE_2", label: "5,000~7,500만원" },
  { value: "INCOME_RANGE_3", label: "7,500~9,000만원" },
  { value: "INCOME_RANGE_4", label: "9,000~11,000만원" },
  { value: "INCOME_RANGE_5", label: "11,000만원 이상" }
];

const educationLevels = ["고졸", "전문대", "대졸", "석사", "박사"];
const bodyTypes = ["슬림", "보통", "탄탄", "건장", "통통"];
const mbtiTypes = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ"
];
const regions = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

interface UserProfile {
  userId: string;
  nickname: string;
  accountType: string;
  isProfileCompleted: boolean;
  realName?: string;
  birthDate?: string; // YYYY-MM-DD format
  gender?: string;
  phoneNumber?: string;
}

export function BasicInfoScreen({ onNext, onBack, initialData }: BasicInfoScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: initialData?.basicInfo?.name || "",
    birthYear: initialData?.basicInfo?.birthYear || "",
    birthMonth: initialData?.basicInfo?.birthMonth || "",
    birthDay: initialData?.basicInfo?.birthDay || "",
    gender: initialData?.basicInfo?.gender || "",
    phoneNumber: "",
    height: initialData?.basicInfo?.height || 170,
    bodyType: initialData?.basicInfo?.bodyType || "",
    mbtiE: initialData?.basicInfo?.mbti ? initialData.basicInfo.mbti[0] : "",
    mbtiS: initialData?.basicInfo?.mbti ? initialData.basicInfo.mbti[1] : "",
    mbtiT: initialData?.basicInfo?.mbti ? initialData.basicInfo.mbti[2] : "",
    mbtiP: initialData?.basicInfo?.mbti ? initialData.basicInfo.mbti[3] : "",
    jobCategory: initialData?.careerInfo?.category || "",
    company: initialData?.careerInfo?.company || "",
    incomeRange: initialData?.careerInfo?.incomeRange || "",
    education: initialData?.educationInfo?.level || "",
    school: initialData?.educationInfo?.school || "",
    major: initialData?.educationInfo?.major || "",
    region: initialData?.locationInfo?.region || "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const birthYears = Array.from({ length: currentYear - 1959 }, (_, i) => String(currentYear - i));
  const birthMonths = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const birthDays = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await api.get<UserProfile>('/api/v1/auth/me');

        // Fill in existing user data
        if (userData.realName) {
          setFormData(prev => ({ ...prev, name: userData.realName! }));
        }

        if (userData.birthDate) {
          const [year, month, day] = userData.birthDate.split('-');
          setFormData(prev => ({
            ...prev,
            birthYear: year,
            birthMonth: month,
            birthDay: day
          }));
        }

        if (userData.gender) {
          // Convert MALE/FEMALE to 남성/여성
          const genderMap: { [key: string]: string } = {
            'MALE': '남성',
            'FEMALE': '여성'
          };
          setFormData(prev => ({
            ...prev,
            gender: genderMap[userData.gender!] || userData.gender!
          }));
        }

        if (userData.phoneNumber) {
          setFormData(prev => ({
            ...prev,
            phoneNumber: userData.phoneNumber!
          }));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        toast.error('사용자 정보를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const calculateAge = () => {
    if (formData.birthYear) {
      const age = new Date().getFullYear() - parseInt(formData.birthYear);
      return age > 0 ? ` (만 ${age}세)` : "";
    }
    return "";
  };

  const isPhoneValid = /^010-\d{4}-\d{4}$/.test(formData.phoneNumber);

  const isStep1Valid = !!(formData.name && formData.birthYear && formData.birthMonth && formData.birthDay &&
    formData.gender && formData.bodyType && formData.mbtiE && formData.mbtiS && formData.mbtiT && formData.mbtiP &&
    formData.jobCategory && formData.education && formData.region);

  const isValid = isStep1Valid;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <div className="bg-card border-b border-border px-6 py-4 space-y-3">
        <div className="relative">
          <button
            onClick={() => {
              if (step === 2) setStep(1);
              else if (onBack) onBack();
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-center">{step === 1 ? "기본 정보 입력" : "추가 정보 (선택)"}</h2>
        </div>
        <div className="space-y-2">
          <Progress value={20} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">
            1/5 단계 ({step === 1 ? "필수 정보" : "선택 정보"}) - 약 2분 소요
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome Message */}
        <div className="bg-secondary border border-border rounded-xl p-6">
          <h3 className="text-foreground mb-2">환영합니다! 👋</h3>
          <p className="text-sm text-muted-foreground">
            당신에 대해 조금 더 알려주세요. 진솔한 정보가 더 좋은 인연을 만듭니다.
          </p>
        </div>

        {/* Step 1: Required fields */}
        {step === 1 && <div className="space-y-5">
          {/* Name */}
          <div>
            <Label className="mb-2 block">이름 *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="본명을 입력해주세요"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-11 h-12 bg-card border-border"
                maxLength={20}
              />
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <Label className="mb-2 block">생년월일 * {calculateAge()}</Label>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={formData.birthYear}
                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                className="h-12 px-3 rounded-lg border-2 border-border bg-card focus:border-primary text-sm"
              >
                <option value="">년도</option>
                {birthYears.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select
                value={formData.birthMonth}
                onChange={(e) => setFormData({ ...formData, birthMonth: e.target.value })}
                className="h-12 px-3 rounded-lg border-2 border-border bg-card focus:border-primary text-sm"
              >
                <option value="">월</option>
                {birthMonths.map(m => <option key={m} value={m}>{parseInt(m)}월</option>)}
              </select>
              <select
                value={formData.birthDay}
                onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                className="h-12 px-3 rounded-lg border-2 border-border bg-card focus:border-primary text-sm"
              >
                <option value="">일</option>
                {birthDays.map(d => <option key={d} value={d}>{parseInt(d)}일</option>)}
              </select>
            </div>
          </div>

          {/* Gender */}
          <div>
            <Label className="mb-2 block">성별 *</Label>
            <div className="grid grid-cols-2 gap-3">
              {["남성", "여성"].map((gender) => (
                <button
                  key={gender}
                  onClick={() => setFormData({ ...formData, gender })}
                  className={`py-3 rounded-xl border-2 font-medium transition-all ${
                    formData.gender === gender
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div>
            <Label className="mb-2 block">키 * - {formData.height}cm</Label>
            <input
              type="range"
              min="140"
              max="220"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>140cm</span>
              <span>220cm</span>
            </div>
          </div>

          {/* Body Type */}
          <div>
            <Label className="mb-2 block">체형 *</Label>
            <div className="grid grid-cols-5 gap-2">
              {bodyTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, bodyType: type })}
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
            <Label className="mb-2 block">MBTI *</Label>
            <div className="grid grid-cols-4 gap-3">
              {/* E/I */}
              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground font-medium">외향/내향</p>
                <div className="grid grid-cols-2 gap-1">
                  {["E", "I"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, mbtiE: type })}
                      className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.mbtiE === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {/* S/N */}
              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground font-medium">감각/직관</p>
                <div className="grid grid-cols-2 gap-1">
                  {["S", "N"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, mbtiS: type })}
                      className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.mbtiS === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {/* T/F */}
              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground font-medium">사고/감정</p>
                <div className="grid grid-cols-2 gap-1">
                  {["T", "F"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, mbtiT: type })}
                      className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.mbtiT === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              {/* P/J */}
              <div className="space-y-2">
                <p className="text-xs text-center text-muted-foreground font-medium">인식/판단</p>
                <div className="grid grid-cols-2 gap-1">
                  {["P", "J"].map((type) => (
                    <button
                      key={type}
                      onClick={() => setFormData({ ...formData, mbtiP: type })}
                      className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.mbtiP === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {formData.mbtiE && formData.mbtiS && formData.mbtiT && formData.mbtiP && (
              <p className="text-sm text-center text-primary font-medium mt-2">
                선택된 MBTI: {formData.mbtiE}{formData.mbtiS}{formData.mbtiT}{formData.mbtiP}
              </p>
            )}
          </div>

          {/* Job Category */}
          <div>
            <Label className="mb-2 block">직업 분야 *</Label>
            <select
              value={formData.jobCategory}
              onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value })}
              className="w-full h-12 px-4 rounded-lg border-2 border-border bg-card focus:border-primary focus:ring-primary"
            >
              <option value="">선택해주세요</option>
              {jobCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Education */}
          <div>
            <Label className="mb-2 block">최종 학력 *</Label>
            <div className="grid grid-cols-5 gap-2">
              {educationLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setFormData({ ...formData, education: level })}
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
            <Label className="mb-2 block">거주 지역 *</Label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full h-12 px-4 rounded-lg border-2 border-border bg-card focus:border-primary focus:ring-primary"
            >
              <option value="">선택해주세요</option>
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>}

        {/* Step 2: Optional fields */}
        {step === 2 && <div className="space-y-5">
          <div className="bg-secondary border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">아래 정보는 모두 선택 사항이에요. 건너뛰어도 괜찮아요!</p>
          </div>

          {/* Phone Number */}
          <div>
            <Label className="mb-2 block">핸드폰 번호</Label>
            <Input
              type="tel"
              placeholder="010-1234-5678"
              value={formData.phoneNumber}
              onChange={(e) => {
                let value = e.target.value.replace(/[^\d]/g, '');
                if (value.length > 3 && value.length <= 7) value = value.slice(0, 3) + '-' + value.slice(3);
                else if (value.length > 7) value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
                setFormData({ ...formData, phoneNumber: value });
              }}
              className="h-12 bg-card border-border"
              maxLength={13}
            />
            {formData.phoneNumber && !isPhoneValid && (
              <p className="text-xs text-red-500 mt-1">올바른 형식으로 입력해주세요 (010-1234-5678)</p>
            )}
          </div>

          {/* Company */}
          <div>
            <Label className="mb-2 block">직장명</Label>
            <Input
              placeholder="예: 구글"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="h-12 bg-card border-border"
              />
            </div>
            <div>
              <Label className="mb-2 block">전공</Label>
              <Input
                placeholder="예: 경영학"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="h-12 bg-card border-border"
              />
            </div>
          </div>

          {/* Income Verification */}
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
        </div>}

        {/* Next / Submit Button */}
        {step === 1 ? (
          <Button
            onClick={() => setStep(2)}
            disabled={!isStep1Valid}
            className="w-full h-14 bg-primary text-primary-foreground disabled:opacity-50"
          >
            다음 - 추가 정보 (선택)
          </Button>
        ) : (
          <Button
            onClick={() => onNext({
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
              careerInfo: {
                category: formData.jobCategory,
                company: formData.company,
                incomeRange: formData.incomeRange,
              },
              educationInfo: {
                level: formData.education,
                school: formData.school,
                major: formData.major,
              },
              locationInfo: {
                region: formData.region,
                district: "",
              },
            })}
            className="w-full h-14 bg-primary text-primary-foreground"
          >
            다음 - 사진 등록
          </Button>
        )}
      </div>
    </div>
  );
}
