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
  /** Vision API 미연동 시 베타 표기 (P-002) */
  isBeta?: boolean;
}

export function VerifyBadge({ size = "sm", verified = true, isBeta = false, className }: VerifyBadgeProps) {
  if (!verified) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-medium",
        isBeta ? "text-amber-700" : "text-state-success",
        size === "sm" ? "text-caption gap-0.5" : "text-body-sm gap-1",
        className,
      )}
      aria-label={isBeta ? "본인인증 베타" : "본인인증 완료"}
      title={isBeta ? "베타 검증 — 정식 Vision 연동 예정" : "본인인증 완료"}
    >
      <ShieldCheck
        className={size === "sm" ? "w-3 h-3" : "w-4 h-4"}
        aria-hidden
      />
      {size === "md" && <span>{isBeta ? "본인인증(베타)" : "본인인증"}</span>}
    </span>
  );
}
