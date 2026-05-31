import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

interface UserDetail {
  userId: string;
  email: string | null;
  nickname: string;
  realName: string;
  gender: string;
  birthDate: string;
  age: number;
  phoneNumber: string | null;
  accountType: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "DORMANT";
  statusReason: string | null;
  statusUpdatedAt: string | null;
  statusUpdatedBy: string | null;
  isProfileCompleted: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  deletedAt: string | null;
}

interface Props {
  userId: string;
  onBack: () => void;
}

export function AdminUserDetailScreen({ userId, onBack }: Props) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 상태 변경 dialog
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<UserDetail["status"]>("ACTIVE");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<UserDetail>(`/api/v1/admin/users/${userId}`);
      setUser(res);
      setNewStatus(res.status);
      setReason(res.statusReason ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const submit = async () => {
    if (!user) return;
    if (newStatus === "SUSPENDED" && !reason.trim()) {
      alert("차단 사유는 필수입니다");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await adminApi.patch<UserDetail>(`/api/v1/admin/users/${userId}/status`, {
        status: newStatus,
        reason: reason.trim() || null,
      });
      setUser(updated);
      setEditing(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "상태 변경 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
            ← 회원 목록
          </button>
          <h1 className="text-lg font-bold text-foreground">회원 상세</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {user && (
          <>
            {/* 기본 정보 */}
            <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{user.nickname}</h2>
                  <p className="text-sm text-muted-foreground">
                    {user.realName} · {user.gender === "MALE" ? "남성" : "여성"} · {user.age}세 · {user.birthDate}
                  </p>
                </div>
                <StatusBadge status={user.status} />
              </div>
              <hr className="border-border" />
              <DL items={[
                ["이메일", user.email ?? "—"],
                ["휴대폰", user.phoneNumber ?? "—"],
                ["계정 유형", user.accountType],
                ["권한", user.role],
                ["프로필 완성", user.isProfileCompleted ? "✅" : "❌"],
                ["휴대폰 인증", user.isPhoneVerified ? "✅" : "❌"],
                ["가입일", user.createdAt.slice(0, 19).replace("T", " ")],
                ["마지막 로그인", user.lastLoginAt.slice(0, 19).replace("T", " ")],
                user.deletedAt ? ["탈퇴일", user.deletedAt.slice(0, 19).replace("T", " ")] : null,
              ].filter(Boolean) as [string, string][]} />
            </section>

            {/* 상태 변경 */}
            <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">상태 관리</h3>
                {!editing && user.role !== "ADMIN" && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm h-8 px-3 rounded-lg bg-foreground text-background"
                  >
                    상태 변경
                  </button>
                )}
              </div>

              {user.role === "ADMIN" && (
                <p className="text-xs text-muted-foreground">
                  운영자 계정은 화면에서 상태 변경 불가 (오작동 방지).
                </p>
              )}

              {user.statusReason && (
                <div className="text-sm bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    마지막 변경: {user.statusUpdatedAt?.slice(0, 19).replace("T", " ")}
                    {user.statusUpdatedBy && <span> · 운영자 {user.statusUpdatedBy.slice(0, 8)}</span>}
                  </p>
                  <p className="text-foreground">사유: {user.statusReason}</p>
                </div>
              )}

              {editing && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">새 상태</label>
                    <div className="flex gap-1.5">
                      {(["ACTIVE", "SUSPENDED", "DORMANT"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setNewStatus(s)}
                          className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-colors ${
                            newStatus === s
                              ? "bg-foreground text-background border-foreground"
                              : "bg-card border-border text-muted-foreground"
                          }`}
                        >
                          {s === "ACTIVE" ? "활성화" : s === "SUSPENDED" ? "차단" : "휴면"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">
                      사유 {newStatus === "SUSPENDED" && <span className="text-destructive">*</span>}
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={
                        newStatus === "SUSPENDED"
                          ? "예) 허위 프로필 신고 다수 접수 — 확인 후 차단"
                          : "선택 사항 (감사 로그용)"
                      }
                      className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setNewStatus(user.status);
                        setReason(user.statusReason ?? "");
                      }}
                      className="h-10 px-4 rounded-lg border border-border bg-card text-sm"
                      disabled={submitting}
                    >
                      취소
                    </button>
                    <button
                      onClick={submit}
                      disabled={submitting || (newStatus === user.status && reason === (user.statusReason ?? ""))}
                      className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                    >
                      {submitting ? "적용 중..." : "적용"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: UserDetail["status"] }) {
  const map = {
    ACTIVE: { label: "활성", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    SUSPENDED: { label: "차단", cls: "bg-red-100 text-red-700 border-red-200" },
    DORMANT: { label: "휴면", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  } as const;
  return (
    <span className={`inline-block text-xs px-2.5 py-1 rounded-full border ${map[status].cls}`}>
      {map[status].label}
    </span>
  );
}

function DL({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-foreground tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
