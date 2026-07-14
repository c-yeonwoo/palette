interface ProfileMagazineShellProps {
  accentColor?: string | null;
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
}

/** 발견 잡지형 프로필 — 배경 그라디언트 + max-width 셸 */
export function ProfileMagazineShell({ accentColor, children, bottomBar }: ProfileMagazineShellProps) {
  return (
    <div
      className="min-h-screen pb-24"
      style={accentColor
        ? {
            backgroundColor: "#ffffff",
            backgroundImage: `linear-gradient(180deg, ${accentColor}26 0%, ${accentColor}12 300px, ${accentColor}0A 100%)`,
          }
        : { backgroundColor: "var(--background)" }
      }
    >
      <div className="max-w-2xl mx-auto">
        {children}
      </div>
      {bottomBar}
    </div>
  );
}
