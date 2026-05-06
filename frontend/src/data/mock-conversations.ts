/**
 * mock-conversations.ts — F02 3자 채팅 목 데이터
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

export const MOCK_MESSAGES: Message[] = [
  {
    id: "msg-001",
    matchId: "match-001",
    channel: "public",
    senderId: "mm-001",
    senderRole: "matchmaker",
    senderName: "김민준",
    text: "안녕하세요! 두 분 소개해 드릴게요. 서로 자기소개 한번 해보실래요? 😊",
    createdAt: "2025-05-03T10:05:00Z",
  },
  {
    id: "msg-002",
    matchId: "match-001",
    channel: "public",
    senderId: "me-001",
    senderRole: "me",
    senderName: "나",
    text: "안녕하세요! 개발자로 일하고 있는 28살입니다. 주말엔 주로 등산이나 자전거 타러 다녀요.",
    createdAt: "2025-05-03T10:15:00Z",
  },
  {
    id: "msg-003",
    matchId: "match-001",
    channel: "public",
    senderId: "user-101",
    senderRole: "partner",
    senderName: "지수",
    text: "반가워요! 저는 금융 쪽에서 일하고 있어요. 등산 저도 좋아하는데, 어디 자주 가세요?",
    createdAt: "2025-05-03T10:22:00Z",
  },
  {
    id: "msg-004",
    matchId: "match-001",
    channel: "matchmaker_to_user",
    senderId: "mm-001",
    senderRole: "matchmaker",
    senderName: "김민준",
    text: "지수씨 북한산 엄청 좋아해요. 등산 얘기 꺼내면 분위기 확 살아날 거예요! 귀띔 드릴게요 🙂",
    createdAt: "2025-05-03T10:30:00Z",
  },
  {
    id: "msg-005",
    matchId: "match-001",
    channel: "user_to_matchmaker",
    senderId: "me-001",
    senderRole: "me",
    senderName: "나",
    text: "민준씨, 지수씨 첫 인상 어때요? 제가 좀 어색했는데 괜찮아 보였나요?",
    createdAt: "2025-05-03T10:45:00Z",
  },
];

export function getMessagesForMatch(matchId: string): Message[] {
  return MOCK_MESSAGES.filter((m) => m.matchId === matchId);
}
