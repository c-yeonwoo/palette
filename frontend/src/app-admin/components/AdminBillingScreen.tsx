import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";
import { UserSearchInput } from "./UserSearchInput";

/**
 * 어드민 — 물감 수동 충전 + 이력 조회 (ADR 0044 운영 감사 트랙).
 *
 * 좌측: 충전 폼 (사용자 ID + 물감 수 + BONUS/PAID + 사유)
 * 우측: 이력 테이블 (페이지네이션 + recipient 필터)
 *
 * BONUS — bonusPoints 적립 (만료 가능). CS 응대·이벤트.
 * PAID  — paidPoints 적립 (만료 없음). 결제 보정·환불. (무현금 모델 ADR 0064 — 현금 출금은 정책상 비활성)
 */
interface Grant {
  id: string;
  recipientUserId: string;
  granterAdminUserId: string;
  amountPoints: number;
  grantType: "BONUS" | "PAID";
  validDays: number | null;
  reason: string;
  grantedAt: string;
}

interface GrantListResponse {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  grants: Grant[];
}

interface GrantResponse {
  id: string;
  recipientUserId: string;
  amountPoints: number;
  grantType: string;
  newBonusBalance: number;
  newPaidBalance: number;
  totalBalance: number;
  grantedAt: string;
}

const PAGE_SIZE = 20;

interface Props {
  onBack: () => void;
}

export function AdminBillingScreen({ onBack }: Props) {
  // ── 충전 폼 ─────────────────────────
  const [recipientUserId, setRecipientUserId] = useState("");
  const [amountPoints, setAmountPoints] = useState("");
  const [grantType, setGrantType] = useState<"BONUS" | "PAID">("BONUS");
  const [validDays, setValidDays] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<GrantResponse | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // ── 이력 ─────────────────────────
  const [filterUserId, setFilterUserId] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<GrantListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setHistoryError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        size: String(PAGE_SIZE),
      });
      if (filterUserId.trim()) qs.set("recipientUserId", filterUserId.trim());
      const res = await adminApi.get<GrantListResponse>(`/api/v1/admin/billing/grants?${qs.toString()}`);
      setData(res);
    } catch (e: unknown) {
      setHistoryError((e as Error).message || "이력 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); /* eslint-disable-next-line */ }, [page, filterUserId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLastResult(null);

    const amount = parseInt(amountPoints, 10);
    if (!recipientUserId.trim()) return setFormError("수신 사용자 ID 필수");
    if (!Number.isFinite(amount) || amount <= 0) return setFormError("물감 수는 1 이상 정수");
    if (!reason.trim()) return setFormError("사유 필수");
    if (grantType === "BONUS" && validDays && parseInt(validDays, 10) <= 0) {
      return setFormError("유효일은 1 이상 또는 비워두기 (무기한)");
    }

    setSubmitting(true);
    try {
      const body: {
        recipientUserId: string;
        amountPoints: number;
        grantType: "BONUS" | "PAID";
        validDays?: number;
        reason: string;
      } = {
        recipientUserId: recipientUserId.trim(),
        amountPoints: amount,
        grantType,
        reason: reason.trim(),
      };
      if (grantType === "BONUS" && validDays.trim()) {
        body.validDays = parseInt(validDays, 10);
      }
      const res = await adminApi.post<GrantResponse>("/api/v1/admin/billing/grant", body);
      setLastResult(res);
      // 입력 초기화 (수신자 ID 는 유지 — 같은 사용자 반복 응대 편의)
      setAmountPoints("");
      setReason("");
      setValidDays("");
      // 이력 갱신
      setPage(0);
      loadHistory();
    } catch (e: unknown) {
      setFormError((e as Error).message || "충전 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground">팔레트 운영자</p>
            <h1 className="text-lg font-bold text-foreground">물감 수동 충전</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* ── 충전 폼 ── */}
        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="font-bold text-foreground">충전</h2>
            <p className="text-xs text-muted-foreground mt-1">
              CS 응대·보상·이벤트 등 수동 지급. 모든 지급은 이력에 기록됩니다.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <Field label="수신 사용자 (이름·닉네임·이메일 검색)" required>
              <UserSearchInput
                value={recipientUserId}
                onChange={(uid) => setRecipientUserId(uid)}
                disabled={submitting}
                placeholder="이름·닉네임·이메일 입력 시 자동 검색"
              />
            </Field>

            <Field label="물감 수" required>
              <input
                type="number"
                value={amountPoints}
                onChange={(e) => setAmountPoints(e.target.value)}
                min={1}
                placeholder="100"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums"
                disabled={submitting}
              />
              {amountPoints && Number.isFinite(parseInt(amountPoints, 10)) && parseInt(amountPoints, 10) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">≈ {(parseInt(amountPoints, 10) * 100).toLocaleString()}원 상당</p>
              )}
            </Field>

            <Field label="유형" required>
              <div className="flex gap-2">
                {(["BONUS", "PAID"] as const).map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setGrantType(t)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      grantType === t
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/40"
                    }`}
                    disabled={submitting}
                  >
                    {t === "BONUS" ? "BONUS (보너스·만료O)" : "PAID (유료·만료X)"}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {grantType === "BONUS"
                  ? "이벤트·CS 보상 등. 만료 가능."
                  : "결제 보정·환불 등. 만료 없음. (현금 출금은 무현금 모델 ADR 0064 로 비활성)"}
              </p>
            </Field>

            {grantType === "BONUS" && (
              <Field label="유효일 (옵션 · 비우면 무기한)">
                <input
                  type="number"
                  value={validDays}
                  onChange={(e) => setValidDays(e.target.value)}
                  min={1}
                  placeholder="14"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm tabular-nums"
                  disabled={submitting}
                />
              </Field>
            )}

            <Field label="사유" required>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 결제 누락 보정 · CS 티켓 #1234"
                rows={3}
                maxLength={200}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none"
                disabled={submitting}
              />
              <p className="text-[11px] text-muted-foreground text-right">{reason.length}/200</p>
            </Field>

            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{formError}</div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-foreground text-background py-3 font-bold text-sm disabled:opacity-50"
            >
              {submitting ? "처리 중..." : "충전하기"}
            </button>
          </form>

          {lastResult && (
            <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-xs space-y-1">
              <p className="font-semibold text-green-900">충전 완료</p>
              <p className="text-green-900/80">
                +{lastResult.amountPoints.toLocaleString()} 물감 ({lastResult.grantType})
              </p>
              <p className="text-green-900/70">
                현재 잔액 — 보너스 {lastResult.newBonusBalance.toLocaleString()} / 유료 {lastResult.newPaidBalance.toLocaleString()} / 총{" "}
                <strong>{lastResult.totalBalance.toLocaleString()}</strong>
              </p>
            </div>
          )}
        </section>

        {/* ── 이력 ── */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <h2 className="font-bold text-foreground">충전 이력</h2>
            <div className="flex items-center gap-2">
              <div className="w-80">
                <UserSearchInput
                  value={filterUserId}
                  onChange={(uid) => { setFilterUserId(uid); setPage(0); }}
                  placeholder="수신자로 필터링 (선택)"
                />
              </div>
              <button
                onClick={loadHistory}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/50"
              >
                새로고침
              </button>
            </div>
          </div>

          {historyError && (
            <div className="px-5 py-3 text-xs text-red-700 bg-red-50 border-b border-red-200">{historyError}</div>
          )}

          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
          ) : !data || data.grants.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">이력 없음</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">일시</th>
                    <th className="text-left px-3 py-2 font-semibold">수신 사용자</th>
                    <th className="text-right px-3 py-2 font-semibold">물감</th>
                    <th className="text-left px-3 py-2 font-semibold">유형</th>
                    <th className="text-left px-3 py-2 font-semibold">유효일</th>
                    <th className="text-left px-3 py-2 font-semibold">사유</th>
                    <th className="text-left px-3 py-2 font-semibold">운영자</th>
                  </tr>
                </thead>
                <tbody>
                  {data.grants.map((g) => (
                    <tr key={g.id} className="border-t border-border">
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{formatDate(g.grantedAt)}</td>
                      <td className="px-3 py-2 font-mono text-[11px] text-foreground/80">{g.recipientUserId.slice(0, 8)}…</td>
                      <td className="px-3 py-2 text-right tabular-nums font-bold text-foreground">+{g.amountPoints.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          g.grantType === "BONUS"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {g.grantType}
                        </span>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {g.grantType === "BONUS" ? (g.validDays != null ? `${g.validDays}일` : "무기한") : "—"}
                      </td>
                      <td className="px-3 py-2 text-foreground/80 max-w-[280px] truncate" title={g.reason}>
                        {g.reason}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{g.granterAdminUserId.slice(0, 8)}…</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 페이지네이션 */}
          {data && data.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                총 {data.totalElements.toLocaleString()}건 · {page + 1} / {data.totalPages} 페이지
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page <= 0}
                  className="rounded-lg border border-border px-3 py-1 disabled:opacity-40"
                >
                  이전
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.totalPages - 1}
                  className="rounded-lg border border-border px-3 py-1 disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
