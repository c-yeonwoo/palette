/**
 * MatchActionBar — F01 sticky bottom 액션바
 * [관심 없음] [좋아요] + safe-area
 */
import { useState } from "react";
import { Heart, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { DisinterestSheet } from "./DisinterestSheet";
import { cn } from "../ui/utils";

// 간단한 CSS confetti (canvas-confetti 없이)
function triggerConfetti() {
  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;";
  document.body.appendChild(container);

  const colors = ["#FF6B35", "#4A9EFF", "#FF4A6B", "#35D17A", "#A78BFA"];
  for (let i = 0; i < 50; i++) {
    const dot = document.createElement("div");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 6 + Math.random() * 8;
    const x = Math.random() * 100;
    const delay = Math.random() * 0.5;
    dot.style.cssText = `
      position:absolute;top:-10px;left:${x}%;
      width:${size}px;height:${size}px;
      background:${color};border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      animation:confetti-fall 1.5s ease-in ${delay}s forwards;
    `;
    container.appendChild(dot);
  }

  if (!document.querySelector("#confetti-style")) {
    const style = document.createElement("style");
    style.id = "confetti-style";
    style.textContent = `
      @keyframes confetti-fall {
        0%   { transform: translateY(0) rotate(0); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => document.body.removeChild(container), 2500);
}

interface MatchActionBarProps {
  matchmakerName: string;
  status: "pending" | "liked" | "passed" | "mutual";
  onLike: () => void;
  onPass: (reason: string, detail?: string) => void;
  /** 매칭권 부족 시 호출 (F13 paywall) */
  onTicketRequired?: () => void;
  hasTicket?: boolean;
  className?: string;
}

export function MatchActionBar({
  matchmakerName,
  status,
  onLike,
  onPass,
  onTicketRequired,
  hasTicket = true,
  className,
}: MatchActionBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [liked, setLiked] = useState(status === "liked" || status === "mutual");

  const handleLike = () => {
    if (liked) return;

    if (!hasTicket && onTicketRequired) {
      onTicketRequired();
      return;
    }

    setLiked(true);
    triggerConfetti();
    onLike();
    toast.success(`${matchmakerName} 주선자에게 전달됐어요`, {
      description: "상대방도 좋아요를 보내면 매칭이 성사돼요!",
    });
  };

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40",
          className,
        )}
        style={{
          background: "hsl(var(--surface) / 0.96)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 -1px 0 hsl(0 0% 0% / 0.06), 0 -4px 16px hsl(0 0% 0% / 0.04)",
          paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
        }}
      >
        <div className="flex gap-3 px-6 pt-3 pb-1 max-w-2xl mx-auto">
          {/* 관심 없음 */}
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2"
            onClick={() => setSheetOpen(true)}
            disabled={status === "passed" || liked}
          >
            <X className="w-4 h-4" />
            관심 없음
          </Button>

          {/* 좋아요 */}
          <Button
            variant="brand"
            size="lg"
            className="flex-1 gap-2"
            onClick={handleLike}
            disabled={liked}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
            {liked ? "좋아요 전송됨" : "좋아요"}
          </Button>
        </div>
      </div>

      <DisinterestSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={(reason, detail) => {
          onPass(reason, detail);
          toast.info("피드백 감사해요", {
            description: "더 잘 맞는 분을 소개해 드릴게요.",
          });
        }}
      />
    </>
  );
}
