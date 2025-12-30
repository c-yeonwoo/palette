import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";
import { toast } from "sonner";
import { sendVerificationCode, verifyCode } from "../../lib/api/phoneVerification";
import { Loader2 } from "lucide-react";

interface EmailSignupScreenProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export function EmailSignupScreen({ onSuccess, onBackToLogin }: EmailSignupScreenProps) {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
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
    setFormData({ ...formData, phoneNumber: formatted });
  };

  const handleSendVerification = async () => {
    if (!formData.phoneNumber) {
      toast.error("핸드폰 번호를 입력해주세요");
      return;
    }

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
        toast.success("인증번호가 발송되었습니다");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    // 비밀번호 길이 확인
    if (formData.password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다");
      return;
    }

    // 핸드폰 인증 확인
    if (!verificationSent) {
      toast.error("인증번호를 발송해주세요");
      return;
    }

    if (!formData.verificationCode) {
      toast.error("인증번호를 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      // 먼저 인증번호 검증
      const verifyResponse = await verifyCode(formData.phoneNumber, formData.verificationCode);
      if (!verifyResponse.success) {
        toast.error(verifyResponse.message);
        setIsSubmitting(false);
        return;
      }

      // 회원가입 진행
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
      }>("/api/v1/auth/email/signup", {
        email: formData.email,
        password: formData.password,
        realName: formData.realName,
        nickname: formData.nickname,
        phoneNumber: formData.phoneNumber,
        birthDate: formData.birthDate,
        gender: formData.gender,
      }, { requiresAuth: false });

      // 토큰 저장
      const now = new Date();
      const accessTokenExpiry = new Date(now.getTime() + response.expiresIn * 1000);
      const refreshTokenExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      tokenStorage.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        tokenType: response.tokenType,
        expiresAt: accessTokenExpiry.toISOString(),
        refreshExpiresAt: refreshTokenExpiry.toISOString(),
      });

      toast.success("회원가입이 완료되었습니다!");

      // 화면 전환을 위해 약간의 딜레이
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error: any) {
      console.error("Signup failed:", error);
      if (error.response?.status === 400) {
        toast.error("이미 사용 중인 이메일 또는 닉네임입니다");
      } else {
        toast.error("회원가입에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">이메일로 회원가입</CardTitle>
          <CardDescription>Pallete에 가입하여 새로운 인연을 만나보세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="8자 이상 입력"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="비밀번호 재입력"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
              />
            </div>

            {/* 실명 */}
            <div className="space-y-2">
              <Label htmlFor="realName">이름</Label>
              <Input
                id="realName"
                name="realName"
                type="text"
                placeholder="홍길동"
                value={formData.realName}
                onChange={handleChange}
                required
              />
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                name="nickname"
                type="text"
                placeholder="닉네임 (20자 이내)"
                value={formData.nickname}
                onChange={handleChange}
                required
                maxLength={20}
              />
            </div>

            {/* 생년월일 */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <Label htmlFor="gender">성별</Label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
            </div>

            {/* 핸드폰 번호 */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">핸드폰 번호 (본인인증 필수)</Label>
              <div className="flex gap-2">
                <Input
                  id="phoneNumber"
                  type="text"
                  placeholder="010-1234-5678"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  disabled={isSubmitting || verificationSent}
                  maxLength={13}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerification}
                  disabled={isSubmitting || verificationSent || isVerificationLoading}
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
                <Label htmlFor="verificationCode">인증번호</Label>
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  placeholder="6자리 인증번호"
                  value={formData.verificationCode}
                  onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  disabled={isSubmitting}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  인증번호가 오지 않으면 다시 발송해주세요
                </p>
              </div>
            )}

            {/* 버튼 */}
            <div className="space-y-2 pt-4">
              <Button
                type="submit"
                className="w-full h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? "가입 중..." : "회원가입"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={onBackToLogin}
              >
                로그인으로 돌아가기
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
