/**
 * MatchSuccessModal — F13 양방향 매칭 성사 모달
 * "메시지 시작 — 매칭권 1개" CTA
 */
import { Heart } from "lucide-react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import type { MatchDetail } from "../../../types/match";
import { getColorTypeMeta } from "../../../lib/colorTypes";

interface MatchSuccessModalProps {
  open: boolean;
  match: MatchDetail;
  ticketBalance: number;
  onStartChat: () => void;        // 매칭권 소비 후 채팅
  onPaywall: () => void;          // 매칭권 부족 시 페이월
  onClose: () => void;
}

export function MatchSuccessModal({
  open,
  match,
  ticketBalance,
  onStartChat,
  onPaywall,
  onClose,
}: MatchSuccessModalProps) {
  const my    = getColorTypeMeta(match.me.colorType);
  const their = getColorTypeMeta(match.partner.colorType);

  const handleChat = () => {
    if (ticketBalance < 1) { onPaywall(); return; }
    onStartChat();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm mx-auto text-center p-8">
        {/* 두 원형 겹치기 */}
        <div className="flex justify-center mb-5">
          <div className="relative w-20 h-12">
            <div
              className="absolute left-0 w-12 h-12 rounded-full border-4 border-background shadow-card"
              style={{ backgroundColor: `hsl(${my.h} ${my.s}% ${my.l}%)` }}
            />
            <div
              className="absolute right-0 w-12 h-12 rounded-full border-4 border-background shadow-card"
              style={{ backgroundColor: `hsl(${their.h} ${their.s}% ${their.l}%)` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="w-4 h-4 text-brand fill-brand z-10" />
            </div>
          </div>
        </div>

        <h2 className="text-display font-bold text-text-primary mb-1">매칭 성사! 🎉</h2>
        <p className="text-body-sm text-text-secondary mb-6">
          {match.partner.name}님도 좋아요를 보냈어요.
          <br />지금 바로 대화를 시작해보세요!
        </p>

        <div className="space-y-2">
          <Button variant="brand" size="lg" className="w-full" onClick={handleChat}>
            메시지 시작하기
            <span className="text-brand-foreground/70 text-caption ml-1.5">
              (매칭권 1개)
            </span>
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={onClose}>
            나중에 하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
