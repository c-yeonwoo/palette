/**
 * conversation-visibility.ts — F02 채널별 가시성 규칙
 *
 * 채널 가시성:
 *   public               → 주선자 + 당사자 + 상대 (3자 모두)
 *   matchmaker_to_user   → 주선자 + 특정 당사자만 (상대 못 봄)
 *   user_to_matchmaker   → 당사자 + 주선자만 (상대 못 봄)
 */
// Types moved from mock-conversations.ts
export 
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

export type ViewerRole = "me" | "partner" | "matchmaker";

/**
 * 주어진 viewerRole 기준으로 볼 수 있는 메시지만 필터링.
 * targetRole: matchmaker_to_user 에서 귀띔 대상이 me인지 partner인지.
 *   - "matchmaker_to_me" 귀띔은 me + matchmaker만 봄
 *   - "matchmaker_to_partner" 귀띔은 partner + matchmaker만 봄
 */
/**
 * @param messages       대상 매칭의 전체 메시지
 * @param viewerRole     현재 보는 사람의 역할
 * @param viewerSenderId 현재 보는 사람의 senderId
 *
 * 가시성 규칙:
 *   public               → 3자 모두
 *   matchmaker_to_user   → 주선자(발신) + me(수신 당사자) / partner는 못 봄
 *   user_to_matchmaker   → 발신 당사자 + 주선자 / 상대방은 못 봄
 */
export function filterVisibleMessages(
  messages: Message[],
  viewerRole: ViewerRole,
  viewerSenderId: string,
): Message[] {
  return messages.filter((msg) => {
    switch (msg.channel) {
      case "public":
        return true;

      case "matchmaker_to_user":
        // 주선자 → 특정 당사자 귀띔: 주선자 + me만 봄. partner 제외.
        return viewerRole === "matchmaker" || viewerRole === "me";

      case "user_to_matchmaker":
        // 당사자 → 주선자 귀띔: 발신자 본인 + 주선자만 봄.
        return viewerRole === "matchmaker" || msg.senderId === viewerSenderId;

      default:
        return true;
    }
  });
}

/** 채널 표시 라벨 */
export function getChannelLabel(channel: Channel): string {
  switch (channel) {
    case "public":             return "모두에게";
    case "matchmaker_to_user": return "귀띔";
    case "user_to_matchmaker": return "주선자에게만";
    default:                   return "";
  }
}

/** 채널 아이콘 이름 (lucide-react) */
export function getChannelIcon(channel: Channel): string {
  switch (channel) {
    case "public":             return "Globe";
    case "matchmaker_to_user": return "Lock";
    case "user_to_matchmaker": return "Lock";
    default:                   return "MessageCircle";
  }
}

export const CHANNEL_OPTIONS: { value: Channel; label: string; description: string }[] = [
  {
    value: "public",
    label: "모두에게",
    description: "주선자·나·상대 모두 볼 수 있어요",
  },
  {
    value: "user_to_matchmaker",
    label: "주선자에게만",
    description: "주선자만 볼 수 있는 귀띔이에요",
  },
];
