import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { User, Calendar, Ruler, Briefcase, GraduationCap, MapPin, ArrowLeft } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface BasicInfoScreenProps {
  onNext: () => void;
  onBack?: () => void;
}

const jobCategories = [
  "IT/개발", "금융/보험", "교육", "의료/보건", "미디어/엔터",
  "서비스/영업", "제조/생산", "공무원/공공기관", "전문직", "기타"
];

const educationLevels = ["고졸", "전문대", "대졸", "석사", "박사"];
const bodyTypes = ["슬림", "보통", "탄탄", "건장", "풍만"];
const regions = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

interface UserProfile {
  userId: string;
  nickname: string;
  accountType: string;
  isProfileCompleted: boolean;
  realName?: string;
  birthDate?: string; // YYYY-MM-DD format
  gender?: string;
}

export function BasicInfoScreen({ onNext, onBack }: BasicInfoScreenProps) {
  const [formData, setFormData] = useState({
    name: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    gender: "",
    height: 170,
    bodyType: "",
    jobCategory: "",
    company: "",
    position: "",
    education: "",
    school: "",
    major: "",
    region: "",
    hometown: "",
  });
  const [isLoading, setIsLoading] = useState(true);

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

  const isValid = formData.name && formData.birthYear && formData.birthMonth && formData.birthDay &&
    formData.gender && formData.bodyType && formData.jobCategory && formData.education && formData.region;

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
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-center">기본 정보 입력</h2>
        </div>
        <div className="space-y-2">
          <Progress value={20} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">1/5 단계 - 약 2분 소요</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-6">
          <h3 className="text-rose-900 mb-2">환영합니다! 👋</h3>
          <p className="text-sm text-rose-700">
            당신에 대해 조금 더 알려주세요. 진솔한 정보가 더 좋은 인연을 만듭니다.
          </p>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <Label className="mb-2 block">이름 *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="본명을 입력해주세요"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-11 h-12 bg-white border-slate-200"
                maxLength={20}
              />
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <Label className="mb-2 block">생년월일 * {calculateAge()}</Label>
            <div className="grid grid-cols-3 gap-3">
              <Input
                type="number"
                placeholder="년도"
                value={formData.birthYear}
                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                className="h-12 bg-white border-slate-200"
              />
              <Input
                type="number"
                placeholder="월"
                value={formData.birthMonth}
                onChange={(e) => setFormData({ ...formData, birthMonth: e.target.value })}
                className="h-12 bg-white border-slate-200"
                min="1"
                max="12"
              />
              <Input
                type="number"
                placeholder="일"
                value={formData.birthDay}
                onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                className="h-12 bg-white border-slate-200"
                min="1"
                max="31"
              />
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
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                      : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
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
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                      : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Job Category */}
          <div>
            <Label className="mb-2 block">직업 분야 *</Label>
            <select
              value={formData.jobCategory}
              onChange={(e) => setFormData({ ...formData, jobCategory: e.target.value })}
              className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 bg-white focus:border-pink-400 focus:ring-pink-400"
            >
              <option value="">선택해주세요</option>
              {jobCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Company & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block">회사명 (선택)</Label>
              <Input
                placeholder="예: 구글"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="h-12 bg-white border-slate-200"
                maxLength={30}
              />
            </div>
            <div>
              <Label className="mb-2 block">직급 (선택)</Label>
              <Input
                placeholder="예: 대리"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="h-12 bg-white border-slate-200"
              />
            </div>
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
                      ? "bg-gradient-to-r from-pink-400 to-rose-400 text-white border-pink-400"
                      : "bg-white border-slate-200 text-slate-600 hover:border-pink-300"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* School & Major */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block">학교명 (선택)</Label>
              <Input
                placeholder="예: 서울대학교"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="h-12 bg-white border-slate-200"
              />
            </div>
            <div>
              <Label className="mb-2 block">전공 (선택)</Label>
              <Input
                placeholder="예: 경영학"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="h-12 bg-white border-slate-200"
              />
            </div>
          </div>

          {/* Region */}
          <div>
            <Label className="mb-2 block">거주 지역 *</Label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full h-12 px-4 rounded-lg border-2 border-slate-200 bg-white focus:border-pink-400 focus:ring-pink-400"
            >
              <option value="">선택해주세요</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Hometown */}
          <div>
            <Label className="mb-2 block">출신 지역 (선택)</Label>
            <Input
              placeholder="예: 서울 강남구"
              value={formData.hometown}
              onChange={(e) => setFormData({ ...formData, hometown: e.target.value })}
              className="h-12 bg-white border-slate-200"
            />
          </div>
        </div>

        {/* Next Button */}
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-400 text-white disabled:opacity-50"
        >
          다음 - 사진 등록
        </Button>
      </div>
    </div>
  );
}
