import { Badge } from "../ui/badge";
import {
  buildIdealSummaryChips,
  getDealBreakerLabel,
  type IdealTypeLike,
} from "../../../lib/profileIdealTypeLabels";

interface ProfileIdealTypeSummaryProps {
  idealType: IdealTypeLike;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

function ChipGroup({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <Badge key={index} variant="secondary">
          {item}
        </Badge>
      ))}
    </div>
  );
}

/** 발견 잡지형 프로필 — 하단 이상형 컴팩트 요약 (남/내 공통) */
export function ProfileIdealTypeSummary({ idealType }: ProfileIdealTypeSummaryProps) {
  const chips = buildIdealSummaryChips(idealType);
  const dealBreakers = (idealType.dealBreakers ?? []).map(getDealBreakerLabel);
  const hasRange = idealType.ageMin || idealType.ageMax || idealType.heightMin || idealType.heightMax;

  if (chips.length === 0 && dealBreakers.length === 0 && !hasRange) return null;

  return (
    <Section title="이런 인연을 찾아요">
      <ChipGroup items={chips} />
      {hasRange && (
        <p className="text-xs text-muted-foreground mt-2">
          {[
            (idealType.ageMin || idealType.ageMax) &&
              `나이 ${idealType.ageMin ?? "?"}~${idealType.ageMax ?? "?"}세`,
            (idealType.heightMin || idealType.heightMax) &&
              `키 ${idealType.heightMin ?? "?"}~${idealType.heightMax ?? "?"}cm`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      {dealBreakers.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1.5">
          절대 안 되는 것: {dealBreakers.join(" · ")}
        </p>
      )}
    </Section>
  );
}
