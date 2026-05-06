/**
 * InfoRow — 프로필 필드 1행
 *
 * <InfoRow label="흡연" value="비흡연" />
 * <InfoRow label="키" empty onPress={...} />   → "추가하기 +"
 */
import { cn } from "../ui/utils";

interface InfoRowProps {
  label: string;
  value?: string | null;
  empty?: boolean;
  onPress?: () => void;
  className?: string;
}

export function InfoRow({ label, value, empty, onPress, className }: InfoRowProps) {
  const isEmpty = empty || !value;
  const Comp = onPress ? "button" : "div";

  return (
    <Comp
      onClick={onPress}
      className={cn(
        "w-full flex items-center justify-between min-h-12 px-4 text-left transition-colors",
        onPress && "active:bg-surface-sunken cursor-pointer",
        className,
      )}
    >
      <span className="text-body-sm text-text-secondary">{label}</span>
      {isEmpty ? (
        onPress ? (
          <span className="text-body-sm text-primary font-medium">추가하기 +</span>
        ) : (
          <span className="text-body-sm text-text-tertiary">—</span>
        )
      ) : (
        <span className="text-body-sm font-medium text-text-primary">{value}</span>
      )}
    </Comp>
  );
}
