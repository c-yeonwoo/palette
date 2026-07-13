import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../lib/adminApi";

interface UserBrief {
  userId: string;
  email: string | null;
  nickname: string;
}

interface RecommendationItem {
  id?: number;
  position: number;
  target: UserBrief;
  source: "AUTO" | "ADMIN_PIN" | "ADMIN_REPLACE";
  createdAt: string;
}

interface ViewerGroup {
  viewer: UserBrief;
  date: string;
  items: RecommendationItem[];
}

interface BlockedTargetItem {
  id: number;
  target: UserBrief;
  reason: string;
  createdAt: string;
  expiresAt: string | null;
}

interface UserSearchResult {
  userId: string;
  email: string | null;
  nickname: string;
  realName: string;
  gender: string;
  age: number;
}

interface Props {
  onBack: () => void;
  /** AdminMatchingScreen 안에 탭으로 임베드될 때 — 자체 header 생략 */
  embedded?: boolean;
}

const SOURCE_BADGE: Record<RecommendationItem["source"], { label: string; cls: string }> = {
  AUTO: { label: "자동", cls: "bg-muted text-muted-foreground border-border" },
  ADMIN_PIN: { label: "강제", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  ADMIN_REPLACE: { label: "교체", cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

function todayKST(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function AdminRecommendationsScreen({ onBack, embedded = false }: Props) {
  const [date, setDate] = useState<string>(todayKST());
  const [groups, setGroups] = useState<ViewerGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // 액션 modal 상태
  const [actionTarget, setActionTarget] = useState<{
    viewer: UserBrief;
    item: RecommendationItem;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<ViewerGroup[]>(`/api/v1/admin/recommendations?date=${date}`);
      setGroups(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredGroups = (groups ?? []).filter((g) => {
    if (!filter.trim()) return true;
    const needle = filter.trim().toLowerCase();
    return (
      g.viewer.nickname.toLowerCase().includes(needle) ||
      (g.viewer.email?.toLowerCase().includes(needle) ?? false) ||
      g.items.some(
        (i) =>
          i.target.nickname.toLowerCase().includes(needle) ||
          (i.target.email?.toLowerCase().includes(needle) ?? false),
      )
    );
  });

  const totalRecommendations = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);

  const Content = (
    <main className="max-w-6xl mx-auto px-6 py-6 space-y-4">
      <PalettePickMetricsPanel />
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-muted-foreground">날짜</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
          />
          <div className="flex gap-1">
            {[
              { label: "어제", days: -1 },
              { label: "오늘", days: 0 },
              { label: "내일", days: 1 },
            ].map(({ label, days }) => {
              const d = new Date();
              d.setUTCDate(d.getUTCDate() + days);
              const ds = d.toISOString().slice(0, 10);
              return (
                <button
                  key={label}
                  onClick={() => setDate(ds)}
                  className={`h-10 px-3 rounded-lg border text-sm ${
                    date === ds
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border text-muted-foreground hover:border-foreground/40"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <input
          type="text"
          placeholder="닉네임·이메일 필터"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 h-10 px-3 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
        />
        <span className="text-sm text-muted-foreground self-center">
          {filteredGroups.length}명 · {totalRecommendations}건
        </span>
      </div>

      {loading && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
          {error}
        </div>
      )}
      {!loading && !error && filteredGroups.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-foreground font-medium">아직 이 날짜의 추천이 없습니다.</p>
          <p className="text-xs text-muted-foreground mt-2">
            사용자가 AI 시그널 페이지를 처음 열면 자동으로 계산·저장됩니다.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredGroups.map((g) => (
          <div key={g.viewer.userId} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{g.viewer.nickname}</p>
                <p className="text-xs text-muted-foreground">{g.viewer.email ?? "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground">{g.items.length}건</span>
            </div>
            <div className="divide-y divide-border">
              {g.items.map((it) => (
                <div key={it.position} className="px-5 py-3 flex items-center gap-4">
                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                    {it.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{it.target.nickname}</p>
                    <p className="text-xs text-muted-foreground truncate">{it.target.email ?? "—"}</p>
                  </div>
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
                      SOURCE_BADGE[it.source].cls
                    }`}
                  >
                    {SOURCE_BADGE[it.source].label}
                  </span>
                  {it.id != null && (
                    <button
                      onClick={() => setActionTarget({ viewer: g.viewer, item: it })}
                      className="text-xs px-3 h-8 rounded-lg border border-border bg-card hover:bg-muted/50"
                    >
                      관리 →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {actionTarget && (
        <RecommendationActionModal
          viewer={actionTarget.viewer}
          item={actionTarget.item}
          onClose={() => setActionTarget(null)}
          onDone={() => {
            setActionTarget(null);
            load();
          }}
        />
      )}
    </main>
  );

  if (embedded) return Content;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
              ← 대시보드
            </button>
            <h1 className="text-lg font-bold text-foreground">AI 추천 이력</h1>
          </div>
        </div>
      </header>
      {Content}
    </div>
  );
}

// ── 팔레트픽 메트릭 패널 (CS-010) — 콜드스타트 공개 풀 관측 + 네트워크 밀도 ──────

interface SourceStat { source: string; count: number; share: number; opens: number; openRate: number }
interface PalettePickMetrics {
  windowDays: number;
  totalRecommendations: number;
  uniqueViewers?: number;
  bySource: SourceStat[];
  networkDensity: { acceptedEdges: number; totalUsers: number; avgFriendsPerUser: number };
}

const SOURCE_LABEL: Record<string, string> = {
  ACQUAINTANCE: "지인 네트워크",
  PUBLIC: "공개 발견 풀",
  UNTAGGED: "태그 이전",
};

function PalettePickMetricsPanel() {
  const [metrics, setMetrics] = useState<PalettePickMetrics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminApi
      .get<PalettePickMetrics>("/api/v1/admin/palette-pick/metrics?days=7")
      .then(setMetrics)
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!metrics) return <div className="h-24 rounded-xl bg-muted animate-pulse" />;

  const density = metrics.networkDensity;

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-foreground">팔레트픽 관측 · 최근 {metrics.windowDays}일</h2>
        <span className="text-xs text-muted-foreground">추천 {metrics.totalRecommendations}건 · 뷰어 {metrics.uniqueViewers ?? 0}명</span>
      </div>

      {/* 후보 출처 분해 — 콜드스타트 공개 풀이 실제로 추천을 태우고 있나 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {metrics.bySource.length === 0 ? (
          <p className="text-xs text-muted-foreground col-span-full">아직 태그된 추천이 없어요</p>
        ) : (
          metrics.bySource.map((s) => (
            <div key={s.source} className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">{SOURCE_LABEL[s.source] ?? s.source}</p>
              <p className="text-lg font-bold text-foreground">
                {s.count}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  ({Math.round(s.share * 100)}%)
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">오픈율 {Math.round(s.openRate * 100)}%</p>
            </div>
          ))
        )}
      </div>

      {/* 네트워크 밀도 — 지인 그래프가 densify 되고 있나 */}
      <div className="flex items-center gap-4 pt-1 border-t border-border/60 text-xs text-muted-foreground">
        <span>네트워크 밀도</span>
        <span className="font-semibold text-foreground">평균 친구 {density.avgFriendsPerUser}명/인</span>
        <span>· 연결 {density.acceptedEdges}쌍</span>
        <span>· 유저 {density.totalUsers}명</span>
      </div>
    </section>
  );
}

// ── 액션 modal — 카드 교체 / 차단 ────────────────────────────────────────────

function RecommendationActionModal({
  viewer,
  item,
  onClose,
  onDone,
}: {
  viewer: UserBrief;
  item: RecommendationItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"replace" | "block">("replace");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<UserSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const runSearch = async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // 기존 admin/users 검색 재사용
      const res = await adminApi.get<{ items: UserSearchResult[] }>(
        `/api/v1/admin/users?q=${encodeURIComponent(q.trim())}&size=10`,
      );
      setSearchResults(res.items.filter((u) => u.userId !== item.target.userId && u.userId !== viewer.userId));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => runSearch(search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const submit = async () => {
    if (!reason.trim()) {
      alert("사유는 필수입니다");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "replace") {
        if (!selectedTarget) {
          alert("교체할 사용자를 선택해주세요");
          setSubmitting(false);
          return;
        }
        await adminApi.patch(`/api/v1/admin/recommendations/${item.id}/replace`, {
          newTargetUserId: selectedTarget.userId,
          reason: reason.trim(),
        });
      } else {
        await adminApi.post(`/api/v1/admin/recommendations/blocks`, {
          viewerUserId: viewer.userId,
          targetUserId: item.target.userId,
          reason: reason.trim(),
        });
      }
      onDone();
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리 실패");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-foreground">추천 카드 관리</h3>
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            닫기 ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-sm bg-muted/40 rounded-lg p-3 space-y-1">
            <p className="text-xs text-muted-foreground">대상</p>
            <p className="text-foreground">
              <span className="font-medium">{viewer.nickname}</span> 의 카드 {item.position} —{" "}
              <span className="font-medium">{item.target.nickname}</span>
            </p>
          </div>

          {/* 액션 모드 */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setMode("replace")}
              className={`flex-1 h-10 rounded-lg border text-sm font-medium ${
                mode === "replace"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              교체 (다른 사람으로)
            </button>
            <button
              onClick={() => setMode("block")}
              className={`flex-1 h-10 rounded-lg border text-sm font-medium ${
                mode === "block"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border text-muted-foreground"
              }`}
            >
              차단 (앞으로 이 사람 추천 X)
            </button>
          </div>

          {/* 교체 모드: 사용자 검색 */}
          {mode === "replace" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">새 추천 대상</label>
              <input
                type="text"
                placeholder="닉네임·이메일·실명·전화 (2자 이상)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
              />
              {searching && <p className="text-xs text-muted-foreground">검색 중...</p>}
              {searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {searchResults.map((u) => (
                    <button
                      key={u.userId}
                      onClick={() => setSelectedTarget(u)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 ${
                        selectedTarget?.userId === u.userId ? "bg-muted" : ""
                      }`}
                    >
                      <div className="font-medium text-foreground">{u.nickname}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.email ?? "—"} · {u.gender === "MALE" ? "남" : "여"} · {u.age}세
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedTarget && (
                <p className="text-xs text-emerald-700">
                  선택됨: <strong>{selectedTarget.nickname}</strong>
                </p>
              )}
            </div>
          )}

          {/* 사유 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              사유 <span className="text-destructive">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                mode === "replace"
                  ? "예) 이 viewer 의 이상형에 더 맞는 사람으로 교체"
                  : "예) 이전에 분쟁 있었음 — 향후 추천 차단"
              }
              maxLength={500}
              className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-border">
            <button
              onClick={onClose}
              disabled={submitting}
              className="h-10 px-4 rounded-lg border border-border bg-card text-sm"
            >
              취소
            </button>
            <button
              onClick={submit}
              disabled={submitting || !reason.trim() || (mode === "replace" && !selectedTarget)}
              className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "적용 중..." : mode === "replace" ? "교체" : "차단"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
