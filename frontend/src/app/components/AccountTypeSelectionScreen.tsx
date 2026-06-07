import { useState } from "react";
import { Button } from "./ui/button";
import { Heart, Users, ArrowLeft, Check } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface AccountTypeSelectionScreenProps {
  onComplete: (accountType: "REGULAR" | "MATCHMAKER_ONLY") => void;
  onBack?: () => void;
  /** pre-auth: 이메일 회원가입 전 선택 (API 호출 없음). post-auth(기본): OAuth 후 선택 (API 호출). */
  mode?: "pre-auth" | "post-auth";
}

export function AccountTypeSelectionScreen({ onComplete, onBack, mode = "post-auth" }: AccountTypeSelectionScreenProps) {
  const [selectedType, setSelectedType] = useState<"REGULAR" | "MATCHMAKER_ONLY" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      toast.error("계정 유형을 선택해주세요");
      return;
    }

    // pre-auth: API 호출 없이 바로 onComplete (이메일 회원가입 후에 호출됨)
    if (mode === "pre-auth") {
      onComplete(selectedType);
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* 뒤로가기 (pre-auth에서만) */}
      {onBack && (
        <div className="px-4 pt-safe-top pt-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className="flex-1 flex flex-col px-5 pb-6">
        <div className="w-full max-w-2xl mx-auto space-y-5 flex-1 flex flex-col justify-center">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-bold">팔레트에 오신 것을 환영해요</h1>
            <p className="text-sm text-muted-foreground">어떻게 이용하시겠어요?</p>
          </div>

          {/* Account Type Cards — button 으로 명시(클릭 영역 확실) + 컴팩트 */}
          <div className="space-y-3">
            <AccountTypeCard
              active={selectedType === "REGULAR"}
              icon={<Heart className="w-5 h-5 text-primary" />}
              title="일반 회원"
              desc="소중한 인연을 찾고 싶어요"
              bullets={["지인의 지인과 신뢰 있는 매칭", "프로필 작성 · 매칭 요청"]}
              onClick={() => setSelectedType("REGULAR")}
            />
            <AccountTypeCard
              active={selectedType === "MATCHMAKER_ONLY"}
              icon={<Users className="w-5 h-5 text-primary" />}
              title="주선자 전용"
              desc="지인들을 연결해주고 싶어요"
              bullets={["지인 관리 · 매칭 주선·승인", "리워드 적립, 매칭 대상 제외"]}
              onClick={() => setSelectedType("MATCHMAKER_ONLY")}
            />
          </div>

          {/* Submit Button + Note (한 화면 fit) */}
          <div className="space-y-2">
            <Button
              onClick={handleSubmit}
              disabled={!selectedType || isSubmitting}
              className="w-full h-12 text-base"
            >
              {isSubmitting ? "설정 중..." : "다음"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              계정 유형은 나중에 설정에서 변경할 수 있어요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountTypeCard({
  active,
  icon,
  title,
  desc,
  bullets,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  bullets: string[];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full text-left rounded-2xl bg-card p-4 transition-all ${
        active
          ? "border-2 border-primary ring-2 ring-primary/20 shadow-card"
          : "border border-border shadow-card hover:border-primary/40 active:scale-[0.99]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-bold text-foreground">{title}</p>
            {active && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
          <ul className="mt-2 space-y-1">
            {bullets.map((b, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary/70 mt-0.5">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </button>
  );
}
