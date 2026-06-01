/**
 * notifications.ts — F06 알림 유틸리티
 */
import type { AppNotification, NotificationCategory, NotificationAction } from "../types/notification";

export type { AppNotification, NotificationCategory, NotificationAction };

/** 카테고리 라벨 */
export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  match: "매칭",
  matchmaker: "주선",
  system: "시스템",
};

/** 액션별 아이콘 이름 (lucide-react) */
export const ACTION_ICONS: Record<NotificationAction, string> = {
  match_received:      "Mail",
  match_accepted:      "Heart",
  match_rejected:      "HeartOff",
  match_completed:     "Star",
  matchmaker_request:  "Handshake",
  matchmaker_approved: "Trophy",
  matchmaker_rejected: "X",
  points_earned:       "Coins",
  verify_reminder:     "Shield",
  service_notice:      "Bell",
  event:               "Gift",
};

/** 알림을 상대 시간 문자열로 변환 (방금 / N분 전 / N시간 전 / N일 전) */
export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

/** 읽지 않은 알림 수 */
export function countUnread(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

/** 카테고리 필터 */
export function filterByCategory(
  notifications: AppNotification[],
  category: NotificationCategory | "all",
): AppNotification[] {
  if (category === "all") return notifications;
  return notifications.filter((n) => n.category === category);
}
