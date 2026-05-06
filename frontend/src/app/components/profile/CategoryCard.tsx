/**
 * CategoryCard — 프로필 카테고리 카드
 *
 * P2의 Card(elevated) + SectionHeader + InfoRow로 구성.
 *
 * <CategoryCard
 *   group={PROFILE_GROUPS[0]}
 *   values={toProfileValues(profile)}
 *   mode="view"
 * />
 * <CategoryCard
 *   group={PROFILE_GROUPS[1]}
 *   values={toProfileValues(profile)}
 *   mode="edit"
 *   onEditField={(fieldKey) => openSheet(fieldKey)}
 * />
 */
import { useState } from "react";
import {
  UserRound, GraduationCap, Sparkles, MapPin,
  Pencil, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "../ui/utils";
import { SectionHeader } from "../ui/section-header";
import { InfoRow } from "./InfoRow";
import { FIELD_META, formatFieldValue, type ProfileGroup, type ProfileValues } from "../../../lib/profileSchema";

// ── 아이콘 맵 ─────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  UserRound:    <UserRound className="w-4 h-4" />,
  GraduationCap:<GraduationCap className="w-4 h-4" />,
  Sparkles:     <Sparkles className="w-4 h-4" />,
  MapPin:       <MapPin className="w-4 h-4" />,
};

interface CategoryCardProps {
  group: ProfileGroup;
  values: ProfileValues;
  mode?: "view" | "edit";
  onEditField?: (fieldKey: string) => void;
  onEditAll?: () => void;
  /** true이면 SectionHeader를 클릭해 접기/펼치기 가능 */
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function CategoryCard({
  group,
  values,
  mode = "view",
  onEditField,
  onEditAll,
  collapsible = false,
  defaultOpen = true,
  className,
}: CategoryCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const icon = ICON_MAP[group.icon] ?? <UserRound className="w-4 h-4" />;

  // 편집 모드 CTA — 헤더 우측 연필 아이콘
  const editAction = (mode === "view" && onEditAll) ? (
    <button
      onClick={onEditAll}
      className="p-1.5 rounded-lg hover:bg-surface-sunken transition-colors -mr-1"
      aria-label="편집"
    >
      <Pencil className="w-3.5 h-3.5 text-text-tertiary" />
    </button>
  ) : collapsible ? (
    <button
      /* stopPropagation: parent div도 onClick을 가지므로 버블 방지 */
      onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      className="p-1.5 rounded-lg hover:bg-surface-sunken transition-colors -mr-1"
      aria-label={open ? "접기" : "펼치기"}
    >
      {open
        ? <ChevronUp className="w-4 h-4 text-text-tertiary" />
        : <ChevronDown className="w-4 h-4 text-text-tertiary" />
      }
    </button>
  ) : null;

  // 채워진 필드 수 (완료 뱃지용)
  const filled = group.fields.filter((f) => {
    const raw = values[f as keyof typeof values];
    return raw !== null && raw !== undefined && raw !== "";
  }).length;
  const total = group.fields.length;

  const completionBadge = mode === "edit" && (
    <span className={cn(
      "text-caption px-1.5 py-px rounded-md font-medium",
      filled === total
        ? "bg-state-success/10 text-state-success"
        : "bg-surface-sunken text-text-tertiary",
    )}>
      {filled === total ? "완료" : `${filled}/${total}`}
    </span>
  );

  return (
    <div className={cn("bg-surface-elevated border border-border-subtle rounded-lg overflow-hidden shadow-sm", className)}>
      {/* 헤더 */}
      <div
        className={cn(
          "px-4 pt-4 pb-3",
          collapsible && "cursor-pointer select-none",
        )}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">{icon}</span>
            <SectionHeader title={group.title} className="mb-0" />
            {completionBadge}
          </div>
          {editAction}
        </div>
      </div>

      {/* 행 목록 */}
      {open && (
        <div className="divide-y divide-border-subtle border-t border-border-subtle">
          {group.fields.map((fieldKey) => {
            const meta = FIELD_META[fieldKey];
            if (!meta) return null;
            const raw = values[fieldKey as keyof typeof values];
            const displayValue = raw != null && raw !== "" ? formatFieldValue(fieldKey, raw) : null;

            return (
              <InfoRow
                key={fieldKey}
                label={meta.label}
                value={displayValue}
                empty={!displayValue}
                onPress={mode === "edit" && onEditField ? () => onEditField(fieldKey) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
