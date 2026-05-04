import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Heart, Users } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface AccountTypeSelectionScreenProps {
  onComplete: (accountType: "REGULAR" | "MATCHMAKER_ONLY") => void;
}

export function AccountTypeSelectionScreen({ onComplete }: AccountTypeSelectionScreenProps) {
  const [selectedType, setSelectedType] = useState<"REGULAR" | "MATCHMAKER_ONLY" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error("계정 유형을 선택해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch("/api/v1/auth/account-type", {
        accountType: selectedType,
      });

      toast.success("계정 유형이 설정되었습니다");
      onComplete(selectedType);
    } catch (error) {
      console.error("Failed to update account type:", error);
      toast.error("계정 유형 설정에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Palette에 오신 것을 환영합니다!</h1>
          <p className="text-muted-foreground">
            어떤 방식으로 서비스를 이용하시겠어요?
          </p>
        </div>

        {/* Account Type Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Regular User */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedType === "REGULAR"
                ? "border-primary ring-2 ring-primary"
                : "hover:border-primary/50"
            }`}
            onClick={() => setSelectedType("REGULAR")}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>일반 회원</CardTitle>
              <CardDescription>소중한 인연을 찾고 싶어요</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>지인의 지인과 신뢰있는 매칭</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>주선자의 검증을 거친 프로필</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>프로필 작성 및 관리</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>매칭 요청 및 메시지</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Matchmaker Only */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedType === "MATCHMAKER_ONLY"
                ? "border-accent ring-2 ring-accent"
                : "hover:border-accent/50"
            }`}
            onClick={() => setSelectedType("MATCHMAKER_ONLY")}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <CardTitle>주선자 전용</CardTitle>
              <CardDescription>지인들을 연결해주고 싶어요</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>지인들의 프로필 관리</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>매칭 주선 및 승인</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>주선 통계 및 리워드</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>매칭 대상에서 제외됩니다</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedType || isSubmitting}
          className="w-full h-12 text-lg"
        >
          {isSubmitting ? "설정 중..." : "다음"}
        </Button>

        {/* Note */}
        <p className="text-xs text-center text-muted-foreground">
          * 계정 유형은 나중에 설정에서 변경할 수 있습니다
        </p>
      </div>
    </div>
  );
}
