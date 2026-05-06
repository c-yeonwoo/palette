/**
 * PaywallSheet — F13 매칭권 부족 시 바텀시트
 * 압박 금지 디자인: "조금만 더 하면 돼요" + 무료 적립 경로 3개 + 결제 1개
 */
import { Gift, UserPlus, Star, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { FREE_EARN_PATHS, type EarnTrigger } from "../../../lib/tickets";

const PATH_ICONS: Record<EarnTrigger, React.ElementType> = {
  signup_bonus:     Gift,
  friend_invite:    UserPlus,
  manner_review:    Star,
  profile_complete: Star,
  daily_attend:     Calendar,
  purchase:         Gift,
};

interface PaywallSheetProps {
  open: boolean;
  onClose: () => void;
  balance: number;
  onEarn?: (trigger: EarnTrigger) => void;
  onPurchase?: () => void;
}

export function PaywallSheet({ open, onClose, balance, onEarn, onPurchase }: PaywallSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0">
        <SheetHeader className="px-6 pt-2 pb-4 border-b border-border-subtle">
          <SheetTitle className="text-body font-semibold text-text-primary text-left">
            매칭권이 부족해요
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 py-5 space-y-4">
          {/* 현재 잔액 */}
          <div className="bg-surface-sunken rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-body-sm text-text-secondary">현재 매칭권</span>
            <span className="text-title font-bold text-text-primary">{balance}개</span>
          </div>

          {/* 무료 적립 경로 */}
          <div>
            <p className="text-body-sm font-semibold text-text-primary mb-2.5">
              조금만 더 하면 무료로 받을 수 있어요
            </p>
            <div className="space-y-2">
              {FREE_EARN_PATHS.map((path) => {
                const Icon = PATH_ICONS[path.trigger];
                return (
                  <button
                    key={path.trigger}
                    onClick={() => { onEarn?.(path.trigger); onClose(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-surface shadow-hairline hover:shadow-soft transition-shadow text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-soft flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-text-primary">{path.label}</p>
                    </div>
                    <span className="text-body-sm font-bold text-brand flex-shrink-0">
                      {path.reward}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-caption text-text-tertiary">또는</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          {/* 결제 옵션 */}
          <div className="space-y-2">
            <Button
              variant="brand"
              size="lg"
              className="w-full"
              onClick={() => { onPurchase?.(); onClose(); }}
            >
              매칭권 충전하기
            </Button>
            <p className="text-caption text-text-tertiary text-center">
              1매 9,900원 · 5매 39,000원 · 환불 보장
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
