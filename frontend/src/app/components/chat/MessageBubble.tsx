/**
 * MessageBubble — F02 메시지 버블
 * 발신자별 좌/우 정렬 + 채널 라벨 칩 + 컬러 타입 점
 */
import { Lock } from "lucide-react";
import type { Message } from "../../../data/mock-conversations";
import { getChannelLabel } from "../../../lib/conversation-visibility";
import { cn } from "../ui/utils";

interface MessageBubbleProps {
  message: Message;
  /** 현재 뷰어의 senderId와 일치하면 우측 정렬 */
  viewerSenderId: string;
  /** 발신자 컬러타입 (점 표시용) */
  senderColorHex?: string;
  className?: string;
}

export function MessageBubble({ message, viewerSenderId, senderColorHex, className }: MessageBubbleProps) {
  const isMine = message.senderId === viewerSenderId;
  const isPrivate = message.channel !== "public";

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isMine ? "flex-row-reverse" : "flex-row",
        className,
      )}
    >
      {/* 아바타 점 */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 border-2 border-background shadow-soft"
        style={{
          backgroundColor: senderColorHex ?? "hsl(var(--neutral-300))",
        }}
        aria-label={message.senderName}
      />

      <div className={cn("max-w-[72%] space-y-1", isMine ? "items-end" : "items-start")}>
        {/* 발신자 이름 + 시간 */}
        <div className={cn("flex items-center gap-1.5", isMine ? "flex-row-reverse" : "flex-row")}>
          <span className="text-caption font-medium text-text-secondary">
            {message.senderName}
          </span>
          <span className="text-caption text-text-tertiary">
            {new Date(message.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* 버블 */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5",
            isPrivate
              ? "bg-[hsl(42_92%_96%)] border border-[hsl(42_86%_82%)]"
              : isMine
              ? "bg-brand text-brand-foreground"
              : "bg-surface shadow-card",
          )}
        >
          {/* 채널 라벨 */}
          {isPrivate && (
            <div className={cn("flex items-center gap-1 mb-1.5", isMine ? "justify-end" : "justify-start")}>
              <Lock className="w-3 h-3 text-[hsl(42_72%_40%)]" />
              <span className="text-caption font-semibold text-[hsl(42_72%_40%)]">
                {getChannelLabel(message.channel)}
              </span>
            </div>
          )}
          <p
            className={cn(
              "text-body-sm leading-relaxed",
              isPrivate
                ? "text-text-primary"
                : isMine
                ? "text-brand-foreground"
                : "text-text-primary",
            )}
          >
            {message.text}
          </p>
        </div>
      </div>
    </div>
  );
}
