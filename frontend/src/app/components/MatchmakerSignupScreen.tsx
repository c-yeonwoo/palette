import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";
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
  // ADR 0046 — 외부 송금 금지 약관 §6 동의 (의무)
  const [agreedNoExternalPay, setAgreedNoExternalPay] = useState(false);

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

  // 생년월일 — 숫자만 입력하면 YYYY-MM-DD 로 자동 포맷. (date picker 의 수십 년 스크롤 제거)
  const formatBirthDate = (value: string) => {
    const n = value.replace(/\D/g, "").slice(0, 8);
    if (n.length <= 4) return n;
    if (n.length <= 6) return `${n.slice(0, 4)}-${n.slice(4)}`;
    return `${n.slice(0, 4)}-${n.slice(4, 6)}-${n.slice(6, 8)}`;
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
      const response = await sendVerificationCode(formData.phoneNumber, true);
      if (response.success) {
        setVerificationSent(true);
        toast.success("[베타] 인증번호: 000000 을 입력해주세요", { duration: 5000 });
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Failed to send verification:", error);
      // 중복 번호 등 백엔드 사유 그대로 노출
      toast.error((error as Error)?.message || "인증번호 발송에 실패했습니다");
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

    if (!agreedNoExternalPay) {
      toast.error("외부 송금 금지 약관에 동의해주세요");
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

      // 회원가입 진행 (api 래퍼 — 환경별 base URL + 에러 메시지 정규화)
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
      }>(
        "/api/v1/auth/email/matchmaker/signup",
        {
          email: formData.email,
          password: formData.password,
          realName: formData.realName,
          nickname: formData.nickname,
          phoneNumber: formData.phoneNumber,
          birthDate: formData.birthDate,
          gender: formData.gender,
        },
        { requiresAuth: false }
      );

      // 토큰 저장 (이메일 로그인과 동일 형태)
      const now = new Date();
      tokenStorage.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenType: data.tokenType,
        expiresAt: new Date(now.getTime() + data.expiresIn * 1000).toISOString(),
        refreshExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

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
      <div className="sticky top-0 bg-card/95 backdrop-blur border-b z-10">
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
                type="text"
                inputMode="numeric"
                placeholder="예: 1995-06-15"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", formatBirthDate(e.target.value))}
                disabled={isLoading}
                maxLength={10}
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

            {/* 주선자로 활동하면 — 명예/보람 (ADR 0064 무현금 모델) */}
            <div className="bg-card border border-primary/20 p-4 rounded-lg space-y-3 text-sm">
              <h3 className="font-semibold text-foreground">주선자로 활동하면</h3>
              <ul className="space-y-2 text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">·</span>
                  <span>믿을 수 있는 지인으로서 두 사람의 소중한 인연을 이어줘요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">·</span>
                  <span>매칭을 성사할수록 <strong>주선자 등급</strong>이 오르고 프로필에 신뢰 배지가 쌓여요</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">·</span>
                  <span>리그·랭킹에서 다른 주선자들과 명예를 겨뤄요</span>
                </li>
              </ul>
            </div>

            {/* 주의사항 */}
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <h3 className="font-semibold">주선자 가입 안내</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 핸드폰 본인인증은 필수입니다</li>
                <li>• 매칭을 성사할수록 주선자 등급이 올라가요</li>
                <li>• 신뢰할 수 있는 주선 서비스를 제공해주세요</li>
              </ul>
            </div>

            {/* 금전 대가 없는 호의 + 외부 송금 금지 동의 (의무) */}
            <div className="bg-amber-50 border border-amber-300 p-4 rounded-lg space-y-2.5 text-sm">
              <h3 className="font-semibold text-amber-900">주선 활동 약속</h3>
              <p className="text-xs text-amber-900/85 leading-relaxed">
                주선은 금전적 대가 없이 지인을 이어주는 호의 활동이에요. 사용자에게 계좌이체·간편송금·현금 등
                어떤 형태의 금전도 요구하거나 유도하지 않습니다. 위반 시 계정 이용이 제한될 수 있어요.
              </p>
              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreedNoExternalPay}
                  onChange={(e) => setAgreedNoExternalPay(e.target.checked)}
                  className="mt-0.5 w-4 h-4"
                />
                <span className="text-xs text-amber-900 font-medium">
                  위 내용에 동의하며, 금전 요구·유도 없이 활동하겠습니다 (필수)
                </span>
              </label>
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
