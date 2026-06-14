import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

interface AlertItem { id: string; label: string; sublabel: string | null; at: string | null }
interface Alert { key: string; title: string; count: number; route: string; items: AlertItem[] }
interface AlertsResponse { totalActionable: number; alerts: Alert[] }

/**
 * 운영 알림 인박스 — 처리해야 할 항목(승인 대기·미처리 신고·보류 출금)을 한 곳에 모아 보여준다.
 * 그룹 클릭 시 해당 관리 화면으로 이동. 데이터는 GET /api/v1/admin/alerts (기존 데이터 집계).
 */
export function AdminAlertsScreen({ onBack, onNavigate }: { onBack: () => void; onNavigate: (to: string) => void }) {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.get<AlertsResponse>("/api/v1/admin/alerts"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
          <h1 className="text-lg font-bold text-foreground">운영 알림</h1>
          <button onClick={load} className="text-sm text-muted-foreground hover:text-foreground">새로고침</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {data && !loading && (
          <>
            <p className="text-sm text-muted-foreground">
              {data.totalActionable > 0
                ? <>처리해야 할 항목이 <strong className="text-foreground">{data.totalActionable}건</strong> 있어요.</>
                : "처리할 항목이 없어요 ✅"}
            </p>

            {data.alerts.map((a) => {
              const active = a.count > 0;
              return (
                <button
                  key={a.key}
                  onClick={() => onNavigate(a.route)}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                    active ? "border-border bg-card hover:bg-muted/40" : "border-border/50 bg-muted/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{a.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        active ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {a.count}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">{active ? "처리하기 →" : "없음"}</span>
                  </div>

                  {a.items.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {a.items.map((it) => (
                        <li key={it.id} className="flex items-center justify-between text-sm">
                          <span className="text-foreground truncate">{it.label}</span>
                          {it.sublabel && <span className="text-xs text-muted-foreground shrink-0 ml-2">{it.sublabel}</span>}
                        </li>
                      ))}
                      {a.count > a.items.length && (
                        <li className="text-xs text-muted-foreground">외 {a.count - a.items.length}건 더…</li>
                      )}
                    </ul>
                  )}
                </button>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
