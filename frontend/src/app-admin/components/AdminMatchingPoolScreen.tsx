import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../lib/adminApi";

interface UserBrief {
  userId: string;
  email: string | null;
  nickname: string;
}

type Status =
  | "PENDING"
  | "MATCHMAKER_APPROVED"
  | "REJECTED_BY_MATCHMAKER"
  | "COMPLETED"
  | "REJECTED_BY_TARGET"
  | "CANCELLED_BY_ADMIN";

interface MatchmakingSummary {
  id: string;
  status: Status;
  requester: UserBrief;
  matchmaker: UserBrief;
  target: UserBrief;
  hasAdminNote: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DecisionView {
  decidedAt: string;
  message: string | null;
  positive: boolean;
}

interface MatchmakingDetail {
  id: string;
  status: Status;
  requester: UserBrief;
  matchmaker: UserBrief;
  target: UserBrief;
  requesterMessage: string | null;
  matchmakerDecision: DecisionView | null;
  targetDecision: DecisionView | null;
  adminNote: string | null;
  adminLastUpdatedAt: string | null;
  adminLastUpdatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse {
  items: MatchmakingSummary[];
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
}

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  PENDING: { label: "주선자 대기", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  MATCHMAKER_APPROVED: { label: "수신자 대기", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  COMPLETED: { label: "성사", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  REJECTED_BY_MATCHMAKER: { label: "주선자 거절", cls: "bg-muted text-muted-foreground border-border" },
  REJECTED_BY_TARGET: { label: "수신자 거절", cls: "bg-muted text-muted-foreground border-border" },
  CANCELLED_BY_ADMIN: { label: "운영자 취소", cls: "bg-red-100 text-red-700 border-red-200" },
};

const STATUS_OPTIONS: { value: "ALL" | Status; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "PENDING", label: "주선자 대기" },
  { value: "MATCHMAKER_APPROVED", label: "수신자 대기" },
  { value: "COMPLETED", label: "성사" },
  { value: "REJECTED_BY_MATCHMAKER", label: "주선자 거절" },
  { value: "REJECTED_BY_TARGET", label: "수신자 거절" },
  { value: "CANCELLED_BY_ADMIN", label: "운영자 취소" },
];

export function AdminMatchingPoolScreen() {
  const [data, setData] = useState<PageResponse | null>(null);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        size: "20",
        status: statusFilter,
        sort: "updatedAt:desc",
      });
      if (q) qs.set("q", q);
      const res = await adminApi.get<PageResponse>(`/api/v1/admin/matchmaking/requests?${qs.toString()}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, q]);

  useEffect(() => {
    load();
  }, [load]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setQ(qInput.trim());
  };

  return (
    <main className="max-w-6xl mx-auto px-6 py-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={submitSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="요청자·주선자·대상자 닉네임·이메일·실명 검색"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            className="flex-1 h-10 px-3 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
          />
          <button type="submit" className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            검색
          </button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setPage(0);
          }}
          className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading && <div className="p-8 text-center text-sm text-muted-foreground">불러오는 중...</div>}
        {error && <div className="p-8 text-center text-sm text-destructive">{error}</div>}
        {!loading && !error && data && data.items.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-foreground">조건에 맞는 매칭 요청이 없습니다.</p>
          </div>
        )}
        {!loading && !error && data && data.items.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">요청자 → 대상자</th>
                <th className="px-4 py-3 font-medium">주선자</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">메모</th>
                <th className="px-4 py-3 font-medium">최근 업데이트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="text-foreground font-medium">{r.requester.nickname}</div>
                    <div className="text-xs text-muted-foreground">→ {r.target.nickname}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.matchmaker.nickname}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_META[r.status].cls}`}>
                      {STATUS_META[r.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.hasAdminNote ? <span className="text-xs">📝</span> : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                    {r.updatedAt.slice(0, 19).replace("T", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground tabular-nums">
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

      {selectedId && (
        <MatchmakingDetailModal
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            setSelectedId(null);
            load();
          }}
        />
      )}
    </main>
  );
}

// ── 상세 modal ───────────────────────────────────────────────────────────────

function MatchmakingDetailModal({
  id,
  onClose,
  onUpdated,
}: {
  id: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [detail, setDetail] = useState<MatchmakingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"none" | "status" | "note">("none");
  const [newStatus, setNewStatus] = useState<Status>("CANCELLED_BY_ADMIN");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await adminApi.get<MatchmakingDetail>(`/api/v1/admin/matchmaking/requests/${id}`);
        setDetail(r);
        setNote(r.adminNote ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "조회 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const submit = async () => {
    if (!note.trim()) {
      alert("운영자 메모는 필수입니다");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "status") {
        await adminApi.patch<MatchmakingDetail>(`/api/v1/admin/matchmaking/requests/${id}/status`, {
          status: newStatus,
          note: note.trim(),
        });
      } else if (mode === "note") {
        await adminApi.patch<MatchmakingDetail>(`/api/v1/admin/matchmaking/requests/${id}/note`, {
          note: note.trim(),
        });
      }
      onUpdated();
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리 실패");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">매칭 요청 상세</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            닫기 ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {detail && (
            <>
              {/* 흐름 */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">현재 상태</span>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_META[detail.status].cls}`}>
                    {STATUS_META[detail.status].label}
                  </span>
                </div>
                <div className="text-sm space-y-1.5 text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">요청자</span>
                    <span>{detail.requester.nickname} <span className="text-xs text-muted-foreground">({detail.requester.email ?? "-"})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">주선자</span>
                    <span>{detail.matchmaker.nickname} <span className="text-xs text-muted-foreground">({detail.matchmaker.email ?? "-"})</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">대상자</span>
                    <span>{detail.target.nickname} <span className="text-xs text-muted-foreground">({detail.target.email ?? "-"})</span></span>
                  </div>
                </div>
              </div>

              {/* 메시지 / 결정 */}
              {detail.requesterMessage && (
                <DetailBox title="요청자 메시지">{detail.requesterMessage}</DetailBox>
              )}
              {detail.matchmakerDecision && (
                <DetailBox title={`주선자 ${detail.matchmakerDecision.positive ? "승인" : "거절"} · ${detail.matchmakerDecision.decidedAt.slice(0, 19).replace("T", " ")}`}>
                  {detail.matchmakerDecision.message ?? "—"}
                </DetailBox>
              )}
              {detail.targetDecision && (
                <DetailBox title={`대상자 ${detail.targetDecision.positive ? "수락" : "거절"} · ${detail.targetDecision.decidedAt.slice(0, 19).replace("T", " ")}`}>
                  {detail.targetDecision.message ?? "—"}
                </DetailBox>
              )}

              {/* 운영자 메모 */}
              {detail.adminNote && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs text-amber-700 mb-1">
                    📝 운영자 메모 · {detail.adminLastUpdatedAt?.slice(0, 19).replace("T", " ")}
                    {detail.adminLastUpdatedBy && <span> · {detail.adminLastUpdatedBy.slice(0, 8)}</span>}
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{detail.adminNote}</p>
                </div>
              )}

              {/* 운영자 액션 */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">운영자 액션</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMode("note")}
                    className={`flex-1 h-9 rounded-lg border text-sm ${
                      mode === "note" ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    메모만 갱신
                  </button>
                  <button
                    onClick={() => setMode("status")}
                    className={`flex-1 h-9 rounded-lg border text-sm ${
                      mode === "status" ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    강제 상태 변경
                  </button>
                </div>

                {mode === "status" && (
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">새 상태</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as Status)}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
                    >
                      {(Object.keys(STATUS_META) as Status[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {mode !== "none" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">
                        운영자 메모 / 사유 <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="예) 양쪽 양해 하에 매칭 취소 — 2026-05-31 CS 인입"
                        maxLength={1000}
                        className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setMode("none")}
                        disabled={submitting}
                        className="h-9 px-4 rounded-lg border border-border bg-card text-sm"
                      >
                        취소
                      </button>
                      <button
                        onClick={submit}
                        disabled={submitting || !note.trim()}
                        className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                      >
                        {submitting ? "적용 중..." : "적용"}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground tabular-nums">
                생성 {detail.createdAt.slice(0, 19).replace("T", " ")} · 최근 업데이트 {detail.updatedAt.slice(0, 19).replace("T", " ")}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1.5">{title}</p>
      <p className="text-sm text-foreground whitespace-pre-wrap">{children}</p>
    </div>
  );
}
