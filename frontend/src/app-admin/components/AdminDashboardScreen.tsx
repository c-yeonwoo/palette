import type { AdminInfo } from "../lib/adminAuth";
import { adminAuth } from "../lib/adminAuth";

interface Props {
  admin: AdminInfo;
}

export function AdminDashboardScreen({ admin }: Props) {
  const logout = () => {
    adminAuth.clear();
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground">팔레트 운영자</p>
            <h1 className="text-lg font-bold text-foreground">Admin Console</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{admin.nickname}</span>
            <button
              onClick={logout}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">대시보드</h2>
          <p className="text-sm text-muted-foreground mt-1">
            관리 화면은 단계적으로 추가됩니다 (회원 / 매칭 / CS).
          </p>
        </div>

        {/* 단계별로 채워질 KPI 카드 자리 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "전체 회원", value: "—", hint: "PR #4 — Users 화면" },
            { title: "진행 중인 매칭", value: "—", hint: "PR #5 — Matchings" },
            { title: "CS 인입", value: "—", hint: "PR #5 — CS" },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-3xl font-bold mt-2 text-foreground tabular-nums">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-3">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            이 화면은 PR #3 (인증 기반) 골격입니다. 회원/매칭/CS 관리는 PR #4-#5 에서 추가됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
