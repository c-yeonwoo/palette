/**
 * 친구 보증 프리셋 — 백엔드 VouchPreset 과 동기.
 * L0 = 칩 없이 원탭, L1 = 칩 선택, L2 = optional 한마디.
 */
export const VOUCH_PRESETS = [
  { key: "EASYGOING", label: "같이 있으면 편해요" },
  { key: "CARING", label: "사람을 잘 챙겨요" },
  { key: "GOOD_CHAT", label: "대화가 잘 통해요" },
  { key: "WORTH_INTRO", label: "소개해줘도 될 사람이에요" },
  { key: "SERIOUS", label: "진지해요" },
] as const;

export type VouchPresetKey = (typeof VOUCH_PRESETS)[number]["key"];

export interface VouchItem {
  voucherNickname: string;
  presetKey: string | null;
  presetLabel: string | null;
  message: string | null;
}

export interface VouchResponse {
  targetUserId: string;
  vouchCount: number;
  voucherNicknames: string[];
  vouches: VouchItem[];
  isVouchedByMe: boolean;
  myVouch: VouchItem | null;
  presets?: Array<{ key: string; label: string }>;
}

export function vouchDisplayLine(v: VouchItem): string {
  if (v.message?.trim()) return v.message.trim();
  if (v.presetLabel?.trim()) return v.presetLabel.trim();
  return "이 분을 보증해요";
}
