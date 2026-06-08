/**
 * BillingScreen — 티켓 잔액 + 묶음 충전 (B-004).
 *
 * 베타: 결제 미연동 — "충전" 버튼은 안내 토스트만.
 * 정식 결제 활성화 시: Toss(웹·Android) / IAP(iOS) 분기.
 *
 * SoT: 백엔드 GET /api/v1/billing/balance + /bundles.
 */
import { useEffect, useState } from "react";
import { ArrowLeft, Ticket, Gift, MailPlus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/apiClient";

interface BillingScreenProps {
  onBack: () => void;
}

interface BalanceResponse {
  viewTickets: number;
  introRequestTickets: number;
  bonusViewTickets: number;
  bonusIntroRequestTickets: number;
  bonusExpiresAt: string | null;
}

interface BundleDto {
  kind: "VIEW" | "INTRO_REQUEST";
  quantity: number;
  priceWon: number;
  discountPercent: number;
}

interface BundleCatalog {
  view: BundleDto[];
  introRequest: BundleDto[];
}

function formatWon(won: number): string {
  return won.toLocaleString("ko-KR") + "원";
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / 86_400_000);
}

export function BillingScreen({ onBack }: BillingScreenProps) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [bundles, setBundles] = useState<BundleCatalog | null>(null);
  const [tab, setTab] = useState<"VIEW" | "INTRO_REQUEST">("VIEW");

  useEffect(() => {
    Promise.all([
      api.get<BalanceResponse>("/api/v1/billing/balance"),
      api.get<BundleCatalog>("/api/v1/billing/bundles"),
    ])
      .then(([b, c]) => { setBalance(b); setBundles(c); })
      .catch(() => toast.error("잔액 정보를 불러오지 못했어요"));
  }, []);

  const handlePurchase = (b: BundleDto) => {
    toast.info(`결제는 정식 출시 후 지원될 예정이에요 (${b.quantity}장 ${formatWon(b.priceWon)})`);
  };

  const bonusDays = daysUntil(balance?.bonusExpiresAt ?? null);
  const hasBonus = (balance?.bonusViewTickets ?? 0) + (balance?.bonusIntroRequestTickets ?? 0) > 0;

  const items = tab === "VIEW" ? bundles?.view ?? [] : bundles?.introRequest ?? [];
  const tabKindIcon = tab === "VIEW" ? Ticket : MailPlus;
  const tabLabel = tab === "VIEW" ? "프로필 열람 티켓" : "소개 요청 티켓";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="뒤로"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">티켓 충전</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {/* 잔액 카드 */}
        <section className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-4">
          <div className="text-xs font-medium text-muted-foreground">현재 잔액</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Ticket className="w-3.5 h-3.5" />
                <span className="text-[11px]">프로필 열람</span>
              </div>
              <div className="text-xl font-bold tabular-nums">{balance?.viewTickets ?? "-"}</div>
              {(balance?.bonusViewTickets ?? 0) > 0 && (
                <div className="text-[10px] text-primary">보너스 {balance!.bonusViewTickets}장 포함</div>
              )}
            </div>
            <div className="rounded-xl bg-muted/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MailPlus className="w-3.5 h-3.5" />
                <span className="text-[11px]">소개 요청</span>
              </div>
              <div className="text-xl font-bold tabular-nums">{balance?.introRequestTickets ?? "-"}</div>
              {(balance?.bonusIntroRequestTickets ?? 0) > 0 && (
                <div className="text-[10px] text-primary">보너스 {balance!.bonusIntroRequestTickets}장 포함</div>
              )}
            </div>
          </div>
          {hasBonus && bonusDays !== null && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-soft/40 text-xs">
              <Gift className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-foreground">
                보너스 만료까지 <strong className="text-primary">{bonusDays}일</strong> 남았어요 — 먼저 사용하세요
              </span>
            </div>
          )}
        </section>

        {/* 탭 */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("VIEW")}
            className={
              "flex-1 h-10 rounded-full text-sm font-medium transition-colors " +
              (tab === "VIEW"
                ? "bg-foreground text-background"
                : "bg-card border border-border text-muted-foreground hover:text-foreground")
            }
          >
            프로필 열람
          </button>
          <button
            onClick={() => setTab("INTRO_REQUEST")}
            className={
              "flex-1 h-10 rounded-full text-sm font-medium transition-colors " +
              (tab === "INTRO_REQUEST"
                ? "bg-foreground text-background"
                : "bg-card border border-border text-muted-foreground hover:text-foreground")
            }
          >
            소개 요청
          </button>
        </div>

        {/* 묶음 카드 */}
        <section className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            {(() => { const Icon = tabKindIcon; return <Icon className="w-4 h-4 text-muted-foreground" />; })()}
            <h2 className="text-sm font-semibold">{tabLabel}</h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {items.map((b) => {
              const isBest = b.quantity === 5;     // 5장에 best value 배지
              const isPopular = b.quantity === 10;  // 10장에 popular 배지 (가장 큰 할인)
              return (
                <button
                  key={b.quantity}
                  type="button"
                  onClick={() => handlePurchase(b)}
                  className={
                    "relative flex items-center justify-between p-4 rounded-2xl border transition-all " +
                    (isBest
                      ? "border-primary/50 bg-brand-soft/30 shadow-card hover:border-primary"
                      : "border-border bg-card hover:border-foreground/20")
                  }
                >
                  {isBest && (
                    <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      BEST VALUE
                    </span>
                  )}
                  {isPopular && (
                    <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-foreground text-background text-[10px] font-semibold">
                      MAX 할인
                    </span>
                  )}
                  <div className="flex items-center gap-3 text-left">
                    <div className={
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 " +
                      (isBest ? "bg-primary/15" : "bg-muted")
                    }>
                      {tab === "VIEW"
                        ? <Ticket className={"w-5 h-5 " + (isBest ? "text-primary" : "text-muted-foreground")} />
                        : <MailPlus className={"w-5 h-5 " + (isBest ? "text-primary" : "text-muted-foreground")} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-bold">{b.quantity}장</div>
                      {b.discountPercent > 0 && (
                        <div className="text-[11px] text-primary font-medium">{b.discountPercent}% 할인</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums">{formatWon(b.priceWon)}</div>
                    {b.quantity > 1 && (
                      <div className="text-[11px] text-muted-foreground">
                        장당 {formatWon(Math.round(b.priceWon / b.quantity))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 베타 안내 */}
        <div className="rounded-xl bg-muted/40 border border-border p-4 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground mb-1">베타 기간 모든 기능 무료</p>
            <p>정식 출시 후에도 가입 시 7일 체험권 + 친구 가입마다 보너스 티켓을 받을 수 있어요.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
