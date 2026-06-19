import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

/**
 * 어드민 — 출금 HOLD 검토 (ADR 0023). holding 기간 중 의심 거래 거절 (예약 해제).
 */
interface WithdrawalItem {
  id: string;
  matchmakerUserId: string;
  amount: number;
  requestedAt: string;
  availableAt: string;
}

interface Props {
  onBack: () => void;
}

export function AdminWithdrawalsScreen({ onBack }: Props) {
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.get<WithdrawalItem[]>(`/api/v1/admin/withdrawals/pending`);
      setItems(res);
    } catch (e: unknown) { setError((e as Error).message || "조회 실패"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const reject = async (id: string) => {
    const reason = prompt("거절 사유 (선택, 200자 이내)");
    if (reason === null) return; // 사용자 취소
    setBusyId(id);
    try {
      await adminApi.patch(`/api/v1/admin/withdrawals/${id}/reject`, { reason: reason || null });
      await load();
    } catch (e: unknown) {
      alert((e as Error).message || "거절 실패");
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
            <h1 className="text-lg font-bold text-foreground">출금 HOLD 검토</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ 무현금 주선 모델 전환으로 <strong>신규 출금은 비활성</strong>입니다 (ADR 0064). 아래는 전환 이전의 잔여 내역이며, 조회·정리 용도로만 유지됩니다.
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">holding 기간 중 의심 거래는 거절(예약 해제). 정상 건은 자동 PAID 전환.</p>
          <button onClick={load} className="px-3 py-2 rounded-xl border border-border text-xs hover:bg-muted/50">새로고침</button>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">HOLD 중인 출금 요청이 없어요</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">요청 일시</th>
                  <th className="text-left px-3 py-2 font-semibold">지급 예정</th>
                  <th className="text-left px-3 py-2 font-semibold">주선자</th>
                  <th className="text-right px-3 py-2 font-semibold">금액</th>
                  <th className="text-right px-3 py-2 font-semibold">액션</th>
                </tr>
              </thead>
              <tbody>
                {items.map(w => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(w.requestedAt)}</td>
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(w.availableAt)}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{w.matchmakerUserId.slice(0, 8)}…</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-foreground">{w.amount.toLocaleString()} 물감</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => reject(w.id)}
                        disabled={busyId === w.id}
                        className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {busyId === w.id ? "처리 중..." : "거절"}
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
