/**
 * mock-notifications.ts — F06 알림 타입 계약
 *
 * 실제 알림 데이터는 백엔드 연동 전까지 노출하지 않는다 (NotificationScreen 은 빈 상태).
 * 이 모듈은 알림 도메인 타입만 정의한다. (mock 데이터 제거됨)
 *
 * 알림 카테고리:
 *   match      — 매칭 관련 (매칭 도착, 수락, 거절, 만남 완료)
 *   matchmaker — 주선 관련 (주선 요청, 승인, 거절, 포인트 적립)
 *   system     — 시스템 (서비스 공지, 프로필 인증, 이벤트)
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
  /** 알림 내 썸네일 이미지 (아바타 컬러 타입 키 or null) */
  avatarColor?: string;
  /** 읽음 여부 */
  read: boolean;
  /** ISO 8601 */
  createdAt: string;
  /** 딥링크용 메타 */
  meta?: {
    matchId?: string;
    userId?: string;
  };
}
