/**
 * tickets.ts — F13 매칭권 시스템
 *
 * 사용:
 *   const { balance, spend, earn } = useTickets();
 */
import { useState, useCallback } from "react";

export type EarnTrigger =
  | "signup_bonus"
  | "friend_invite"
  | "manner_review"
  | "profile_complete"
  | "daily_attend"
  | "purchase";

export type SpendTrigger = "send_message" | "view_full_profile";

export interface TicketEvent {
  id: string;
  type: "earn" | "spend";
  amount: number;
  trigger: EarnTrigger | SpendTrigger;
  label: string;
  createdAt: string;
}

const EARN_LABELS: Record<EarnTrigger, string> = {
  signup_bonus:     "가입 보너스",
  friend_invite:    "친구 초대",
  manner_review:    "매너 후기 달성",
  profile_complete: "프로필 80% 완성",
  daily_attend:     "7일 연속 출석",
  purchase:         "구매",
};

const SPEND_LABELS: Record<SpendTrigger, string> = {
  send_message:    "메시지 시작",
  view_full_profile: "프로필 전체 열람",
};

const STORAGE_KEY = "palette_tickets";

interface TicketStore {
  balance: number;
  history: TicketEvent[];
}

function loadStore(): TicketStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { balance: 3, history: [] }; // 가입 보너스 3매
  } catch {
    return { balance: 3, history: [] };
  }
}

function saveStore(store: TicketStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function useTickets() {
  const [store, setStore] = useState<TicketStore>(loadStore);

  const earn = useCallback((trigger: EarnTrigger, amount = 1) => {
    setStore((prev) => {
      const next: TicketStore = {
        balance: prev.balance + amount,
        history: [
          {
            id: `ev-${Date.now()}`,
            type: "earn",
            amount,
            trigger,
            label: `${EARN_LABELS[trigger]} +${amount}매`,
            createdAt: new Date().toISOString(),
          },
          ...prev.history,
        ],
      };
      saveStore(next);
      return next;
    });
  }, []);

  /**
   * 매칭권 소비. 잔액 충분 시 true 반환.
   * NOTE: React의 state updater 함수는 배치 내에서 동기 실행되므로
   *       success 플래그는 호출 즉시 읽어도 안전합니다.
   */
  const spend = useCallback((trigger: SpendTrigger, amount = 1): boolean => {
    // 현재 잔액을 먼저 확인 (낙관적 체크)
    const currentBalance = loadStore().balance;
    if (currentBalance < amount) return false;

    setStore((prev) => {
      if (prev.balance < amount) return prev; // 이중 체크
      const next: TicketStore = {
        balance: prev.balance - amount,
        history: [
          {
            id: `ev-${Date.now()}`,
            type: "spend",
            amount,
            trigger,
            label: `${SPEND_LABELS[trigger]} -${amount}매`,
            createdAt: new Date().toISOString(),
          },
          ...prev.history,
        ],
      };
      saveStore(next);
      return next;
    });
    return true;
  }, []);

  return {
    balance: store.balance,
    history: store.history,
    earn,
    spend,
  };
}

/** 적립 경로 안내 (페이월 sheet용) */
export const FREE_EARN_PATHS = [
  { trigger: "friend_invite" as EarnTrigger, label: "친구 초대", reward: "+1매" },
  { trigger: "manner_review" as EarnTrigger, label: "매너 후기 5개 달성", reward: "+1매" },
  { trigger: "profile_complete" as EarnTrigger, label: "프로필 80% 완성", reward: "+2매" },
  { trigger: "daily_attend" as EarnTrigger, label: "7일 연속 출석", reward: "+1매" },
];
