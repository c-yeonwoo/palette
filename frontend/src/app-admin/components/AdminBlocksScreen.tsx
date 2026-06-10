import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

/**
 * 어드민 — 유저간 차단 관계 조회·해제 (ADR 0023).
 * 운영 응대: 사용자가 실수로 차단한 경우 또는 오신고 후 차단 해제.
 */
interface BlockItem {
  id: string;
  blockerUserId: string;
  blockedUserId: string;
  createdAt: string;
}

interface Props { onBack: () => void; }

export function AdminBlocksScreen({ onBack }: Props) {
  const [filterUserId, setFilterUserId] = useState("");
  const [items, setItems] = useState<BlockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const qs = filterUserId.trim() ? `?blockerUserId=${encodeURIComponent(filterUserId.trim())}` : "";
      const res = await adminApi.get<BlockItem[]>(`/api/v1/admin/blocks${qs}`);
      setItems(res);
    } catch (e: unknown) { setError((e as Error).message || "조회 실패"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filterUserId]);

  const unblock = async (id: string) => {
    if (!confirm("이 차단 관계를 해제할까요?")) return;
    setBusyId(id);
    try {
      await adminApi.delete(`/api/v1/admin/blocks/${id}`);
      await load();
    } catch (e: unknown) {
      alert((e as Error).message || "해제 실패");
    } finally { setBusyId(null); }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground">팔레트 운영자</p>
            <h1 className="text-lg font-bold text-foreground">차단 관계 관리</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            placeholder="blocker 사용자 ID 필터 (UUID, 비우면 전체 최근 200건)"
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-mono w-96"
          />
          <button onClick={load} className="ml-auto px-3 py-2 rounded-xl border border-border text-xs hover:bg-muted/50">새로고침</button>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">차단 관계 없음</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">차단 일시</th>
                  <th className="text-left px-3 py-2 font-semibold">차단자 (blocker)</th>
                  <th className="text-left px-3 py-2 font-semibold">피차단자 (blocked)</th>
                  <th className="text-right px-3 py-2 font-semibold">액션</th>
                </tr>
              </thead>
              <tbody>
                {items.map(b => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(b.createdAt)}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{b.blockerUserId.slice(0, 12)}…</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{b.blockedUserId.slice(0, 12)}…</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => unblock(b.id)}
                        disabled={busyId === b.id}
                        className="px-3 py-1 rounded-lg border border-border text-xs hover:bg-muted/50 disabled:opacity-50"
                      >
                        {busyId === b.id ? "처리 중..." : "강제 해제"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}
