import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

/**
 * 어드민 — 팁 트랜잭션 조회 (ADR 0044 §3 + ADR 0046 외부송금 가드 모니터링).
 *
 * 큰 팁(300 물감 이상) 은 정상 흐름의 강한 신호.
 * 매칭 후 평균 팁 급감 = 외부 송금 유도 의심 — 패턴 모니터링용.
 */
interface TipItem {
  id: number;
  fromUserId: string;
  toUserId: string;
  amountPoints: number;
  matchmakerCredited: number;
  platformFee: number;
  reason: string;
  createdAt: string;
}

interface TipResponse {
  totalCount: number;
  totalAmountPoints: number;
  totalMatchmakerCredited: number;
  totalPlatformFee: number;
  tips: TipItem[];
}

interface Props { onBack: () => void; }

export function AdminTipsScreen({ onBack }: Props) {
  const [filterUserId, setFilterUserId] = useState("");
  const [data, setData] = useState<TipResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const qs = filterUserId.trim() ? `?userId=${encodeURIComponent(filterUserId.trim())}` : "";
      const res = await adminApi.get<TipResponse>(`/api/v1/admin/tips${qs}`);
      setData(res);
    } catch (e: unknown) { setError((e as Error).message || "조회 실패"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filterUserId]);

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
            <h1 className="text-lg font-bold text-foreground">팁 트랜잭션 모니터링</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        {/* 요약 카드 */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="총 건수" value={data.totalCount.toLocaleString()} />
            <SummaryCard label="총 송금" value={`${data.totalAmountPoints.toLocaleString()} 물감`} />
            <SummaryCard label="주선자 수령 (90%)" value={`${data.totalMatchmakerCredited.toLocaleString()} 물감`} />
            <SummaryCard label="플랫폼 수수료 (10%)" value={`${data.totalPlatformFee.toLocaleString()} 물감`} />
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            placeholder="사용자 ID 필터 — from/to 어디든 매치 (UUID)"
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-mono w-96"
          />
          <button onClick={load} className="ml-auto px-3 py-2 rounded-xl border border-border text-xs hover:bg-muted/50">새로고침</button>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : !data || data.tips.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">팁 트랜잭션 없음</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">일시</th>
                  <th className="text-left px-3 py-2 font-semibold">송금자 (from)</th>
                  <th className="text-left px-3 py-2 font-semibold">수령자 (to)</th>
                  <th className="text-right px-3 py-2 font-semibold">총 금액</th>
                  <th className="text-right px-3 py-2 font-semibold">주선자 수령</th>
                  <th className="text-right px-3 py-2 font-semibold">수수료</th>
                  <th className="text-left px-3 py-2 font-semibold">사유</th>
                </tr>
              </thead>
              <tbody>
                {data.tips.map(t => {
                  const isLarge = t.amountPoints >= 300;
                  return (
                    <tr key={t.id} className={`border-t border-border ${isLarge ? "bg-amber-50/60" : ""}`}>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(t.createdAt)}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{t.fromUserId.slice(0, 8)}…</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{t.toUserId.slice(0, 8)}…</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-bold ${isLarge ? "text-amber-800" : "text-foreground"}`}>
                        {t.amountPoints.toLocaleString()} 물감
                        {isLarge && <span className="ml-1 text-[10px] font-bold text-amber-700">★</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-green-700">+{t.matchmakerCredited.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-blue-700">+{t.platformFee.toLocaleString()}</td>
                      <td className="px-3 py-2 text-foreground/70 max-w-[280px] truncate" title={t.reason}>{t.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <div className="rounded-xl bg-muted/30 border border-border p-3 text-[11px] text-muted-foreground leading-relaxed">
          <strong>외부 송금 모니터링 가이드 (ADR 0046)</strong> · 큰 팁(★ 300 물감↑) 은 정상 흐름의 강한 신호.
          매칭 성사 후 평균 팁이 갑작스레 줄어들거나 매칭 N건 대비 팁 0건이면 외부 송금 유도 의심 →
          신고 큐에 EXTERNAL_PAYMENT_INDUCEMENT 카테고리로 들어와 있는지 교차 확인.
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
