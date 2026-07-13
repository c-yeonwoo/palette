import { useEffect, useState } from "react";
import type { AdminInfo } from "../lib/adminAuth";
import { adminAuth } from "../lib/adminAuth";
import { adminApi } from "../lib/adminApi";

/**
 * Admin 대시보드 — 운영 KPI + 카테고리별 메뉴.
 *
 * 상단: 핵심 메트릭 카드 (오늘 가입·매칭 성사·결제 매출·처리 대기 큐)
 * 본문: 4개 카테고리 (사용자 / 매칭 / 결제·정산 / T&S)
 */
interface Props {
  admin: AdminInfo;
  onNavigate: (to: string) => void;
}

interface MetricsBucket { today: number; last7d: number; total: number; }
interface MetricsResponse {
  users: MetricsBucket;
  matchRequests: MetricsBucket;
  matchSuccess: MetricsBucket;
  payments: MetricsBucket;
  revenue: MetricsBucket;
  queues: { pendingReports: number; holdWithdrawals: number };
  adminGrants: { today: number; total: number };
  trial?: {
    viewsTrialActive: number;
    halfPriceUsed: number;
    halfPriceUnused: number;
    freeIntroRemainingTotal: number;
    palettePickTrialActive: number;
  };
  blocks?: { total: number };
  activationFunnel?: { stage: string; label: string; count: number; convFromPrev: number }[];
  generatedAt: string;
}

export function AdminDashboardScreen({ admin, onNavigate }: Props) {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    adminApi.get<MetricsResponse>("/api/v1/admin/metrics")
      .then(setMetrics)
      .catch(() => { /* fail silent — 메트릭은 부가정보 */ })
      .finally(() => setLoadingMetrics(false));
  }, []);

  const logout = () => {
    adminAuth.clear();
    window.location.href = "/admin/login";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.18em] text-muted-foreground">팔레트 운영자</p>
            <h1 className="text-lg font-bold text-foreground">Admin Console</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{admin.nickname}</span>
            <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ── 핵심 KPI ── */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-bold text-foreground">오늘의 운영 현황</h2>
            {metrics && (
              <span className="text-[11px] text-muted-foreground">
                업데이트 {new Date(metrics.generatedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <MetricCard
              label="신규 가입"
              today={metrics?.users.today}
              total={metrics?.users.total}
              loading={loadingMetrics}
            />
            <MetricCard
              label="매칭 성사"
              today={metrics?.matchSuccess.today}
              last7d={metrics?.matchSuccess.last7d}
              total={metrics?.matchSuccess.total}
              loading={loadingMetrics}
            />
            <MetricCard
              label="결제"
              today={metrics?.payments.today}
              total={metrics?.payments.total}
              suffix={metrics ? ` (${(metrics.revenue.today / 10000).toFixed(1)}만원)` : undefined}
              loading={loadingMetrics}
            />
            <MetricCard
              label="처리 대기"
              today={metrics ? (metrics.queues.pendingReports + metrics.queues.holdWithdrawals) : undefined}
              note={metrics ? `신고 ${metrics.queues.pendingReports} · 출금 ${metrics.queues.holdWithdrawals}` : undefined}
              accent={metrics && (metrics.queues.pendingReports + metrics.queues.holdWithdrawals) > 0 ? "amber" : undefined}
              loading={loadingMetrics}
            />
            <MetricCard
              label="운영자 충전"
              today={metrics?.adminGrants.today}
              total={metrics?.adminGrants.total}
              note="수동 물감 지급 건수"
              loading={loadingMetrics}
            />
          </div>
        </section>

        {/* ── 카테고리 메뉴 ── */}
        {/* ── 카테고리 메뉴 (섹션별 톤으로 시각 구분) ── */}
        <CategorySection title="사용자" tone="slate">
          <MenuCard tone="rose" onClick={() => onNavigate("/admin/alerts")} title="운영 알림" desc="처리할 항목 모아보기 — 승인 대기·신고·출금" />
          <MenuCard tone="slate" onClick={() => onNavigate("/admin/approvals")} title="승인 대기" desc="가입자 프로필 검토 후 승인·반려" />
          <MenuCard tone="slate" onClick={() => onNavigate("/admin/users")} title="회원 관리" desc="목록·검색·차단·휴면" />
          <MenuCard tone="slate" onClick={() => onNavigate("/admin/activity")} title="유저 액션 히스토리" desc="결제·열람·매칭·출금·팁·운영자 충전 통합 타임라인" />
        </CategorySection>

        <CategorySection title="매칭·추천" tone="violet">
          <MenuCard tone="violet" onClick={() => onNavigate("/admin/matching")} title="매칭 관리" desc="AI 매칭 (교체·차단) · 주선자 풀" />
          <MenuCard tone="violet" onClick={() => onNavigate("/admin/flow")} title="소개 요청 플로우" desc="날짜별 요청 → 주선자 → 수신자 단계별 모니터링" />
        </CategorySection>

        <CategorySection title="결제·정산" tone="emerald">
          <MenuCard tone="emerald" onClick={() => onNavigate("/admin/billing")} title="물감 충전" desc="사용자 수동 충전 (보상·환불·이벤트) · 이력" />
          <MenuCard tone="emerald" onClick={() => onNavigate("/admin/transactions")} title="결제 트랜잭션" desc="Toss / IAP / 영수증 조회" />
          <MenuCard tone="emerald" onClick={() => onNavigate("/admin/tips")} title="팁 트랜잭션" desc="외부송금 가드 모니터링 · 90/10 분배 이력" />
        </CategorySection>

        <CategorySection title="Trust & Safety" tone="rose">
          <MenuCard
            tone="rose"
            onClick={() => onNavigate("/admin/reports")}
            title="신고 큐"
            desc="허위·괴롭힘·외부 송금 유도 (§6) 신고 검토"
            badge={metrics?.queues.pendingReports}
          />
          <MenuCard
            tone="rose"
            onClick={() => onNavigate("/admin/withdrawals")}
            title="출금 HOLD"
            desc="holding 기간 중 의심 거래 거절"
            badge={metrics?.queues.holdWithdrawals}
          />
          <MenuCard
            tone="rose"
            onClick={() => onNavigate("/admin/blocks")}
            title="차단 관계"
            desc="유저간 차단 조회·강제 해제"
          />
        </CategorySection>

        <CategorySection title="운영 인프라" tone="sky">
          <MenuCard
            tone="sky"
            onClick={() => onNavigate("/admin/llm")}
            title="LLM 사용"
            desc="호출·비용·캐시 hit률 추적 (ADR 0047)"
          />
          <MenuCard
            tone="sky"
            onClick={() => onNavigate("/admin/interview-questions")}
            title="AI 인터뷰 질문"
            desc="질문 선별·추가·수정·순서·노출 관리 (ADR 0055)"
          />
          <MenuCard
            tone="sky"
            onClick={() => onNavigate("/admin/field-options")}
            title="온보딩 칩 옵션"
            desc="체형·관심사·성격·가치 등 칩 선택지 관리 (ADR 0057)"
          />
          <MenuCard
            tone="sky"
            onClick={() => onNavigate("/admin/onboarding-fields")}
            title="온보딩 필드"
            desc="가입 질문·섹션·순서·라벨·위젯·필수 여부 관리 (ADR 0058)"
          />
        </CategorySection>

        {/* 트라이얼 현황 (ADR 0045) — KPI 라기보다 인사이트라 별도 섹션 */}
        {metrics?.trial && (
          <section>
            <h3 className="text-sm font-bold text-foreground mb-2.5">트라이얼 현황 (ADR 0045)</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard label="열람 트라이얼 활성" today={metrics.trial.viewsTrialActive} note="3일 + 일 5명" loading={false} />
              <MetricCard label="반값 묶음 미사용" today={metrics.trial.halfPriceUnused} note={`사용 완료 ${metrics.trial.halfPriceUsed}`} loading={false} />
              <MetricCard label="무료 소개 잔여" today={metrics.trial.freeIntroRemainingTotal} note="총 누적 카운터" loading={false} />
              <MetricCard label="팔레트픽 트라이얼" today={metrics.trial.palettePickTrialActive} note="첫 30일 무료 활성" loading={false} />
              <MetricCard label="누적 차단 관계" today={metrics.blocks?.total} note="유저간 (단방향)" loading={false} />
            </div>
          </section>
        )}

        {metrics?.activationFunnel && metrics.activationFunnel.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-foreground mb-1">활성화 퍼널 (누적)</h3>
            <p className="text-xs text-muted-foreground mb-2.5">가입 → 색 완성 → 팔레트픽 열람 → 소개 요청 → 성사. 단계별 <strong>누적 유니크 유저 수</strong>(엄격한 순차 코호트 아님 — 소개 요청은 지인 피드에서도 발생해 직전比 100% 초과 가능). 웨지가 어디서 새는지 관측.</p>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {metrics.activationFunnel.map((s, i) => {
                const top = metrics.activationFunnel![0].count || 1;
                const widthPct = Math.max(4, Math.round((s.count / top) * 100));
                return (
                  <div key={s.stage} className="px-4 py-3">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-sm font-medium text-foreground">{i + 1}. {s.label}</span>
                      <span className="text-sm">
                        <span className="font-bold text-foreground">{s.count.toLocaleString()}</span>
                        {i > 0 && (
                          <span className={`ml-2 text-xs ${s.convFromPrev < 0.3 ? "text-rose-500" : "text-muted-foreground"}`}>
                            직전比 {Math.round(s.convFromPrev * 100)}%
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function MetricCard({
  label, today, last7d, total, suffix, note, accent, loading,
}: {
  label: string;
  today?: number;
  last7d?: number;
  total?: number;
  suffix?: string;
  note?: string;
  accent?: "amber";
  loading: boolean;
}) {
  const bg = accent === "amber" ? "bg-amber-50 border-amber-200" : "bg-card border-border";
  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      {loading ? (
        <p className="text-2xl font-bold text-muted-foreground/40">…</p>
      ) : (
        <>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {today != null ? today.toLocaleString() : "—"}
            {suffix && <span className="text-xs font-medium text-muted-foreground">{suffix}</span>}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {note ? note : (
              <>
                7일 {last7d != null ? last7d.toLocaleString() : "—"} · 누적 {total != null ? total.toLocaleString() : "—"}
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}

/**
 * 카테고리 톤 — 흰색 일색 → 섹션별 시각 구분.
 * slate(중립·사용자) · violet(브랜드결·매칭) · emerald(돈·결제) · rose(경고·안전) · sky(시스템).
 * Tailwind utility 만 사용 (raw hex 금지 — CONVENTIONS).
 */
type AdminTone = "slate" | "violet" | "emerald" | "rose" | "sky";

const TONE_CARD: Record<AdminTone, string> = {
  slate: "bg-slate-50 border-slate-200 hover:border-slate-400 hover:bg-slate-100",
  violet: "bg-violet-50 border-violet-200 hover:border-violet-400 hover:bg-violet-100",
  emerald: "bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-100",
  rose: "bg-rose-50 border-rose-200 hover:border-rose-400 hover:bg-rose-100",
  sky: "bg-sky-50 border-sky-200 hover:border-sky-400 hover:bg-sky-100",
};

const TONE_DOT: Record<AdminTone, string> = {
  slate: "bg-slate-400",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

const TONE_ARROW: Record<AdminTone, string> = {
  slate: "text-slate-500",
  violet: "text-violet-600",
  emerald: "text-emerald-600",
  rose: "text-rose-600",
  sky: "text-sky-600",
};

function CategorySection({
  title, tone, children,
}: {
  title: string;
  tone?: AdminTone;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-bold text-foreground mb-2.5 flex items-center gap-2">
        {tone && <span className={`inline-block w-1.5 h-4 rounded-full ${TONE_DOT[tone]}`} />}
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {children}
      </div>
    </section>
  );
}

function MenuCard({
  onClick, title, desc, badge, tone,
}: {
  onClick: () => void;
  title: string;
  desc: string;
  badge?: number;
  tone?: AdminTone;
}) {
  const toneCls = tone ? TONE_CARD[tone] : "bg-card border-border hover:border-foreground/40";
  const arrowCls = tone ? TONE_ARROW[tone] : "text-foreground/40";
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-2xl border p-5 transition-colors relative ${toneCls}`}
    >
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
      <p className={`text-2xl font-bold mt-3 ${arrowCls}`}>→</p>
      {badge != null && badge > 0 && (
        <span className="absolute top-3 right-3 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}
