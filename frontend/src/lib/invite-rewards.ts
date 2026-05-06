/**
 * invite-rewards.ts — F12 초대 보상 트리거
 *
 * 보상 단계:
 *   L1: 가입      → 초대자 +1권 / 피초대자 +1권 + 첫 매칭 무료
 *   L2: 컬러 진단 → 초대자 컬러 진화 진행도 +10
 *   L3: 첫 주선   → 초대자 +3권 + "연결자" 뱃지
 *   L4: 주선 성사 → 초대자 "골드 커넥터" 뱃지
 *
 * 중복 지급 방지: rewards 배열에 level 존재 여부 체크
 * 보상은 활동 30일 후 확정 (선적립 → pending → confirmed)
 */

export type InviteStatus =
  | "sent"
  | "joined"
  | "tested"
  | "matchmaker"
  | "success";

export type RewardLevel = 1 | 2 | 3 | 4;

export interface InviteReward {
  level: RewardLevel;
  grantedAt: string;
  confirmed: boolean; // 30일 후 true
}

export interface Invite {
  code: string;
  inviterId: string;
  inviteeUserId?: string;
  inviteeName?: string;
  status: InviteStatus;
  createdAt: string;
  rewards: InviteReward[];
}

const STORAGE_KEY = "palette_invites";

function loadInvites(): Invite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveInvites(invites: Invite[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invites));
  } catch {}
}

/**
 * 보상 트리거 함수.
 * 중복 체크 후 해당 invite에 reward 기록.
 *
 * @param code       초대 코드
 * @param level      1~4
 * @param onGranted  실제 보상 처리 콜백 (티켓 지급, 뱃지 등)
 */
export function triggerReward(
  code: string,
  level: RewardLevel,
  onGranted?: (level: RewardLevel) => void,
): boolean {
  const invites = loadInvites();
  const idx = invites.findIndex((i) => i.code === code);
  if (idx === -1) return false;

  const invite = invites[idx];
  // 중복 방지
  if (invite.rewards.some((r) => r.level === level)) return false;

  const reward: InviteReward = {
    level,
    grantedAt: new Date().toISOString(),
    confirmed: false, // 30일 후 확정
  };
  invite.rewards.push(reward);

  // 상태 업데이트
  const statusMap: Record<RewardLevel, InviteStatus> = {
    1: "joined",
    2: "tested",
    3: "matchmaker",
    4: "success",
  };
  invite.status = statusMap[level];

  invites[idx] = invite;
  saveInvites(invites);

  onGranted?.(level);
  return true;
}

/** Mock 초대 히스토리 */
export const MOCK_INVITES: Invite[] = [
  {
    code: "ABC123",
    inviterId: "me-001",
    inviteeUserId: "user-kim",
    inviteeName: "김친구",
    status: "tested",
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    rewards: [
      { level: 1, grantedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), confirmed: true },
      { level: 2, grantedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(), confirmed: false },
    ],
  },
  {
    code: "DEF456",
    inviterId: "me-001",
    inviteeUserId: "user-lee",
    inviteeName: "이친구",
    status: "joined",
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    rewards: [
      { level: 1, grantedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), confirmed: false },
    ],
  },
  {
    code: "GHJ789",
    inviterId: "me-001",
    inviteeUserId: undefined,
    inviteeName: undefined,
    status: "sent",
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    rewards: [],
  },
];

/** 보상별 설명 */
export const REWARD_DESCRIPTIONS: Record<
  RewardLevel,
  { title: string; inviterReward: string; inviteeReward: string; trigger: string }
> = {
  1: {
    title: "가입",
    inviterReward: "매칭권 +1",
    inviteeReward: "매칭권 +1, 첫 매칭 무료",
    trigger: "친구가 Palette에 가입하면",
  },
  2: {
    title: "컬러 진단",
    inviterReward: "컬러 진화 +10",
    inviteeReward: "—",
    trigger: "친구가 컬러 타입 진단을 완료하면",
  },
  3: {
    title: "첫 주선",
    inviterReward: "매칭권 +3, 연결자 뱃지",
    inviteeReward: "Bronze 주선자 시작",
    trigger: "친구가 첫 주선을 완료하면",
  },
  4: {
    title: "주선 성사",
    inviterReward: "골드 커넥터 뱃지",
    inviteeReward: "Silver 승급 가산점",
    trigger: "친구의 주선이 성사되면",
  },
};
