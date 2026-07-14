/**
 * P1-008 — 신뢰 뱃지 v1 (전화·NICE·보증·trust tier)
 */
import { Phone, ShieldCheck, Users } from "lucide-react";
import { cn } from "../ui/utils";

interface TrustBadgeRowProps {
  phoneVerified?: boolean;
  niceVerified?: boolean;
  vouchCount?: number;
  trustScore?: number | null;
  className?: string;
}

function tierLabel(score: number): { label: string; tone: string } {
  if (score >= 71) return { label: "Gold", tone: "bg-amber-100 text-amber-900" };
  if (score >= 41) return { label: "Silver", tone: "bg-slate-100 text-slate-700" };
  return { label: "Bronze", tone: "bg-orange-50 text-orange-800" };
}

export function TrustBadgeRow({
  phoneVerified,
  niceVerified,
  vouchCount = 0,
  trustScore,
  className,
}: TrustBadgeRowProps) {
  const tier = trustScore != null ? tierLabel(trustScore) : null;
  const items = [
    phoneVerified && { key: "phone", icon: Phone, label: "전화 인증" },
    niceVerified && { key: "nice", icon: ShieldCheck, label: "본인 인증" },
    vouchCount > 0 && { key: "vouch", icon: Users, label: `보증 ${vouchCount}명` },
    tier && { key: "tier", label: `신뢰 ${tier.label}` },
  ].filter(Boolean) as { key: string; icon?: typeof Phone; label: string }[];

  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {items.map((item) => (
        <span
          key={item.key}
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
            item.key === "tier" && tier ? tier.tone : "bg-muted text-muted-foreground",
          )}
        >
          {item.icon && <item.icon className="w-3 h-3" />}
          {item.label}
        </span>
      ))}
    </div>
  );
}
