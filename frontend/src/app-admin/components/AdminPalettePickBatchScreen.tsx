import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

/**
 * 팔레트픽 야간 배치 관측 (ADR 0047 §B.3).
 *
 * 배치는 매일 00:30 KST 스케줄로 LLM 궁합 분석을 사전 캐싱한다. 결과가 로그로만 남아
 * 어드민에서 진척·실패를 볼 수 없던 문제 → 실행 기록 조회 + 수동 실행.
 *
 * 콜드스타트 주의: 활성 사용자 0 이면 배치는 no-op(SUCCESS, viewers=0)이 정상.
 */
interface BatchRun {
  id: string;
  runDate: string;
  trigger: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  activeUsers: number;
  viewersProcessed: number;
  llmCalls: number;
  failures: number;
  hitCallCap: boolean;
  errorSample: string | null;
}

interface RunsResponse {
  latest: BatchRun | null;
  runs: BatchRun[];
}

interface Props {
  onBack: () => void;
}

const STATUS_TONE: Record<string, string> = {
  SUCCESS: "bg-emerald-50 border-emerald-200 text-emerald-900",
  PARTIAL: "bg-amber-50 border-amber-200 text-amber-900",
  FAILED: "bg-rose-50 border-rose-200 text-rose-900",
  RUNNING: "bg-sky-50 border-sky-200 text-sky-900",
  SKIPPED: "bg-muted/40 border-border text-muted-foreground",
};

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: "성공",
  PARTIAL: "부분 실패",
  FAILED: "실패",
  RUNNING: "실행 중",
  SKIPPED: "비활성(skip)",
};

export function AdminPalettePickBatchScreen({ onBack }: Props) {
  const [data, setData] = useState<RunsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<RunsResponse>("/api/v1/admin/palette-pick/batch/runs?limit=30");
      setData(res);
    } catch (e: unknown) {
      setError((e as Error).message || "조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runNow = async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    try {
      await adminApi.post<BatchRun>("/api/v1/admin/palette-pick/batch/run");
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || "실행 실패");
    } finally {
      setRunning(false);
    }
  };

  const fmtTime = (iso: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const fmtDuration = (ms: number | null): string => {
    if (ms == null) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const latest = data?.latest ?? null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground">팔레트 운영자</p>
            <h1 className="text-lg font-bold text-foreground">팔레트픽 배치</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* 안내 + 수동 실행 */}
        <section className="rounded-2xl border border-border bg-card p-5 flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <h2 className="text-base font-bold text-foreground mb-1">야간 배치 (매일 00:30 KST)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              활성 사용자별 후보 풀을 산출하고 상위 후보에 LLM 궁합 분석을 미리 캐싱합니다.
              콜드스타트 단계엔 <span className="font-semibold text-foreground">활성 사용자 0 → 실행됐어도 viewers=0(정상 no-op)</span>.
              실 유저가 쌓이면 처리·호출·실패 수가 올라갑니다.
            </p>
          </div>
          <button
            onClick={runNow}
            disabled={running}
            className="rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
          >
            {running ? "실행 중..." : "지금 실행"}
          </button>
        </section>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {/* 최신 실행 요약 */}
        {latest && (
          <section className={`rounded-2xl border p-5 ${STATUS_TONE[latest.status] ?? "bg-card border-border"}`}>
            <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
              <p className="text-sm font-bold">
                최신 실행 · {STATUS_LABEL[latest.status] ?? latest.status}
                <span className="ml-2 text-xs font-normal opacity-70">
                  {latest.trigger === "MANUAL" ? "수동" : "예약"} · {fmtTime(latest.startedAt)}
                </span>
              </p>
              <p className="text-xs opacity-70">소요 {fmtDuration(latest.durationMs)}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="활성 사용자" value={latest.activeUsers} />
              <Stat label="처리 viewer" value={latest.viewersProcessed} />
              <Stat label="LLM 호출" value={latest.llmCalls} />
              <Stat label="실패" value={latest.failures} alert={latest.failures > 0} />
            </div>
            {latest.hitCallCap && (
              <p className="mt-3 text-xs font-medium">⚠ 호출 상한 도달 — 일부 viewer 미처리 (max-calls 상향 검토)</p>
            )}
            {latest.errorSample && (
              <pre className="mt-3 text-[11px] whitespace-pre-wrap font-mono opacity-80 bg-background/40 rounded-lg p-2 overflow-x-auto">
                {latest.errorSample}
              </pre>
            )}
          </section>
        )}

        {/* 최근 실행 이력 */}
        {loading ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
        ) : !data || data.runs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            아직 실행 기록이 없습니다. "지금 실행" 으로 첫 실행을 트리거하세요.
          </div>
        ) : (
          <section className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">최근 실행 ({data.runs.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b border-border">
                    <th className="px-4 py-2.5 font-medium">시작</th>
                    <th className="px-4 py-2.5 font-medium">트리거</th>
                    <th className="px-4 py-2.5 font-medium">상태</th>
                    <th className="px-4 py-2.5 font-medium text-right">활성</th>
                    <th className="px-4 py-2.5 font-medium text-right">처리</th>
                    <th className="px-4 py-2.5 font-medium text-right">호출</th>
                    <th className="px-4 py-2.5 font-medium text-right">실패</th>
                    <th className="px-4 py-2.5 font-medium text-right">소요</th>
                  </tr>
                </thead>
                <tbody>
                  {data.runs.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{fmtTime(r.startedAt)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{r.trigger === "MANUAL" ? "수동" : "예약"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[r.status] ?? "bg-muted/40 border-border"}`}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.activeUsers}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.viewersProcessed}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.llmCalls}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${r.failures > 0 ? "text-rose-600 font-semibold" : ""}`}>{r.failures}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{fmtDuration(r.durationMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 px-3 py-2.5">
      <p className="text-[11px] opacity-70">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${alert ? "text-rose-600" : ""}`}>{value.toLocaleString()}</p>
    </div>
  );
}
