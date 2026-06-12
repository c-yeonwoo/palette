import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

/**
 * 소개 요청 플로우 모니터링 — 날짜별. 한 요청의 생성→주선자→수신자→최종 status timeline.
 * 단계별 latency 노출 — 어디서 병목인지 가시화.
 */
interface FlowUser {
  userId: string;
  nickname: string;
  realName: string;
}

interface MatchmakingFlowRow {
  requestId: string;
  status: string;
  createdAt: string;
  requester: FlowUser;
  matchmaker: FlowUser;
  target: FlowUser;
  matchmakerDecidedAt: string | null;
  matchmakerApproved: boolean | null;
  matchmakerMessage: string | null;
  matchmakerLatencyMin: number | null;
  targetDecidedAt: string | null;
  targetAccepted: boolean | null;
  targetMessage: string | null;
  targetLatencyMin: number | null;
  requesterMessage: string | null;
  adminNote: string | null;
}

interface FlowSummary {
  total: number;
  pendingMatchmaker: number;
  matchmakerRejected: number;
  pendingTarget: number;
  targetRejected: number;
  matched: number;
  avgMatchmakerLatencyMin: number | null;
  avgTargetLatencyMin: number | null;
}

interface FlowResponse {
  date: string;
  summary: FlowSummary;
  flows: MatchmakingFlowRow[];
}

interface Props {
  onBack: () => void;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "전체 상태" },
  { value: "PENDING_MATCHMAKER", label: "주선자 대기" },
  { value: "PENDING_TARGET", label: "수신자 대기" },
  { value: "MATCHED", label: "성사" },
  { value: "REJECTED_BY_MATCHMAKER", label: "주선자 거절" },
  { value: "REJECTED_BY_TARGET", label: "수신자 거절" },
  { value: "EXPIRED", label: "만료" },
];

export function AdminMatchmakingFlowScreen({ onBack }: Props) {
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const [date, setDate] = useState(todayStr);
  const [status, setStatus] = useState("");
  const [data, setData] = useState<FlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ date });
        if (status) qs.set("status", status);
        const res = await adminApi.get<FlowResponse>(`/api/v1/admin/matchmaking/flow?${qs.toString()}`);
        setData(res);
      } catch (e: unknown) {
        setError((e as Error).message || "조회 실패");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date, status]);

  const formatTime = (iso: string | null): string => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground">팔레트 운영자</p>
            <h1 className="text-lg font-bold text-foreground">소개 요청 플로우</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5 flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">날짜 (KST)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {data?.summary && (
            <div className="ml-auto grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
              <SummaryPill label="전체" value={data.summary.total} />
              <SummaryPill label="주선 대기" value={data.summary.pendingMatchmaker} tone="amber" />
              <SummaryPill label="주선 거절" value={data.summary.matchmakerRejected} tone="rose" />
              <SummaryPill label="수신 대기" value={data.summary.pendingTarget} tone="amber" />
              <SummaryPill label="수신 거절" value={data.summary.targetRejected} tone="rose" />
              <SummaryPill label="성사" value={data.summary.matched} tone="emerald" />
            </div>
          )}
        </section>

        {data?.summary && (data.summary.avgMatchmakerLatencyMin != null || data.summary.avgTargetLatencyMin != null) && (
          <section className="rounded-2xl border border-border bg-card p-5 flex items-center gap-8 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">평균 주선자 응답</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {data.summary.avgMatchmakerLatencyMin != null ? `${data.summary.avgMatchmakerLatencyMin}분` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">평균 수신자 응답</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {data.summary.avgTargetLatencyMin != null ? `${data.summary.avgTargetLatencyMin}분` : "—"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground ml-auto">
              평균값 — 어느 단계가 병목인지 가시화. 너무 길면 푸시 트리거 / 매칭자 풀 재검토.
            </p>
          </section>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
        ) : !data || data.flows.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            해당 날짜에 매칭 요청이 없습니다.
          </div>
        ) : (
          <section className="space-y-3">
            {data.flows.map((f) => (
              <FlowCard key={f.requestId} flow={f} formatTime={formatTime} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function SummaryPill({ label, value, tone }: { label: string; value: number; tone?: "amber" | "rose" | "emerald" }) {
  const toneCls = tone === "amber" ? "bg-amber-50 border-amber-200 text-amber-900"
    : tone === "rose" ? "bg-rose-50 border-rose-200 text-rose-900"
    : tone === "emerald" ? "bg-emerald-50 border-emerald-200 text-emerald-900"
    : "bg-muted/40 border-border text-foreground";
  return (
    <div className={`rounded-lg border px-2 py-1.5 text-center ${toneCls}`}>
      <p className="text-[10px]">{label}</p>
      <p className="text-sm font-bold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function FlowCard({ flow, formatTime }: { flow: MatchmakingFlowRow; formatTime: (s: string | null) => string }) {
  const statusTone = (() => {
    if (flow.targetAccepted === true) return "bg-emerald-50 border-emerald-200";
    if (flow.targetAccepted === false || flow.matchmakerApproved === false) return "bg-rose-50 border-rose-200";
    if (flow.matchmakerDecidedAt == null) return "bg-amber-50 border-amber-200";
    if (flow.targetDecidedAt == null) return "bg-amber-50 border-amber-200";
    return "bg-card border-border";
  })();
  return (
    <div className={`rounded-2xl border p-4 ${statusTone}`}>
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <p className="text-xs font-mono text-muted-foreground">{flow.requestId.slice(0, 8)}…</p>
        <p className="text-xs font-bold text-foreground/80">{flow.status}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <StepBox
          stage="신청"
          time={formatTime(flow.createdAt)}
          user={flow.requester}
          message={flow.requesterMessage}
          done
        />
        <StepBox
          stage="주선자 결정"
          time={formatTime(flow.matchmakerDecidedAt)}
          user={flow.matchmaker}
          message={flow.matchmakerMessage}
          done={flow.matchmakerDecidedAt != null}
          status={flow.matchmakerApproved == null ? "pending" : flow.matchmakerApproved ? "approved" : "rejected"}
          latency={flow.matchmakerLatencyMin}
        />
        <StepBox
          stage="수신자 결정"
          time={formatTime(flow.targetDecidedAt)}
          user={flow.target}
          message={flow.targetMessage}
          done={flow.targetDecidedAt != null}
          status={flow.targetAccepted == null ? "pending" : flow.targetAccepted ? "approved" : "rejected"}
          latency={flow.targetLatencyMin}
        />
      </div>
      {flow.adminNote && (
        <p className="mt-3 text-xs text-muted-foreground italic">📝 운영자 메모: {flow.adminNote}</p>
      )}
    </div>
  );
}

function StepBox({
  stage, time, user, message, done, status, latency,
}: {
  stage: string;
  time: string;
  user: FlowUser;
  message: string | null;
  done: boolean;
  status?: "pending" | "approved" | "rejected";
  latency?: number | null;
}) {
  const statusBadge = status === "approved" ? "✅ 승인"
    : status === "rejected" ? "❌ 거절"
    : status === "pending" ? "⏳ 대기"
    : null;
  return (
    <div className={`rounded-xl border p-3 ${done ? "border-border bg-background" : "border-dashed border-border bg-muted/20"}`}>
      <div className="flex items-baseline justify-between mb-1.5">
        <p className="text-xs font-bold text-foreground">{stage}</p>
        <p className="text-xs tabular-nums text-muted-foreground">{time}</p>
      </div>
      <p className="text-sm font-semibold text-foreground truncate">{user.nickname || "?"}</p>
      <p className="text-[11px] text-muted-foreground truncate">{user.realName}</p>
      {statusBadge && (
        <p className="text-[11px] font-bold mt-1.5">{statusBadge}</p>
      )}
      {latency != null && (
        <p className="text-[11px] text-muted-foreground mt-0.5">⏱ {latency}분 소요</p>
      )}
      {message && (
        <p className="text-[11px] text-muted-foreground mt-1 italic line-clamp-2">"{message}"</p>
      )}
    </div>
  );
}
