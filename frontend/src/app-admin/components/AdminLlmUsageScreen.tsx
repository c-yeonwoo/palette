import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

/**
 * 어드민 — LLM 사용 가시화 (ADR 0047).
 *
 * 상단 요약 카드 (오늘/7일/누적) + 캐시 통계 + 최근 호출 이력.
 */
interface Bucket {
  total: number;
  ok: number;
  cached: number;
  failed: number;
  rateLimited: number;
  cacheHitRatePercent: string;
  totalCostWon: number;
  avgLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

interface Summary {
  today: Bucket;
  last7d: Bucket;
  total: Bucket;
  cache: { entries: number; totalHits: number; estimatedSavedWon: number };
  generatedAt: string;
}

interface LlmCall {
  id: string;
  userId: string;
  purpose: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costWon: number;
  outcome: "OK" | "CACHED" | "FAILED" | "RATE_LIMITED";
  latencyMs: number;
  error: string | null;
  inputHash: string | null;
  createdAt: string;
}

interface CallsResp {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  calls: LlmCall[];
}

interface Props { onBack: () => void; }

export function AdminLlmUsageScreen({ onBack }: Props) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [calls, setCalls] = useState<CallsResp | null>(null);
  const [outcome, setOutcome] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try { setSummary(await adminApi.get<Summary>("/api/v1/admin/llm/summary")); }
    catch (e: unknown) { setError((e as Error).message); }
  };
  const loadCalls = async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ page: String(page), size: "50" });
      if (outcome) qs.set("outcome", outcome);
      if (userId.trim()) qs.set("userId", userId.trim());
      setCalls(await adminApi.get<CallsResp>(`/api/v1/admin/llm/calls?${qs.toString()}`));
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { loadCalls(); /* eslint-disable-next-line */ }, [page, outcome, userId]);

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
            <h1 className="text-lg font-bold text-foreground">LLM 사용 가시화</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* 요약 — 오늘 / 7일 / 누적 */}
        {summary && (
          <section className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <BucketCard title="오늘" bucket={summary.today} />
              <BucketCard title="최근 7일" bucket={summary.last7d} />
              <BucketCard title="누적" bucket={summary.total} />
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between text-xs">
              <div className="text-amber-900">
                <strong>캐시 효과</strong> · 항목 {summary.cache.entries.toLocaleString()}개 ·
                hit {summary.cache.totalHits.toLocaleString()}회
              </div>
              <div className="text-amber-900 tabular-nums font-bold">
                추정 절감 {summary.cache.estimatedSavedWon.toLocaleString()}원
              </div>
            </div>
          </section>
        )}

        {/* 필터 */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={outcome}
            onChange={(e) => { setOutcome(e.target.value); setPage(0); }}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm"
          >
            <option value="">전체 outcome</option>
            <option value="OK">OK</option>
            <option value="CACHED">CACHED</option>
            <option value="FAILED">FAILED</option>
            <option value="RATE_LIMITED">RATE_LIMITED</option>
          </select>
          <input
            type="text"
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setPage(0); }}
            placeholder="사용자 ID 필터"
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono w-72"
          />
          <button onClick={loadCalls} className="ml-auto px-3 py-2 rounded-xl border border-border text-xs hover:bg-muted/50">새로고침</button>
        </div>

        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</div>}

        {/* 호출 이력 */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : !calls || calls.calls.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">호출 이력 없음</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">일시</th>
                  <th className="text-left px-3 py-2 font-semibold">User</th>
                  <th className="text-left px-3 py-2 font-semibold">Purpose</th>
                  <th className="text-left px-3 py-2 font-semibold">Outcome</th>
                  <th className="text-right px-3 py-2 font-semibold">In/Out</th>
                  <th className="text-right px-3 py-2 font-semibold">비용</th>
                  <th className="text-right px-3 py-2 font-semibold">지연(ms)</th>
                  <th className="text-left px-3 py-2 font-semibold">Hash</th>
                </tr>
              </thead>
              <tbody>
                {calls.calls.map(c => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(c.createdAt)}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{c.userId.slice(0, 8)}…</td>
                    <td className="px-3 py-2 text-foreground/80">{c.purpose}</td>
                    <td className="px-3 py-2">
                      <OutcomeBadge outcome={c.outcome} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {c.inputTokens.toLocaleString()} / {c.outputTokens.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-foreground">{c.costWon.toLocaleString()}원</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{c.latencyMs > 0 ? c.latencyMs.toLocaleString() : "—"}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{c.inputHash || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {calls && calls.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">총 {calls.totalElements.toLocaleString()}건 · {page + 1} / {calls.totalPages} 페이지</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page <= 0} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40">이전</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= calls.totalPages - 1} className="rounded-lg border border-border px-3 py-1 disabled:opacity-40">다음</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function BucketCard({ title, bucket }: { title: string; bucket: Bucket }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold tabular-nums">{bucket.total.toLocaleString()}<span className="text-xs font-medium text-muted-foreground ml-1">호출</span></p>
      <div className="grid grid-cols-2 gap-1 text-[11px]">
        <div className="text-green-700">OK {bucket.ok}</div>
        <div className="text-blue-700">CACHED {bucket.cached}</div>
        <div className="text-red-700">FAILED {bucket.failed}</div>
        <div className="text-amber-700">RL {bucket.rateLimited}</div>
      </div>
      <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border">
        <p>캐시 hit률 <strong className="text-foreground">{bucket.cacheHitRatePercent}%</strong></p>
        <p>비용 <strong className="text-foreground tabular-nums">{bucket.totalCostWon.toLocaleString()}원</strong> · 평균 {bucket.avgLatencyMs.toLocaleString()}ms</p>
      </div>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: LlmCall["outcome"] }) {
  const map = {
    OK: "bg-green-100 text-green-800",
    CACHED: "bg-blue-100 text-blue-800",
    FAILED: "bg-red-100 text-red-800",
    RATE_LIMITED: "bg-amber-100 text-amber-800",
  };
  return <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${map[outcome]}`}>{outcome}</span>;
}
