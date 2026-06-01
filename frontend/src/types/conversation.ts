/**
 * conversation.ts — 대화 관련 타입 정의
 * (이전 mock-conversations.ts 에서 타입만 추출)
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
