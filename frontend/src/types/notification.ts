/**
 * notification.ts — 알림 관련 타입 정의
 * (이전 mock-notifications.ts 에서 타입만 추출)
 */

export type NotificationCategory = "match" | "matchmaker" | "system";

export type NotificationAction =
  | "match_received"
  | "match_accepted"
  | "match_rejected"
  | "match_completed"
  | "matchmaker_request"
  | "matchmaker_approved"
  | "matchmaker_rejected"
  | "points_earned"
  | "verify_reminder"
  | "service_notice"
  | "event";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  action: NotificationAction;
  title: string;
  body: string;
  avatarColor?: string;
  read: boolean;
  createdAt: string;
  meta?: {
    matchId?: string;
    userId?: string;
  };
}
