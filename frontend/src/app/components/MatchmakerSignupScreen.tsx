import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../lib/auth/authService";
import { sendVerificationCode, verifyCode } from "../../lib/api/phoneVerification";

interface MatchmakerSignupScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function MatchmakerSignupScreen({ onBack, onSuccess }: MatchmakerSignupScreenProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    realName: "",
    nickname: "",
    phoneNumber: "",
    verificationCode: "",
    birthDate: "",
    gender: "MALE" as "MALE" | "FEMALE",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, "");

    // Format as 010-1234-5678
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange("phoneNumber", formatted);
  };

  const handleSendVerification = async () => {
    if (!formData.phoneNumber) {
      toast.error("핸드폰 번호를 입력해주세요");
      return;
    }

    // 핸드폰 번호 형식 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error("올바른 핸드폰 번호 형식이 아닙니다 (010-1234-5678)");
      return;
    }

    setIsVerificationLoading(true);

    try {
      const response = await sendVerificationCode(formData.phoneNumber);
      if (response.success) {
        setVerificationSent(true);
        toast.success("[베타] 인증번호: 000000 을 입력해주세요", { duration: 5000 });
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Failed to send verification:", error);
      toast.error("인증번호 발송에 실패했습니다");
    } finally {
      setIsVerificationLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.email) {
      toast.error("이메일을 입력해주세요");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("올바른 이메일 형식이 아닙니다");
      return false;
    }

    if (!formData.password) {
      toast.error("비밀번호를 입력해주세요");
      return false;
    }

    if (formData.password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return false;
    }

    if (!formData.realName) {
      toast.error("실명을 입력해주세요");
      return false;
    }

    if (!formData.nickname) {
      toast.error("닉네임을 입력해주세요");
      return false;
    }

    if (!formData.phoneNumber) {
      toast.error("핸드폰 번호를 입력해주세요");
      return false;
    }

    if (!verificationSent) {
      toast.error("인증번호를 발송해주세요");
      return false;
    }

    if (!formData.verificationCode) {
      toast.error("인증번호를 입력해주세요");
      return false;
    }

    if (!formData.birthDate) {
      toast.error("생년월일을 입력해주세요");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 먼저 인증번호 검증
      const verifyResponse = await verifyCode(formData.phoneNumber, formData.verificationCode);
      if (!verifyResponse.success) {
        toast.error(verifyResponse.message);
        setIsLoading(false);
        return;
      }

      // 회원가입 진행
      const response = await fetch("http://localhost:8080/api/v1/auth/email/matchmaker/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          realName: formData.realName,
          nickname: formData.nickname,
          phoneNumber: formData.phoneNumber,
          birthDate: formData.birthDate,
          gender: formData.gender,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "회원가입에 실패했습니다");
      }

      const data = await response.json();

      // 토큰 저장
      authService.setTokens(data.accessToken, data.refreshToken);

      toast.success("주선자 가입이 완료되었습니다!");
      onSuccess();
    } catch (error: any) {
      console.error("Signup failed:", error);
      const msg = error?.message || "";
      if (msg.includes("INVALID_BETA_CODE") || msg.includes("베타 코드")) {
        toast.error("베타 코드 인증이 만료됐어요. 다시 입력해주세요.", { duration: 4000 });
        localStorage.removeItem("palette_beta_passed");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(error.message || "회원가입에 실패했습니다");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">주선자 회원가입</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">주선자로 시작하기</h2>
            <p className="text-sm text-muted-foreground">
              주선 서비스를 제공하고 포인트를 받으세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호 *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="8자 이상"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인 *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호 재입력"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 실명 */}
            <div className="space-y-2">
              <Label htmlFor="realName">실명 *</Label>
              <Input
                id="realName"
                type="text"
                placeholder="홍길동"
                value={formData.realName}
                onChange={(e) => handleInputChange("realName", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임 *</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임 (최대 20자)"
                maxLength={20}
                value={formData.nickname}
                onChange={(e) => handleInputChange("nickname", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* 핸드폰 번호 */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">핸드폰 번호 * (본인인증 필수)</Label>
              <div className="flex gap-2">
                <Input
                  id="phoneNumber"
                  type="text"
                  placeholder="010-1234-5678"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  disabled={isLoading || verificationSent}
                  maxLength={13}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerification}
                  disabled={isLoading || verificationSent || isVerificationLoading}
                  className="whitespace-nowrap"
                >
                  {isVerificationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : verificationSent ? (
                    "발송완료"
                  ) : (
                    "인증번호"
                  )}
                </Button>
              </div>
            </div>

            {/* 인증번호 입력 */}
            {verificationSent && (
              <div className="space-y-2">
                <Label htmlFor="verificationCode">인증번호 *</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="6자리 인증번호"
                  value={formData.verificationCode}
                  onChange={(e) => handleInputChange("verificationCode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={isLoading}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  인증번호가 오지 않으면 다시 발송해주세요
                </p>
              </div>
            )}

            {/* 생년월일 */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일 *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
                disabled={isLoading}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <Label>성별 *</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={formData.gender === "MALE"}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    disabled={isLoading}
                    className="w-4 h-4"
                  />
                  <span>남성</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={formData.gender === "FEMALE"}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    disabled={isLoading}
                    className="w-4 h-4"
                  />
                  <span>여성</span>
                </label>
              </div>
            </div>

            {/* 주의사항 */}
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <h3 className="font-semibold">주선자 가입 안내</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 핸드폰 본인인증은 필수입니다</li>
                <li>• 주선 성공 시 포인트를 획득합니다</li>
                <li>• 레벨별로 커미션율이 상승합니다 (30-50%)</li>
                <li>• 신뢰할 수 있는 주선 서비스를 제공해주세요</li>
              </ul>
            </div>

            {/* 가입 버튼 */}
            <Button
              type="submit"
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  가입 처리 중...
                </>
              ) : (
                "주선자로 가입하기"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
