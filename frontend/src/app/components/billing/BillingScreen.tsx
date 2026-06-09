/**
 * BillingScreen — 단일 잔액 충전 (ADR 0042 / PA-021).
 *
 * 모델:
 *  · 잔액 (P) 한 숫자만 표시 — 모든 사용처 공통 차감
 *  · 충전 시 "보너스 +N P" 강조 (별풍선·카카오톡 초코 메탈 모델)
 *  · 베타: VITE_TOSS_CLIENT_KEY 미설정 시 안내 토스트만, 키 있으면 위젯 호출
 *
 * 1P = 10원. 가격은 P 로 표시, 결제 시점에만 원화 노출.
 */
import { useEffect, useState } from "react";
import { ArrowLeft, Gift, Sparkles, Coins, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/apiClient";
import { isPaymentEnabled, requestTossPayment } from "@/lib/billing/tossPayment";
import { authService } from "@/lib/auth/authService";

interface BillingScreenProps {
  onBack: () => void;
}

interface BalanceResponse {
  points: number;
  bonusPoints: number;
  bonusExpiresAt: string | null;
}

interface BundleDto {
  pointsCredited: number;
  priceWon: number;
  bonusPercent: number;
}

interface BundleCatalog {
  bundles: BundleDto[];
}

function formatWon(won: number): string {
  return won.toLocaleString("ko-KR") + "원";
}

function formatP(points: number): string {
  return points.toLocaleString("ko-KR") + "P";
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return diff <= 0 ? 0 : Math.ceil(diff / 86_400_000);
}

const PRICE_HINT: Array<{ label: string; cost: string }> = [
  { label: "친구의 친구 프로필 열람", cost: "100P" },
  { label: "한 다리 더 건너", cost: "200P" },
  { label: "소개 요청 보내기", cost: "300P" },
  { label: "성의 표시 (선택)", cost: "100~1,000P" },
];

export function BillingScreen({ onBack }: BillingScreenProps) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [bundles, setBundles] = useState<BundleDto[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<BalanceResponse>("/api/v1/billing/balance"),
      api.get<BundleCatalog>("/api/v1/billing/bundles"),
    ])
      .then(([b, c]) => { setBalance(b); setBundles(c.bundles); })
      .catch(() => toast.error("잔액 정보를 불러오지 못했어요"));
  }, []);

  const handlePurchase = async (b: BundleDto) => {
    if (!isPaymentEnabled()) {
      toast.info(`결제는 정식 출시 후 지원돼요 (${formatP(b.pointsCredited)} / ${formatWon(b.priceWon)})`);
      return;
    }
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user?.userId) {
        toast.error("사용자 정보를 불러오지 못했어요");
        return;
      }
      await requestTossPayment(
        {
          // SDK 의 OrderRequest 와 호환 — 이제 kind/quantity 대신 단일 묶음
          kind: "VIEW" as const,            // legacy 필드, payment-success 에서 무시
          quantity: b.pointsCredited,        // legacy 필드 재활용 — 적립 P
          amount: b.priceWon,
        },
        user.userId,
      );
    } catch (e: any) {
      const code = e?.code as string | undefined;
      if (code === "PAY_PROCESS_CANCELED" || code === "USER_CANCEL") {
        // 침묵
      } else {
        console.error("[Toss] 결제 호출 실패", e);
        toast.error(e?.message ?? "결제를 시작하지 못했어요");
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const bonusDays = daysUntil(balance?.bonusExpiresAt ?? null);
  const hasBonus = (balance?.bonusPoints ?? 0) > 0;

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
          <h1 className="text-base font-semibold">잔액 · 충전</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {/* 잔액 큰 카드 */}
        <section className="bg-gradient-to-br from-brand-soft to-brand-soft/40 rounded-2xl border border-primary/20 shadow-card p-6 space-y-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Coins className="w-4 h-4" />
            <span className="text-xs font-medium">내 잔액</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {balance ? formatP(balance.points) : "-"}
            </span>
            {balance && (
              <span className="text-xs text-muted-foreground">
                ≈ {formatWon(balance.points * 10)}
              </span>
            )}
          </div>
          {hasBonus && bonusDays !== null && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-card border border-primary/20 text-xs">
              <Gift className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-foreground">
                보너스 <strong className="text-primary">{formatP(balance!.bonusPoints)}</strong> 포함 · 만료 <strong className="text-primary">{bonusDays}일</strong> 남음
              </span>
            </div>
          )}
        </section>

        {/* 사용처 안내 */}
        <section className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">잔액 사용처</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {PRICE_HINT.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-semibold text-foreground tabular-nums">{p.cost}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 충전 묶음 */}
        <section className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">충전하기</h2>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {bundles.map((b, i) => {
              const isBest = i === bundles.length - 2;   // 3,400P (best value)
              const isMax = i === bundles.length - 1;    // 5,750P (max bonus)
              return (
                <button
                  key={i}
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
                  {isMax && (
                    <span className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-foreground text-background text-[10px] font-semibold">
                      MAX 보너스
                    </span>
                  )}
                  <div className="flex items-center gap-3 text-left">
                    <div className={
                      "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 " +
                      (isBest ? "bg-primary/15" : "bg-muted")
                    }>
                      <Coins className={"w-5 h-5 " + (isBest ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold tabular-nums">{formatP(b.pointsCredited)}</span>
                        {b.bonusPercent > 0 && (
                          <span className="text-[11px] font-semibold text-primary">+{b.bonusPercent}%</span>
                        )}
                      </div>
                      {b.bonusPercent > 0 && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          정가 {formatP(b.priceWon / 10)} + 보너스 {formatP(b.pointsCredited - b.priceWon / 10)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold tabular-nums">{formatWon(b.priceWon)}</div>
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
            <p>가입 시 300P 환영 보너스 + 친구 가입할 때마다 양쪽 100P 보너스로 부담 없이 시작.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
