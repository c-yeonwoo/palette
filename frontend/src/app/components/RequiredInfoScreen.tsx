import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";

interface RequiredInfoScreenProps {
  missingFields: string[];
  onComplete: () => void;
}

export function RequiredInfoScreen({ missingFields, onComplete }: RequiredInfoScreenProps) {
  const [realName, setRealName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 정보 검증
    if (missingFields.includes("realName") && !realName.trim()) {
      toast.error("이름을 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch("/api/v1/auth/basic-info", {
        realName: missingFields.includes("realName") ? realName : undefined,
        email: missingFields.includes("email") ? email || undefined : undefined,
      });

      toast.success("정보가 저장되었습니다");
      onComplete();
    } catch (error) {
      console.error("Failed to update basic info:", error);
      toast.error("정보 저장에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>추가 정보 입력</CardTitle>
          <CardDescription>
            서비스 이용을 위해 필요한 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {missingFields.includes("realName") && (
              <div className="space-y-2">
                <Label htmlFor="realName">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="realName"
                  type="text"
                  placeholder="본명을 입력해주세요"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  주선자가 확인하는 정보입니다
                </p>
              </div>
            )}

            {missingFields.includes("email") && (
              <div className="space-y-2">
                <Label htmlFor="email">이메일 (선택)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  서비스 알림을 받으실 이메일 주소입니다
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "저장 중..." : "다음"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
