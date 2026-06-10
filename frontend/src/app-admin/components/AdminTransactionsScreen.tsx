import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

/**
 * 어드민 — 결제 트랜잭션 조회 (ADR 0044 운영 감사).
 *
 * Toss / Apple IAP / Google Play Billing / MOCK 영수증 통합.
 * Read-only — 환불 처리는 P1.
 */
interface PaymentTx {
  id: string;
  buyerUserId: string;
  targetUserId: string;
  amount: number;
  paymentMethod: string;
  provider: string;
  providerReceiptId: string;
  createdAt: string;
}

interface PageResp {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  transactions: PaymentTx[];
}

const PAGE_SIZE = 20;

interface Props {
  onBack: () => void;
}

export function AdminTransactionsScreen({ onBack }: Props) {
  const [filterUserId, setFilterUserId] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
      if (filterUserId.trim()) qs.set("buyerUserId", filterUserId.trim());
      const res = await adminApi.get<PageResp>(`/api/v1/admin/payments/transactions?${qs.toString()}`);
      setData(res);
    } catch (e: unknown) { setError((e as Error).message || "조회 실패"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, filterUserId]);

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
            <h1 className="text-lg font-bold text-foreground">결제 트랜잭션</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={filterUserId}
            onChange={(e) => { setFilterUserId(e.target.value); setPage(0); }}
            placeholder="구매자 ID 로 필터 (UUID)"
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-mono w-80"
          />
          <button onClick={load} className="ml-auto px-3 py-2 rounded-xl border border-border text-xs hover:bg-muted/50">새로고침</button>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : !data || data.transactions.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">트랜잭션 없음</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">일시</th>
                  <th className="text-left px-3 py-2 font-semibold">Tx ID</th>
                  <th className="text-left px-3 py-2 font-semibold">구매자</th>
                  <th className="text-right px-3 py-2 font-semibold">금액</th>
                  <th className="text-left px-3 py-2 font-semibold">결제 채널</th>
                  <th className="text-left px-3 py-2 font-semibold">영수증 ID</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map(tx => (
                  <tr key={tx.id} className="border-t border-border">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(tx.createdAt)}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{tx.id.slice(0, 12)}…</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{tx.buyerUserId.slice(0, 8)}…</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-foreground">{tx.amount.toLocaleString()}원</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.provider === "TOSS" ? "bg-blue-100 text-blue-800"
                        : tx.provider === "APPLE_IAP" ? "bg-gray-100 text-gray-800"
                        : tx.provider === "GOOGLE_PLAY" ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                      }`}>
                        {tx.provider}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground max-w-[200px] truncate" title={tx.providerReceiptId}>
                      {tx.providerReceiptId.slice(0, 18)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {data && data.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">총 {data.totalElements.toLocaleString()}건 · {page + 1} / {data.totalPages} 페이지</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page <= 0} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40">이전</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages - 1} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40">다음</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
