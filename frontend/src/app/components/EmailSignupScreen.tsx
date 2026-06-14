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
    inviteCode: "",  // 옵션 — 유효 시 양쪽 100 물감 보너스 + 자동 1촌 (ADR 0048)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [verificationVerified, setVerificationVerified] = useState(false);

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
        setVerificationVerified(false);
        setFormData(prev => ({ ...prev, verificationCode: "" }));
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

    // 생년월일 형식 / 범위 검증 (브라우저 type="date" 가 형식 미준수 입력을 그대로 통과시키는 케이스 방어)
    const isoDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDate.test(formData.birthDate)) {
      toast.error("생년월일 형식이 올바르지 않습니다 (예: 1994-06-22)");
      return;
    }
    const birth = new Date(formData.birthDate);
    const now = new Date();
    if (isNaN(birth.getTime()) || birth > now || birth < new Date("1900-01-01")) {
      toast.error("생년월일을 다시 확인해주세요");
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
        toast.error(verifyResponse.message || "인증번호가 올바르지 않습니다");
        setIsSubmitting(false);
        return;
      }
      setVerificationVerified(true);

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
        inviteCode: formData.inviteCode.trim() || undefined,  // 빈 값은 보내지 않음
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

      if (formData.inviteCode.trim()) {
        toast.success("회원가입 완료! 초대 코드로 보너스 100 물감 받았어요", { duration: 4500 });
      } else {
        toast.success("회원가입이 완료되었습니다!");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Signup failed:", error);
      const msg = error?.message || "";
      if (msg.includes("INVALID_BETA_CODE") || msg.includes("베타 코드")) {
        // 베타 쿠키 만료 — 베타 게이트 다시 보여주기
        toast.error("베타 코드 인증이 만료됐어요. 다시 입력해주세요.", { duration: 4000 });
        localStorage.removeItem("palette_beta_passed");
        setTimeout(() => window.location.reload(), 1500);
      } else if (error.status === 400) {
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
          <CardDescription>팔레트에 가입하여 새로운 인연을 만나보세요</CardDescription>
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
                  onChange={(e) => {
                    handlePhoneNumberChange(e.target.value);
                    if (verificationSent) setVerificationSent(false);
                  }}
                  disabled={isSubmitting || verificationVerified}
                  maxLength={13}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerification}
                  disabled={isSubmitting || verificationVerified || isVerificationLoading}
                  className="whitespace-nowrap"
                >
                  {isVerificationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : verificationSent ? (
                    "재발송"
                  ) : (
                    "인증번호"
                  )}
                </Button>
              </div>
              {formData.phoneNumber && !/^010-\d{4}-\d{4}$/.test(formData.phoneNumber) && (
                <p className="text-xs text-red-500">올바른 형식으로 입력해주세요 (010-1234-5678)</p>
              )}
            </div>

            {/* 인증번호 입력 */}
            {verificationSent && !verificationVerified && (
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
                  인증번호가 오지 않으면 재발송 버튼을 눌러주세요
                </p>
              </div>
            )}
            {verificationVerified && (
              <p className="text-xs text-green-600">✓ 인증이 완료되었습니다</p>
            )}

            {/* 초대 코드 (옵션) — 유효 시 양쪽 100 물감 보너스 + 자동 1촌 */}
            <div className="space-y-2 pt-2">
              <Label htmlFor="inviteCode" className="flex items-center gap-2">
                초대 코드
                <span className="text-[10px] font-normal text-muted-foreground">(선택)</span>
              </Label>
              <Input
                id="inviteCode"
                name="inviteCode"
                type="text"
                placeholder="ABCD1234"
                value={formData.inviteCode}
                onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value.toUpperCase().slice(0, 10) })}
                disabled={isSubmitting}
                maxLength={10}
                autoCapitalize="characters"
                spellCheck={false}
                className="font-mono tracking-wider"
              />
              <p className="text-xs text-muted-foreground">
                지인에게 받은 코드를 입력하면 양쪽에 <strong className="text-foreground">100 물감</strong> 보너스 + 자동으로 친구가 돼요
              </p>
            </div>

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
