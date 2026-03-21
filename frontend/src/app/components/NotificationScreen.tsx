import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ArrowLeft, Bell, BellOff, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";

type NotificationType =
  | "MATCH_REQUEST"
  | "MATCH_APPROVED"
  | "MATCH_REJECTED"
  | "MATCH_COMPLETED"
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "PROFILE_VIEW"
  | "SYSTEM";

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata: Record<string, string>;
}

interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

interface NotificationScreenProps {
  onBack: () => void;
}

const TYPE_CONFIG: Record<NotificationType, { emoji: string; color: string }> = {
  MATCH_REQUEST: { emoji: "💌", color: "text-pink-500" },
  MATCH_APPROVED: { emoji: "✅", color: "text-green-500" },
  MATCH_REJECTED: { emoji: "❌", color: "text-red-500" },
  MATCH_COMPLETED: { emoji: "🎉", color: "text-yellow-500" },
  FRIEND_REQUEST: { emoji: "👋", color: "text-blue-500" },
  FRIEND_ACCEPTED: { emoji: "🤝", color: "text-green-600" },
  PROFILE_VIEW: { emoji: "👁️", color: "text-purple-500" },
  SYSTEM: { emoji: "🔔", color: "text-muted-foreground" },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return "방금";
}

export function NotificationScreen({ onBack }: NotificationScreenProps) {
  const [data, setData] = useState<NotificationListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<NotificationListResponse>("/api/v1/notifications");
      setData(res);
    } catch {
      toast.error("알림을 불러오지 못했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/api/v1/notifications/read/${id}`, {});
      setData(prev =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map(n =>
                n.id === id ? { ...n, isRead: true } : n
              ),
              unreadCount: Math.max(0, prev.unreadCount - 1),
            }
          : prev
      );
    } catch {
      // silently fail
    }
  };

  const markAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await api.post("/api/v1/notifications/read-all", {});
      setData(prev =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map(n => ({ ...n, isRead: true })),
              unreadCount: 0,
            }
          : prev
      );
      toast.success("모든 알림을 읽음 처리했습니다");
    } catch {
      toast.error("처리에 실패했습니다");
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-accent rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold">알림</h1>
            {data && data.unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {data.unreadCount}
              </span>
            )}
          </div>

          {data && data.unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={markAllAsRead}
              disabled={isMarkingAll}
            >
              {isMarkingAll ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              모두 읽음
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data || data.notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BellOff className="w-12 h-12 mb-3 opacity-30" />
            <p>알림이 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.notifications.map(notif => {
              const config = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.SYSTEM;
              return (
                <div
                  key={notif.id}
                  className={`px-4 py-4 flex gap-3 cursor-pointer transition-colors ${
                    !notif.isRead
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-lg">
                    {config.emoji}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium leading-tight ${!notif.isRead ? "" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notif.body}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatRelativeTime(notif.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
