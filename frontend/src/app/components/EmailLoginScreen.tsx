import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";
import { toast } from "sonner";

interface EmailLoginScreenProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
  onGoToSignup: () => void;
}

export function EmailLoginScreen({ onSuccess, onBackToLogin, onGoToSignup }: EmailLoginScreenProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
      }>("/api/v1/auth/email/login", {
        email: formData.email,
        password: formData.password,
      });

      // 토큰 저장
      tokenStorage.setTokens(response.accessToken, response.refreshToken);

      toast.success("로그인되었습니다!");
      onSuccess();
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.response?.status === 401) {
        toast.error("이메일 또는 비밀번호가 올바르지 않습니다");
      } else {
        toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">이메일 로그인</CardTitle>
          <CardDescription>이메일과 비밀번호로 로그인하세요</CardDescription>
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
                placeholder="비밀번호 입력"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* 버튼 */}
            <div className="space-y-2 pt-4">
              <Button
                type="submit"
                className="w-full h-12"
                disabled={isSubmitting}
              >
                {isSubmitting ? "로그인 중..." : "로그인"}
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={onBackToLogin}
                >
                  뒤로
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={onGoToSignup}
                >
                  회원가입
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
