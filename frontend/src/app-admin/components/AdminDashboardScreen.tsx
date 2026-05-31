import type { AdminInfo } from "../lib/adminAuth";
import { adminAuth } from "../lib/adminAuth";

interface Props {
  admin: AdminInfo;
  onNavigate: (to: string) => void;
}

export function AdminDashboardScreen({ admin, onNavigate }: Props) {
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
          <p className="text-sm text-muted-foreground mt-1">관리 화면은 단계적으로 추가됩니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate("/admin/users")}
            className="text-left rounded-2xl border border-border bg-card p-5 hover:border-foreground/40 transition-colors"
          >
            <p className="text-sm text-muted-foreground">회원 관리</p>
            <p className="text-2xl font-bold mt-2 text-foreground">→</p>
            <p className="text-xs text-muted-foreground mt-3">목록·검색·차단·휴면</p>
          </button>

          <div className="rounded-2xl border border-border bg-card p-5 opacity-50">
            <p className="text-sm text-muted-foreground">매칭 관리</p>
            <p className="text-2xl font-bold mt-2 text-foreground">—</p>
            <p className="text-xs text-muted-foreground mt-3">PR 예정</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 opacity-50">
            <p className="text-sm text-muted-foreground">CS 인입</p>
            <p className="text-2xl font-bold mt-2 text-foreground">—</p>
            <p className="text-xs text-muted-foreground mt-3">PR 예정</p>
          </div>
        </div>
      </main>
    </div>
  );
}
