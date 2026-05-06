/**
 * mock-notifications.ts — F06 알림 센터 목업 데이터
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

const now = new Date();
const t = (offsetMinutes: number) =>
  new Date(now.getTime() - offsetMinutes * 60 * 1000).toISOString();

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  // ── 매칭 ────────────────────────────────────────────────────
  {
    id: "notif-001",
    category: "match",
    action: "match_received",
    title: "새 매칭이 도착했어요 💌",
    body: "박주선 님이 연지수 님과의 만남을 제안했어요. 프로필을 확인해보세요!",
    avatarColor: "blue",
    read: false,
    createdAt: t(3),
    meta: { matchId: "match-001" },
  },
  {
    id: "notif-002",
    category: "match",
    action: "match_accepted",
    title: "매칭이 성사됐어요 🎉",
    body: "김민준 님이 매칭을 수락했어요. 첫 메시지를 보내보세요!",
    avatarColor: "pink",
    read: false,
    createdAt: t(47),
    meta: { matchId: "match-002" },
  },
  {
    id: "notif-003",
    category: "match",
    action: "match_rejected",
    title: "매칭 결과 안내",
    body: "이번 매칭은 성사되지 않았어요. 더 잘 맞는 인연을 찾아드릴게요.",
    avatarColor: "gray",
    read: true,
    createdAt: t(60 * 3),
    meta: { matchId: "match-003" },
  },
  {
    id: "notif-004",
    category: "match",
    action: "match_completed",
    title: "만남 후기를 남겨주세요 ⭐",
    body: "이지수 님과의 만남은 어떠셨나요? 후기를 남기면 주선자에게 전달돼요.",
    avatarColor: "green",
    read: true,
    createdAt: t(60 * 26),
    meta: { matchId: "match-001" },
  },

  // ── 주선 ────────────────────────────────────────────────────
  {
    id: "notif-005",
    category: "matchmaker",
    action: "matchmaker_request",
    title: "주선 요청이 왔어요 🤝",
    body: "친구 김철수 님이 주선을 요청했어요. 수락하시겠어요?",
    avatarColor: "orange",
    read: false,
    createdAt: t(15),
    meta: { userId: "user-kim" },
  },
  {
    id: "notif-006",
    category: "matchmaker",
    action: "matchmaker_approved",
    title: "주선이 성사됐어요 🌟",
    body: "소개한 커플이 매칭에 성공했어요! 포인트 1,500원이 적립됩니다.",
    avatarColor: "yellow",
    read: false,
    createdAt: t(60 * 2),
  },
  {
    id: "notif-007",
    category: "matchmaker",
    action: "points_earned",
    title: "포인트 적립 완료 💰",
    body: "성공 보상 1,500포인트가 지갑에 추가됐어요. 현재 잔액: 4,500P",
    read: true,
    createdAt: t(60 * 2 + 1),
  },
  {
    id: "notif-008",
    category: "matchmaker",
    action: "matchmaker_rejected",
    title: "이번 주선은 아쉽게도...",
    body: "소개한 분이 이번 만남은 어렵다고 하셨어요. 다음 기회를 노려봐요!",
    read: true,
    createdAt: t(60 * 48),
  },

  // ── 시스템 ────────────────────────────────────────────────────
  {
    id: "notif-009",
    category: "system",
    action: "verify_reminder",
    title: "본인인증으로 신뢰도를 높여보세요 🛡️",
    body: "사진 본인인증을 완료하면 프로필에 인증 배지가 표시되고 매칭 확률이 높아져요.",
    read: false,
    createdAt: t(60 * 5),
  },
  {
    id: "notif-010",
    category: "system",
    action: "event",
    title: "5월 특별 이벤트 🎁",
    body: "5월 한 달간 첫 매칭권 무료! 지금 바로 마음에 드는 분께 메시지를 보내보세요.",
    read: true,
    createdAt: t(60 * 24 * 2),
  },
  {
    id: "notif-011",
    category: "system",
    action: "service_notice",
    title: "서비스 업데이트 안내",
    body: "컬러 타입 진단 기능이 추가됐어요. 나만의 컬러를 찾아보세요!",
    read: true,
    createdAt: t(60 * 24 * 3),
  },
];
