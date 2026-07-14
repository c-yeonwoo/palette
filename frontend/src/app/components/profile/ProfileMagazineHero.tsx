import { Camera, Plus } from "lucide-react";

interface ColorTypeLike {
  name: string | null;
  hex: string | null;
  description?: string | null;
}

interface ProfileMagazineHeroProps {
  nickname: string;
  heroSpecLine?: string | null;
  colorType?: ColorTypeLike | null;
  primaryPhotoUrl?: string | null;
  /** 사진 없을 때 (내 프로필) */
  emptyAction?: { label: string; onClick: () => void };
  /** 히어로 우하단 오버레이 (완성도 링 등) */
  trailingOverlay?: React.ReactNode;
}

/** 발견 잡지형 프로필 — 대표사진 히어로 (aspect 4/5, 남/내 공통) */
export function ProfileMagazineHero({
  nickname,
  heroSpecLine,
  colorType,
  primaryPhotoUrl,
  emptyAction,
  trailingOverlay,
}: ProfileMagazineHeroProps) {
  const accentColor = colorType?.hex ?? null;

  return (
    <div className="relative w-full aspect-[4/5] max-h-[520px] bg-muted overflow-hidden">
      {primaryPhotoUrl ? (
        <img src={primaryPhotoUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : emptyAction ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-muted via-muted/80 to-accent/20">
          <div className="w-16 h-16 rounded-full bg-card/70 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <Camera className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1 px-6">
            <p className="text-sm font-medium text-foreground/80">사진을 추가해보세요</p>
            <p className="text-xs text-muted-foreground">사진이 있으면 매칭 확률이 올라가요</p>
          </div>
          <button
            type="button"
            onClick={emptyAction.onClick}
            className="flex items-center gap-1.5 bg-brand-soft text-brand-strong text-sm font-semibold px-5 py-2.5 rounded-full shadow-md"
          >
            <Plus className="w-4 h-4" />
            {emptyAction.label}
          </button>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">사진 없음</span>
        </div>
      )}

      {primaryPhotoUrl && (
        <div
          className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.62))" }}
        >
          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              {colorType?.name && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 mb-2">
                  {accentColor && (
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                  )}
                  <span className="text-xs font-medium" style={{ color: accentColor ?? "#333" }}>
                    {colorType.name}
                  </span>
                </div>
              )}
              <h2 className="text-2xl font-bold text-white drop-shadow-sm leading-tight">{nickname}</h2>
              {heroSpecLine && (
                <p className="text-sm text-white/95 mt-1 font-medium tracking-tight">{heroSpecLine}</p>
              )}
              {colorType?.description && (
                <p className="text-sm text-white/80 mt-1.5 leading-snug line-clamp-2">
                  {colorType.description}
                </p>
              )}
            </div>
            {trailingOverlay}
          </div>
        </div>
      )}
    </div>
  );
}
