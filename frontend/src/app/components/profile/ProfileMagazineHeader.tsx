import { ChevronLeft } from "lucide-react";
import { Button } from "../ui/button";

interface ProfileMagazineHeaderProps {
  title: string;
  onBack: () => void;
  accentColor?: string | null;
  rightSlot?: React.ReactNode;
}

/** 발견 잡지형 프로필 — 상단 sticky 헤더 (남/내 프로필 공통) */
export function ProfileMagazineHeader({
  title,
  onBack,
  accentColor,
  rightSlot,
}: ProfileMagazineHeaderProps) {
  return (
    <div
      className="sticky top-0 z-20 backdrop-blur-md"
      style={accentColor
        ? { backgroundColor: "transparent", borderBottom: "none" }
        : { backgroundColor: "hsl(var(--card) / 0.85)", borderBottom: "1px solid hsl(var(--border) / 0.5)" }
      }
    >
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-1 flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-base font-semibold truncate">{title}</h2>
        </div>
        {rightSlot && (
          <div className="flex items-center gap-1 flex-shrink-0">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}
