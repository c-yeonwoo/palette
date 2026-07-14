/**
 * ChatThread — 인앱 1:1 채팅 (ADR 0066)
 * 5초 폴링 REST + 텍스트 메시지 전송
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "../ui/empty-state";
import { MessageCircle } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import type { Message } from "../../../data/mock-conversations";
import { api } from "../../../lib/api/apiClient";
import { authService } from "../../../lib/auth/authService";
import { cn } from "../ui/utils";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 5000;

interface ApiChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

interface ChatMessagesResponse {
  messages: ApiChatMessage[];
  unreadCount: number;
}

interface ChatThreadProps {
  requestId: string;
  partnerName: string;
  readOnly?: boolean;
  className?: string;
}

function toUiMessage(msg: ApiChatMessage, viewerId: string, partnerName: string): Message {
  const isMine = msg.senderId === viewerId;
  return {
    id: msg.id,
    matchId: msg.requestId,
    channel: "public",
    senderId: msg.senderId,
    senderRole: isMine ? "me" : "partner",
    senderName: isMine ? "나" : partnerName,
    text: msg.body,
    createdAt: msg.createdAt,
  };
}

export function ChatThread({ requestId, partnerName, readOnly = false, className }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      if (user?.userId) setViewerId(user.userId);
    });
  }, []);

  const mergeMessages = useCallback((incoming: ApiChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const msg of incoming) {
        if (!viewerId) continue;
        map.set(msg.id, toUiMessage(msg, viewerId, partnerName));
      }
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      const last = merged[merged.length - 1];
      if (last) lastIdRef.current = last.id;
      return merged;
    });
  }, [viewerId, partnerName]);

  const fetchMessages = useCallback(async (after?: string | null) => {
    if (!viewerId) return;
    const qs = after ? `?after=${after}` : "";
    const res = await api.get<ChatMessagesResponse>(
      `/api/v1/relationships/${requestId}/messages${qs}`,
    );
    mergeMessages(res.messages ?? []);
  }, [viewerId, requestId, mergeMessages]);

  useEffect(() => {
    if (!viewerId) return;
    lastIdRef.current = null;
    setMessages([]);
    fetchMessages().catch(() => toast.error("메시지를 불러오지 못했어요"));
  }, [viewerId, requestId, fetchMessages]);

  useEffect(() => {
    if (!viewerId) return;
    const timer = setInterval(() => {
      fetchMessages(lastIdRef.current).catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [viewerId, requestId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (text: string) => {
    if (readOnly || !viewerId || isSending) return;
    setIsSending(true);
    try {
      const sent = await api.post<ApiChatMessage>(
        `/api/v1/relationships/${requestId}/messages`,
        { body: text },
      );
      mergeMessages([sent]);
    } catch {
      toast.error("메시지 전송에 실패했어요");
    } finally {
      setIsSending(false);
    }
  };

  if (!viewerId) {
    return (
      <div className={cn("flex flex-col h-full items-center justify-center", className)}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={<MessageCircle />}
            title="대화 내역이 없어요"
            body={readOnly ? "종료된 인연의 대화 기록이 없어요." : "첫 인사를 남겨보세요."}
          />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              viewerSenderId={viewerId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {readOnly ? (
        <div className="px-4 py-3 border-t border-border-subtle bg-surface text-center">
          <p className="text-caption text-text-tertiary">종료된 인연 — 대화 기록만 볼 수 있어요</p>
        </div>
      ) : (
        <MessageComposer onSend={handleSend} disabled={isSending} />
      )}
    </div>
  );
}
