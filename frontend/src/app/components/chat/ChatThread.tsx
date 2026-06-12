/**
 * ChatThread — F02 메시지 리스트 + 자동 스크롤
 */
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "../ui/empty-state";
import { MessageCircle } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { ChannelSelector } from "./ChannelSelector";
import { filterVisibleMessages } from "../../../lib/conversation-visibility";
import type { Channel, Message } from "../../../data/mock-conversations";
import { getColorTypeMeta } from "../../../lib/colorTypes";
import type { MatchDetail } from "../../../data/mock-matches";
import { cn } from "../ui/utils";

const VIEWER_ID = "me-001"; // 현재 사용자 (채팅 백엔드 연동 시 실제 userId 로 교체)

interface ChatThreadProps {
  match: MatchDetail;
  isMatchmaker?: boolean;
  className?: string;
}

export function ChatThread({ match, isMatchmaker = false, className }: ChatThreadProps) {
  // 채팅 백엔드 미구현 — 항상 빈 대화로 시작 (mock 미노출, MVP 제한)
  const [messages, setMessages] = useState<Message[]>([]);
  const [channel, setChannel] = useState<Channel>("public");
  const bottomRef = useRef<HTMLDivElement>(null);

  const viewerRole = isMatchmaker ? "matchmaker" : "me";
  const visible = filterVisibleMessages(messages, viewerRole, VIEWER_ID);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visible.length]);

  const handleSend = (text: string) => {
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      matchId: match.matchId,
      channel,
      senderId: VIEWER_ID,
      senderRole: "me",
      senderName: "나",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const getSenderColor = (msg: Message): string | undefined => {
    if (msg.senderRole === "me") {
      return `hsl(${getColorTypeMeta(match.me.colorType).h} ${getColorTypeMeta(match.me.colorType).s}% ${getColorTypeMeta(match.me.colorType).l}%)`;
    }
    if (msg.senderRole === "partner") {
      return `hsl(${getColorTypeMeta(match.partner.colorType).h} ${getColorTypeMeta(match.partner.colorType).s}% ${getColorTypeMeta(match.partner.colorType).l}%)`;
    }
    return "hsl(42 86% 46%)"; // 주선자 골드
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 채널 셀렉터 헤더 */}
      <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2 bg-surface">
        <span className="text-caption text-text-tertiary">채널:</span>
        <ChannelSelector value={channel} onChange={setChannel} />
      </div>

      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {visible.length === 0 ? (
          <EmptyState
            icon={<MessageCircle />}
            title="대화 내역이 없어요"
            body={isMatchmaker ? "양쪽에 한마디씩 남기고 시작해보세요." : "주선자에게 첫 인사를 남겨보세요."}
          />
        ) : (
          visible.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              viewerSenderId={VIEWER_ID}
              senderColorHex={getSenderColor(msg)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <MessageComposer channel={channel} onSend={handleSend} />
    </div>
  );
}
