/**
 * feature-flags.ts — F13 A/B 테스트 토글
 *
 * 런칭 후 변형 검증용. 지금은 디폴트 고정.
 * 추후 서버 응답 or localStorage 오버라이드로 교체 가능.
 */

export interface FeatureFlags {
  /** 가입 보너스 매칭권 수 (3 vs 5) */
  signupBonusTickets: 3 | 5;
  /** 첫 양방향 매칭 1건 메시지 무료 */
  firstMatchFree: boolean;
  /** 페이월에서 단품 vs 멤버십 우선 노출 */
  paywallFirstOffer: "ticket" | "membership";
  /** 상대도 결제자인 경우에만 메시지 오픈 */
  bothPaidRequired: boolean;
  /** 메인 피드 사진 블러 해제 */
  feedPhotoClear: boolean;
}

const DEFAULTS: FeatureFlags = {
  signupBonusTickets: 3,
  firstMatchFree: false,
  paywallFirstOffer: "ticket",
  bothPaidRequired: false,
  feedPhotoClear: true,   // P7 이후 블러 없음이 기본
};

const STORAGE_KEY = "palette_feature_flags";

function loadFlags(): FeatureFlags {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export const FLAGS: FeatureFlags = loadFlags();

/** 개발 콘솔에서 플래그 오버라이드 가능 — DEV 빌드 전용 (prod 번들에서 제외, 페이월/플래그 조작 방지) */
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as any).__setFlag = (key: keyof FeatureFlags, value: unknown) => {
    try {
      const current = loadFlags();
      const next = { ...current, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };
}
