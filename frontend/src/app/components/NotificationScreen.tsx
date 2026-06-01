/**
 * NotificationScreen — F06 알림 센터 / 활동 로그
 *
 * 기능:
 *   - 탭 필터: 전체 / 매칭 / 주선 / 시스템
 *   - 읽음 처리 (탭 시 해당 알림 read=true)
 *   - 전체 읽음 버튼
 *   - 빈 상태 Empty State
 *   - 읽지 않은 배지 (탭별 카운트)
 */
import { useState, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Coins,
  Gift,
  Handshake,
  Heart,
  HeartOff,
  Mail,
  Shield,
  Star,
  Trophy,
  X as XIcon,
} from "lucide-react";
import { cn } from "./ui/utils";
import {
  MOCK_NOTIFICATIONS,
  type AppNotification,
  type NotificationCategory,
} from "../../data/mock-notifications";
import {
  CATEGORY_LABELS,
  filterByCategory,
  formatRelativeTime,
  countUnread,
} from "../../lib/notifications";
import { api } from "../../lib/api/apiClient";
import { isMockdataUser } from "../../lib/mockdata-guard";
import { getColorTypeMeta } from "../../lib/colorTypes";

interface NotificationScreenProps {
  onBack: () => void;
  /** 딥링크: 매칭 상세 열기 */
  onOpenMatch?: (matchId: string) => void;
}

type TabKey = "all" | NotificationCategory;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all",        label: "전체" },
  { key: "match",      label: "매칭" },
  { key: "matchmaker", label: "주선" },
  { key: "system",     label: "시스템" },
];

const ACTION_ICON_MAP: Record<string, React.ElementType> = {
  match_received:      Mail,
  match_accepted:      Heart,
  match_rejected:      HeartOff,
  match_completed:     Star,
  matchmaker_request:  Handshake,
  matchmaker_approved: Trophy,
  matchmaker_rejected: XIcon,
  points_earned:       Coins,
  verify_reminder:     Shield,
  service_notice:      Bell,
  event:               Gift,
};

const CATEGORY_ICON_COLOR: Record<NotificationCategory, string> = {
  match:      "hsl(var(--brand))",
  matchmaker: "hsl(var(--state-success))",
  system:     "hsl(var(--text-secondary))",
};

export function NotificationScreen({ onBack, onOpenMatch }: NotificationScreenProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await api.get<{ email?: string; nickname?: string }>("/api/v1/auth/me");
        setNotifications(isMockdataUser(me) ? MOCK_NOTIFICATIONS : []);
      } catch {
        setNotifications([]);
      }
    };
    init();
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const handleTap = (notif: AppNotification) => {
    markRead(notif.id);
    if (notif.meta?.matchId && onOpenMatch) {
      onOpenMatch(notif.meta.matchId);
    }
  };

  const filtered = filterByCategory(
    notifications,
    activeTab === "all" ? "all" : activeTab,
  );

  const totalUnread = countUnread(notifications);

  /** 탭별 읽지 않은 수 */
  const tabUnread = (key: TabKey) => {
    const scoped = filterByCategory(notifications, key === "all" ? "all" : key);
    return countUnread(scoped);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-sunken"
          aria-label="뒤로"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-body font-semibold text-text-primary">
          알림
          {totalUnread > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-brand-foreground text-[10px] font-bold">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </h1>
        <button
          onClick={markAllRead}
          disabled={totalUnread === 0}
          className="flex items-center gap-1 text-caption font-medium text-brand disabled:text-text-tertiary disabled:cursor-not-allowed"
          aria-label="전체 읽음"
        >
          <CheckCheck className="w-4 h-4" />
          전체 읽음
        </button>
      </div>

      {/* ── 탭 바 ── */}
      <div className="flex border-b border-border-subtle bg-surface">
        {TABS.map(({ key, label }) => {
          const unread = tabUnread(key);
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-1 py-3 text-body-sm font-medium relative transition-colors",
                isActive ? "text-text-primary" : "text-text-tertiary",
              )}
            >
              {label}
              {unread > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-brand text-brand-foreground text-[9px] font-bold">
                  {unread}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-brand rounded-t-pill" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── 목록 ── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <ul className="divide-y divide-border-subtle">
            {filtered.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onTap={handleTap}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── 알림 아이템 ───────────────────────────────────────────── */

function NotificationItem({
  notification: n,
  onTap,
}: {
  notification: AppNotification;
  onTap: (n: AppNotification) => void;
}) {
  const Icon = ACTION_ICON_MAP[n.action] ?? Bell;
  const iconColor = CATEGORY_ICON_COLOR[n.category];

  // 아바타: avatarColor 있으면 컬러 원, 없으면 아이콘 원
  const hasAvatar = Boolean(n.avatarColor);
  const avatarHsl = hasAvatar
    ? `hsl(${getColorTypeMeta(n.avatarColor!).h} ${getColorTypeMeta(n.avatarColor!).s}% ${getColorTypeMeta(n.avatarColor!).l}%)`
    : undefined;

  return (
    <li>
      <button
        onClick={() => onTap(n)}
        className={cn(
          "w-full flex items-start gap-3 px-4 py-4 text-left transition-colors",
          n.read ? "bg-background" : "bg-[hsl(var(--brand)/0.04)]",
          "hover:bg-surface-sunken active:bg-surface-sunken",
        )}
      >
        {/* 아바타 / 아이콘 */}
        <div className="flex-shrink-0 relative mt-0.5">
          {hasAvatar ? (
            <div
              className="w-10 h-10 rounded-full border-2 border-background shadow-soft"
              style={{ backgroundColor: avatarHsl }}
              aria-hidden
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-sunken"
              aria-hidden
            >
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
          )}
          {/* 아바타 위에 액션 아이콘 뱃지 */}
          {hasAvatar && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background"
              style={{ backgroundColor: iconColor }}
              aria-hidden
            >
              <Icon className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-body-sm leading-snug",
              n.read ? "text-text-secondary" : "text-text-primary font-semibold",
            )}
          >
            {n.title}
          </p>
          <p className="text-caption text-text-tertiary mt-0.5 line-clamp-2 leading-snug">
            {n.body}
          </p>
          <p className="text-caption text-text-tertiary mt-1">
            {formatRelativeTime(n.createdAt)}
          </p>
        </div>

        {/* 읽지 않음 점 */}
        {!n.read && (
          <div
            className="flex-shrink-0 w-2 h-2 rounded-full bg-brand mt-1.5"
            aria-label="읽지 않음"
          />
        )}
      </button>
    </li>
  );
}

/* ── 빈 상태 ───────────────────────────────────────────────── */

function EmptyState({ tab }: { tab: TabKey }) {
  const label = tab === "all" ? "알림" : CATEGORY_LABELS[tab as NotificationCategory];
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-sunken flex items-center justify-center animate-float">
        <BellOff className="w-8 h-8 text-text-tertiary" />
      </div>
      <div>
        <p className="text-body font-semibold text-text-primary">
          {label} 알림이 없어요
        </p>
        <p className="text-body-sm text-text-tertiary mt-1">
          새로운 {label} 소식이 오면 여기에 표시돼요.
        </p>
      </div>
    </div>
  );
}
