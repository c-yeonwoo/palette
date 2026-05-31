import { useState } from "react";
import { AdminRecommendationsScreen } from "./AdminRecommendationsScreen";

type Tab = "ai" | "pool";

interface Props {
  onBack: () => void;
}

/**
 * 매칭 관리 — 2-tab 구조.
 * - ai: AI 시그널 추천 이력 + 운영자 override (REPLACE/BLOCK)
 * - pool: 주선자 매칭 풀 (PR #9 예정, 현재는 placeholder)
 */
export function AdminMatchingScreen({ onBack }: Props) {
  const [tab, setTab] = useState<Tab>("ai");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
                ← 대시보드
              </button>
              <h1 className="text-lg font-bold text-foreground">매칭 관리</h1>
            </div>
          </div>
          {/* 탭 */}
          <div className="flex gap-1">
            <TabButton active={tab === "ai"} onClick={() => setTab("ai")}>
              AI 매칭
            </TabButton>
            <TabButton active={tab === "pool"} onClick={() => setTab("pool")}>
              주선자 매칭 풀
            </TabButton>
          </div>
        </div>
      </header>

      {tab === "ai" && <AdminRecommendationsScreen onBack={onBack} embedded />}

      {tab === "pool" && (
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
            <p className="text-sm font-medium text-foreground">주선자 매칭 풀</p>
            <p className="text-xs text-muted-foreground mt-2">
              MatchmakingRequest 전체 조회 + 운영자 강제 변경 — 다음 PR 에서 추가됩니다.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
