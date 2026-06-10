import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

/**
 * 어드민 — 신고 큐 검토 (ADR 0023/0046).
 *
 * PENDING / REVIEWED 탭. 카테고리별 뱃지 표시.
 * EXTERNAL_PAYMENT_INDUCEMENT 는 ADR 0046 외부 송금 가드 신고 — 별색 강조.
 */
interface ReportItem {
  id: string;
  reporterUserId: string;
  reportedUserId: string;
  reason: string;
  detail: string | null;
  status: "PENDING" | "REVIEWED";
  createdAt: string;
}

const REASON_LABEL: Record<string, string> = {
  FAKE_PROFILE: "허위 프로필",
  HARASSMENT: "괴롭힘·성희롱",
  SPAM: "도배·스팸",
  MINOR: "미성년자",
  EXTERNAL_PAYMENT_INDUCEMENT: "외부 송금 유도 (§6)",
  OTHER: "기타",
};

interface Props {
  onBack: () => void;
}

export function AdminReportsScreen({ onBack }: Props) {
  const [tab, setTab] = useState<"PENDING" | "REVIEWED">("PENDING");
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [items, setItems] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ status: tab });
      if (reasonFilter) qs.set("reason", reasonFilter);
      const res = await adminApi.get<ReportItem[]>(`/api/v1/admin/reports?${qs.toString()}`);
      setItems(res);
    } catch (e: unknown) { setError((e as Error).message || "조회 실패"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab, reasonFilter]);

  /**
   * 처리.
   * @param confirmReward true → 위반 확정. EXTERNAL_PAYMENT_INDUCEMENT 카테고리면
   *                       신고자에게 50 물감 자동 보상 (ADR 0046 §E).
   */
  const review = async (id: string, confirmReward: boolean) => {
    setBusyId(id);
    try {
      const res = await adminApi.patch<{ rewardedPoints?: number }>(`/api/v1/admin/reports/${id}/review?confirmReward=${confirmReward}`);
      if (confirmReward && (res?.rewardedPoints ?? 0) > 0) {
        alert(`처리 완료 · 신고자에게 ${res.rewardedPoints} 물감 보상 지급됨`);
      }
      await load();
    } catch (e: unknown) {
      alert((e as Error).message || "처리 실패");
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
            <h1 className="text-lg font-bold text-foreground">신고 큐</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {(["PENDING", "REVIEWED"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === t ? "bg-foreground text-background" : "bg-card border border-border text-foreground hover:bg-muted/50"
              }`}
            >
              {t === "PENDING" ? "처리 대기" : "처리 완료"}
            </button>
          ))}

          <div className="h-6 w-px bg-border mx-1" aria-hidden />

          {/* 카테고리 필터 — ADR 0046 §6 외부송금 빠른 처리 진입 */}
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">모든 카테고리</option>
            {Object.entries(REASON_LABEL).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => setReasonFilter("EXTERNAL_PAYMENT_INDUCEMENT")}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              reasonFilter === "EXTERNAL_PAYMENT_INDUCEMENT"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100"
            }`}
            title="§6 외부 송금 유도 신고만 빠르게 보기"
          >
            §6 외부송금
          </button>

          <button onClick={load} className="ml-auto px-3 py-2 rounded-xl border border-border text-xs hover:bg-muted/50">새로고침</button>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}

        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">{tab === "PENDING" ? "대기 중인 신고가 없어요" : "처리된 신고가 없어요"}</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">접수</th>
                  <th className="text-left px-3 py-2 font-semibold">사유</th>
                  <th className="text-left px-3 py-2 font-semibold">신고자</th>
                  <th className="text-left px-3 py-2 font-semibold">대상</th>
                  <th className="text-left px-3 py-2 font-semibold">상세</th>
                  {tab === "PENDING" && <th className="text-right px-3 py-2 font-semibold">액션</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(r.createdAt)}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.reason === "EXTERNAL_PAYMENT_INDUCEMENT"
                          ? "bg-rose-100 text-rose-800"
                          : r.reason === "MINOR"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {REASON_LABEL[r.reason] ?? r.reason}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{r.reporterUserId.slice(0, 8)}…</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{r.reportedUserId.slice(0, 8)}…</td>
                    <td className="px-3 py-2 text-foreground/80 max-w-[360px] truncate" title={r.detail ?? ""}>
                      {r.detail || <span className="text-muted-foreground/60">—</span>}
                    </td>
                    {tab === "PENDING" && (
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => review(r.id, false)}
                            disabled={busyId === r.id}
                            className="px-2.5 py-1 rounded-lg border border-border text-xs font-semibold hover:bg-muted/50 disabled:opacity-50"
                            title="단순 종결 — 위반 미확정 · 보상 X"
                          >
                            기각
                          </button>
                          <button
                            onClick={() => review(r.id, true)}
                            disabled={busyId === r.id}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50 ${
                              r.reason === "EXTERNAL_PAYMENT_INDUCEMENT"
                                ? "bg-rose-600 text-white hover:bg-rose-700"
                                : "bg-foreground text-background"
                            }`}
                            title={r.reason === "EXTERNAL_PAYMENT_INDUCEMENT" ? "확정 시 신고자에게 50 물감 자동 보상 (ADR 0046 §E)" : "위반 확정 처리"}
                          >
                            {busyId === r.id ? "처리 중..." : r.reason === "EXTERNAL_PAYMENT_INDUCEMENT" ? "확정 + 보상" : "확정"}
                          </button>
                        </div>
                      </td>
                    )}
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
