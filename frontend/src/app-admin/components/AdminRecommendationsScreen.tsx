import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../lib/adminApi";

interface UserBrief {
  userId: string;
  email: string | null;
  nickname: string;
}

interface RecommendationItem {
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

interface Props {
  onBack: () => void;
}

const SOURCE_BADGE: Record<RecommendationItem["source"], { label: string; cls: string }> = {
  AUTO: { label: "자동", cls: "bg-muted text-muted-foreground border-border" },
  ADMIN_PIN: { label: "강제", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  ADMIN_REPLACE: { label: "교체", cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

function todayKST(): string {
  // Asia/Seoul 기준 YYYY-MM-DD
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function AdminRecommendationsScreen({ onBack }: Props) {
  const [date, setDate] = useState<string>(todayKST());
  const [groups, setGroups] = useState<ViewerGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
              ← 대시보드
            </button>
            <h1 className="text-lg font-bold text-foreground">매칭 관리 · AI 추천 이력</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            {filteredGroups.length}명에게 {totalRecommendations}건 노출
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-4">
        {/* 필터 */}
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
        </div>

        {/* 안내 */}
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
          이 화면은 <strong>조회 전용</strong>입니다. 운영자가 직접 변경 / 강제 추천 / 카드 교체는 다음 PR (#9) 에서
          추가됩니다. 현재는 자동 계산 결과가 매 요청마다 저장됩니다 — 같은 사용자가 60일 이내 다시 추천되지 않습니다.
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

        {/* viewer 별 그룹 */}
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
