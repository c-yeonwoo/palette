import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

interface FriendSummary {
  userId: string;
  nickname: string;
  realName: string;
  gender: string;
  age: number;
  colorType: string | null;
  completionRate: number;
  status: "ACTIVE" | "SUSPENDED" | "DORMANT";
  isDeleted: boolean;
}

interface UserStats {
  colorType: string | null;
  profileCompletionRate: number;
  trustScore: number;
  viewCount: number;
  friendCount: number;
  matchmaking: {
    sentTotal: number;
    sentCompleted: number;
    sentPending: number;
    receivedTotal: number;
    receivedCompleted: number;
    receivedPending: number;
    matchmakerTotal: number;
    matchmakerCompleted: number;
  };
  aiSignal: {
    last30DaysExposures: number;
  };
}

// 8가지 컬러 타입 매핑 (theme.css 의 --ct-* 토큰)
const COLOR_TYPE_META: Record<string, { label: string; hex: string }> = {
  WARM_ORANGE: { label: "따뜻한 오렌지", hex: "#F97316" },
  CALM_BLUE: { label: "차분한 블루", hex: "#3B82F6" },
  VIBRANT_RED: { label: "강렬한 레드", hex: "#EF4444" },
  SOFT_PINK: { label: "부드러운 핑크", hex: "#EC4899" },
  FRESH_GREEN: { label: "산뜻한 그린", hex: "#10B981" },
  ELEGANT_PURPLE: { label: "우아한 퍼플", hex: "#8B5CF6" },
  BRIGHT_YELLOW: { label: "환한 옐로우", hex: "#F59E0B" },
  SOPHISTICATED_GRAY: { label: "세련된 그레이", hex: "#6B7280" },
};

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
  const [stats, setStats] = useState<UserStats | null>(null);
  const [friends, setFriends] = useState<FriendSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 상태 변경 dialog
  const [editing, setEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<UserDetail["status"]>("ACTIVE");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 프로필 미리보기 modal
  const [profilePreview, setProfilePreview] = useState<unknown | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // 병렬 호출
      const [u, s, f] = await Promise.all([
        adminApi.get<UserDetail>(`/api/v1/admin/users/${userId}`),
        adminApi.get<UserStats>(`/api/v1/admin/users/${userId}/stats`).catch(() => null),
        adminApi.get<FriendSummary[]>(`/api/v1/admin/users/${userId}/friends`).catch(() => []),
      ]);
      setUser(u);
      setStats(s);
      setFriends(f);
      setNewStatus(u.status);
      setReason(u.statusReason ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  };

  const openProfilePreview = async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const p = await adminApi.get<unknown>(`/api/v1/admin/users/${userId}/profile`);
      setProfilePreview(p);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "프로필 조회 실패");
    } finally {
      setProfileLoading(false);
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
              <div className="pt-3 border-t border-border">
                <button
                  onClick={openProfilePreview}
                  className="text-sm h-9 px-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  사용자 프로필 미리보기 →
                </button>
              </div>
            </section>

            {/* 통계 카드 */}
            {stats && (
              <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-semibold text-foreground">활동 통계</h3>

                {/* 색깔 + 프로필 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="색깔 타입">
                    {stats.colorType && COLOR_TYPE_META[stats.colorType] ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: COLOR_TYPE_META[stats.colorType].hex }}
                        />
                        <span className="text-sm font-medium">{COLOR_TYPE_META[stats.colorType].label}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">미분석</span>
                    )}
                  </StatCard>
                  <StatCard label="프로필 완성도" value={`${stats.profileCompletionRate}%`} />
                  <StatCard label="신뢰 점수" value={String(stats.trustScore)} />
                  <StatCard label="조회수" value={String(stats.viewCount)} />
                </div>

                {/* 매칭 활동 */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">매칭 활동</p>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard
                      label="보낸 요청"
                      value={`${stats.matchmaking.sentCompleted} / ${stats.matchmaking.sentTotal}`}
                      sub={`PENDING ${stats.matchmaking.sentPending}`}
                    />
                    <StatCard
                      label="받은 요청"
                      value={`${stats.matchmaking.receivedCompleted} / ${stats.matchmaking.receivedTotal}`}
                      sub={`PENDING ${stats.matchmaking.receivedPending}`}
                    />
                    <StatCard
                      label="주선 활동"
                      value={`${stats.matchmaking.matchmakerCompleted} / ${stats.matchmaking.matchmakerTotal}`}
                      sub="성공/전체"
                    />
                  </div>
                </div>

                {/* 친구 + AI */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="친구 (1촌)" value={String(stats.friendCount)} sub="명" />
                  <StatCard
                    label="AI 추천 노출"
                    value={String(stats.aiSignal.last30DaysExposures)}
                    sub="최근 30일"
                  />
                </div>
              </section>
            )}

            {/* 친구 목록 */}
            <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">친구 (1촌)</h3>
                <span className="text-xs text-muted-foreground">{friends?.length ?? 0}명</span>
              </div>
              {friends && friends.length === 0 && (
                <p className="text-sm text-muted-foreground">아직 친구가 없습니다.</p>
              )}
              {friends && friends.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="py-2 font-medium">닉네임</th>
                        <th className="py-2 font-medium">성별/나이</th>
                        <th className="py-2 font-medium">색깔</th>
                        <th className="py-2 font-medium">완성도</th>
                        <th className="py-2 font-medium">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {friends.map((f) => (
                        <tr key={f.userId}>
                          <td className="py-2">
                            <div className="font-medium text-foreground">{f.nickname}</div>
                            <div className="text-xs text-muted-foreground">{f.realName}</div>
                          </td>
                          <td className="py-2 text-muted-foreground tabular-nums">
                            {f.gender === "MALE" ? "남" : f.gender === "FEMALE" ? "여" : "?"} · {f.age}세
                          </td>
                          <td className="py-2">
                            {f.colorType && COLOR_TYPE_META[f.colorType] ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-3 h-3 rounded-full border border-border"
                                  style={{ backgroundColor: COLOR_TYPE_META[f.colorType].hex }}
                                />
                                <span className="text-xs">{COLOR_TYPE_META[f.colorType].label}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2 tabular-nums">{f.completionRate}%</td>
                          <td className="py-2">
                            {f.isDeleted ? (
                              <span className="text-xs text-muted-foreground">탈퇴</span>
                            ) : (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full border ${
                                  f.status === "ACTIVE"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : f.status === "SUSPENDED"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                                }`}
                              >
                                {f.status === "ACTIVE" ? "활성" : f.status === "SUSPENDED" ? "차단" : "휴면"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

        {/* 프로필 미리보기 modal */}
        {(profilePreview || profileLoading || profileError) && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setProfilePreview(null);
              setProfileError(null);
            }}
          >
            <div
              className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">프로필 미리보기 (운영자 전용)</h3>
                <button
                  onClick={() => {
                    setProfilePreview(null);
                    setProfileError(null);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  닫기 ✕
                </button>
              </div>
              <div className="p-5">
                {profileLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
                {profileError && <p className="text-sm text-destructive">{profileError}</p>}
                {profilePreview && !profileLoading && (
                  <pre className="text-xs bg-muted/40 rounded-lg p-3 overflow-auto whitespace-pre-wrap font-mono leading-relaxed text-foreground">
                    {JSON.stringify(profilePreview, null, 2)}
                  </pre>
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  사용자 노출 화면 그대로의 렌더링은 추후 PR — 현재는 raw JSON.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, children }: { label: string; value?: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children ?? (
        <p className="text-lg font-bold mt-1 text-foreground tabular-nums">{value ?? "—"}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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
