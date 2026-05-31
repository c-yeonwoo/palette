import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../lib/adminApi";

interface UserSummary {
  userId: string;
  email: string | null;
  nickname: string;
  realName: string;
  gender: string;
  age: number;
  phoneNumber: string | null;
  accountType: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "DORMANT";
  isProfileCompleted: boolean;
  createdAt: string;
  lastLoginAt: string;
}

interface PageResponse {
  items: UserSummary[];
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
}

interface Props {
  onBack: () => void;
  onSelectUser: (userId: string) => void;
}

const STATUS_BADGE: Record<UserSummary["status"], { label: string; cls: string }> = {
  ACTIVE: { label: "활성", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  SUSPENDED: { label: "차단", cls: "bg-red-100 text-red-700 border-red-200" },
  DORMANT: { label: "휴면", cls: "bg-amber-100 text-amber-700 border-amber-200" },
};

export function AdminUsersScreen({ onBack, onSelectUser }: Props) {
  const [data, setData] = useState<PageResponse | null>(null);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserSummary["status"]>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        size: String(size),
        status: statusFilter,
        sort: "createdAt:desc",
      });
      if (q) qs.set("q", q);
      const res = await adminApi.get<PageResponse>(`/api/v1/admin/users?${qs.toString()}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }, [page, size, q, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setQ(qInput.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
              ← 대시보드
            </button>
            <h1 className="text-lg font-bold text-foreground">회원 관리</h1>
          </div>
          {data && (
            <span className="text-sm text-muted-foreground tabular-nums">
              총 {data.totalCount.toLocaleString()}명
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* 필터 + 검색 */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <form onSubmit={submitSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="이메일·닉네임·실명·휴대폰 검색"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              검색
            </button>
          </form>

          <div className="flex gap-1.5">
            {(["ALL", "ACTIVE", "SUSPENDED", "DORMANT"] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(0);
                }}
                className={`h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {s === "ALL" ? "전체" : STATUS_BADGE[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* 테이블 */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading && <div className="p-8 text-center text-sm text-muted-foreground">불러오는 중...</div>}
          {error && <div className="p-8 text-center text-sm text-destructive">{error}</div>}
          {!loading && !error && data && data.items.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">조건에 맞는 회원이 없습니다.</div>
          )}
          {!loading && !error && data && data.items.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-medium">닉네임</th>
                  <th className="px-4 py-3 font-medium">이메일</th>
                  <th className="px-4 py-3 font-medium">성별 / 나이</th>
                  <th className="px-4 py-3 font-medium">계정</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((u) => (
                  <tr
                    key={u.userId}
                    onClick={() => onSelectUser(u.userId)}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{u.nickname}</div>
                      <div className="text-xs text-muted-foreground">{u.realName}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {u.gender === "MALE" ? "남" : u.gender === "FEMALE" ? "여" : "?"} · {u.age}세
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{u.accountType}</span>
                      {u.role === "ADMIN" && (
                        <span className="ml-1.5 inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-foreground text-background font-medium">
                          ADMIN
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
                          STATUS_BADGE[u.status].cls
                        }`}
                      >
                        {STATUS_BADGE[u.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                      {u.createdAt.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이징 */}
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {data.page * data.size + 1}–{Math.min((data.page + 1) * data.size, data.totalCount)} / {data.totalCount}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.page === 0}
                className="h-9 px-3 rounded-lg border border-border bg-card disabled:opacity-30"
              >
                이전
              </button>
              <span className="h-9 px-3 inline-flex items-center text-muted-foreground tabular-nums">
                {data.page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                disabled={data.page >= data.totalPages - 1}
                className="h-9 px-3 rounded-lg border border-border bg-card disabled:opacity-30"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
