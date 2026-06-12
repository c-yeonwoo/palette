import { useState } from "react";
import { adminApi } from "../lib/adminApi";
import { UserSearchInput } from "./UserSearchInput";

/**
 * 유저 액션 히스토리 — 한 사용자의 결제·열람·매칭·출금·팁·운영자 충전을
 * 시간 역순 통합 타임라인. ADR 0010 확장.
 */
interface ActivityEvent {
  type: string;
  at: string;          // ISO 8601
  summary: string;
  counterpartUserId: string | null;
  amountPoints: number | null;
  amountWon?: number | null;
  meta: Record<string, string>;
}

interface UserActivityResponse {
  userId: string;
  nickname: string;
  realName: string;
  email: string | null;
  eventCount: number;
  truncated: boolean;
  events: ActivityEvent[];
}

interface Props {
  onBack: () => void;
}

/** 액션 종류 → 색·라벨 매핑. tone 그룹화로 시각 스캔 ↑ */
const TYPE_META: Record<string, { label: string; tone: string }> = {
  CARD_OPEN: { label: "프로필 열람", tone: "bg-slate-100 text-slate-700" },
  PAYMENT: { label: "결제", tone: "bg-emerald-100 text-emerald-800" },
  MATCH_REQUEST_CREATED: { label: "매칭 요청", tone: "bg-violet-100 text-violet-800" },
  MATCH_MATCHMAKER_APPROVED: { label: "주선자 승인", tone: "bg-violet-100 text-violet-800" },
  MATCH_MATCHMAKER_REJECTED: { label: "주선자 거절", tone: "bg-rose-100 text-rose-800" },
  MATCH_TARGET_ACCEPTED: { label: "수신자 수락", tone: "bg-green-100 text-green-800" },
  MATCH_TARGET_REJECTED: { label: "수신자 거절", tone: "bg-rose-100 text-rose-800" },
  WITHDRAWAL_REQUESTED: { label: "출금 신청", tone: "bg-amber-100 text-amber-900" },
  WITHDRAWAL_PROCESSED: { label: "출금 처리", tone: "bg-amber-100 text-amber-900" },
  TIP_SENT: { label: "팁 송신", tone: "bg-pink-100 text-pink-800" },
  TIP_RECEIVED: { label: "팁 수신", tone: "bg-pink-100 text-pink-800" },
  ADMIN_GRANT: { label: "운영자 충전", tone: "bg-blue-100 text-blue-800" },
};

export function AdminUserActivityScreen({ onBack }: Props) {
  const [userId, setUserId] = useState("");
  const [activity, setActivity] = useState<UserActivityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (uid: string) => {
    if (!uid) { setActivity(null); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<UserActivityResponse>(`/api/v1/admin/users/${uid}/activity?limit=300`);
      setActivity(res);
    } catch (e: unknown) {
      setError((e as Error).message || "조회 실패");
      setActivity(null);
    } finally {
      setLoading(false);
    }
  };

  // 날짜별 그룹화
  const grouped: Array<{ date: string; events: ActivityEvent[] }> = (() => {
    if (!activity) return [];
    const map = new Map<string, ActivityEvent[]>();
    activity.events.forEach((e) => {
      const d = new Date(e.at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const arr = map.get(key) || [];
      arr.push(e);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([date, events]) => ({ date, events }));
  })();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground">팔레트 운영자</p>
            <h1 className="text-lg font-bold text-foreground">유저 액션 히스토리</h1>
          </div>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="font-bold text-foreground">사용자 선택</h2>
          <p className="text-xs text-muted-foreground">
            이름·닉네임·이메일로 검색. 선택 시 해당 사용자의 모든 행동(결제·열람·매칭·출금·팁·운영자 충전)이 시간 역순 통합 표시됩니다.
          </p>
          <UserSearchInput
            value={userId}
            onChange={(uid) => { setUserId(uid); load(uid); }}
            placeholder="이름·닉네임·이메일 입력"
          />
        </section>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {loading && (
          <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">불러오는 중...</div>
        )}

        {activity && !loading && (
          <>
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-bold text-foreground">{activity.nickname}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.realName} · {activity.email ?? "이메일 없음"} ·
                    <span className="font-mono ml-1">{activity.userId.slice(0, 8)}…</span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  총 {activity.eventCount.toLocaleString()}건{activity.truncated && " (일부 잘림 — 더 보려면 limit 증가)"}
                </p>
              </div>
            </section>

            {activity.events.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">활동 없음</div>
            ) : (
              <section className="space-y-4">
                {grouped.map((group) => (
                  <div key={group.date} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">{group.date}</h3>
                      <span className="text-xs text-muted-foreground">{group.events.length}건</span>
                    </div>
                    <ul className="divide-y divide-border">
                      {group.events.map((e, idx) => (
                        <ActivityRow key={`${e.type}-${e.at}-${idx}`} event={e} />
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        {!activity && !loading && !userId && (
          <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            상단에서 사용자를 검색해 선택해주세요.
          </div>
        )}
      </main>
    </div>
  );
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const meta = TYPE_META[event.type] ?? { label: event.type, tone: "bg-slate-100 text-slate-700" };
  const time = new Date(event.at);
  const timeStr = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
  return (
    <li className="px-5 py-3 flex items-start gap-4">
      <span className="text-xs text-muted-foreground tabular-nums w-12 shrink-0 pt-1">{timeStr}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${meta.tone}`}>
            {meta.label}
          </span>
          <p className="text-sm text-foreground">{event.summary}</p>
          {event.amountPoints != null && (
            <span className={`text-xs font-bold tabular-nums ${event.amountPoints < 0 ? "text-rose-700" : "text-emerald-700"}`}>
              {event.amountPoints > 0 ? "+" : ""}{event.amountPoints.toLocaleString()} 물감
            </span>
          )}
          {event.amountWon != null && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {event.amountWon.toLocaleString()}원
            </span>
          )}
        </div>
        {event.counterpartUserId && (
          <p className="text-[11px] text-muted-foreground font-mono mt-1 truncate">
            상대: {event.counterpartUserId.slice(0, 8)}…
          </p>
        )}
      </div>
    </li>
  );
}
