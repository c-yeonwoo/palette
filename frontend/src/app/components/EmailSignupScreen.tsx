import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";
import { toast } from "sonner";

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
    birthDate: "",
    gender: "MALE" as "MALE" | "FEMALE",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

    setIsSubmitting(true);

    try {
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
        birthDate: formData.birthDate,
        gender: formData.gender,
      });

      // 토큰 저장
      tokenStorage.setTokens(response.accessToken, response.refreshToken);

      toast.success("회원가입이 완료되었습니다!");
      onSuccess();
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
