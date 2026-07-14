import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { CategoryCard } from "./CategoryCard";
import { PROFILE_GROUPS, toProfileValues } from "../../../lib/profileSchema";
import {
  DATING_STYLE_QUESTION_LABELS,
  DATING_STYLE_OPTION_LABELS,
} from "../../../lib/datingStyleLabels";

interface ProfileDetailsCollapsibleProps {
  profile: Parameters<typeof toProfileValues>[0];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** 발견 잡지형 프로필 — 접이식 기본 정보 (남/내 공통) */
export function ProfileDetailsCollapsible({
  profile,
  open,
  onOpenChange,
}: ProfileDetailsCollapsibleProps) {
  const datingStyle = profile.introduction?.datingStyle;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="w-full flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors">
        기본 정보 더 보기
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        {PROFILE_GROUPS.map((group) => (
          <CategoryCard
            key={group.key}
            group={group}
            values={toProfileValues(profile)}
            mode="view"
          />
        ))}
        {datingStyle && Object.keys(datingStyle).length > 0 && (
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">연애 스타일</p>
            <div className="space-y-2">
              {Object.entries(datingStyle).map(([qKey, optKey]) => (
                <div key={qKey} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">
                    {DATING_STYLE_QUESTION_LABELS[qKey] ?? qKey}
                  </span>
                  <span className="font-medium">
                    {DATING_STYLE_OPTION_LABELS[optKey] ?? optKey}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
