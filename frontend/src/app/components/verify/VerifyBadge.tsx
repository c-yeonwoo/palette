/**
 * VerifyBadge — F04 본인인증 뱃지
 * 프로필 이름 옆, 매칭 카드 등에 사용
 */
import { ShieldCheck } from "lucide-react";
import { cn } from "../ui/utils";

interface VerifyBadgeProps {
  size?: "sm" | "md";
  className?: string;
  /** false이면 렌더 자체를 건너뜀 */
  verified?: boolean;
}

export function VerifyBadge({ size = "sm", verified = true, className }: VerifyBadgeProps) {
  if (!verified) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium text-state-success",
        size === "sm" ? "text-caption gap-0.5" : "text-body-sm gap-1",
        className,
      )}
      aria-label="본인인증 완료"
      title="본인인증 완료"
    >
      <ShieldCheck
        className={size === "sm" ? "w-3 h-3" : "w-4 h-4"}
        aria-hidden
      />
      {size === "md" && <span>본인인증</span>}
    </span>
  );
}
