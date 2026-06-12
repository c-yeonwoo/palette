/**
 * mock-conversations.ts — F02 3자 채팅 타입 계약
 *
 * 실제 메시지 데이터는 채팅 백엔드 연동 전까지 노출하지 않는다 (ChatThread 는 빈 상태).
 * 이 모듈은 채팅 도메인 타입만 정의한다. (mock 데이터 제거됨)
 */

export type Channel = "public" | "matchmaker_to_user" | "user_to_matchmaker";
export type SenderRole = "matchmaker" | "me" | "partner";

export interface Message {
  id: string;
  matchId: string;
  channel: Channel;
  senderId: string;
  senderRole: SenderRole;
  senderName: string;
  text: string;
  createdAt: string;
}
