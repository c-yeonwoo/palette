/**
 * 온보딩 진척도 — localStorage 기반 단순 플래그 SoT. O-001.
 *
 * 가벼운 baseline: 백엔드 추적 X, 사용자 디바이스에만. 다른 기기·로그인 시 초기화.
 * 정식 출시 시점에 서버 측 추적으로 승격 가능 (백로그 O-003).
 */

const KEYS = {
  viewedProfile: "palette:onboarding:viewedProfile:v1",
  sentMatchRequest: "palette:onboarding:sentMatchRequest:v1",
} as const;

export const onboardingProgress = {
  markViewedProfile(): void {
    try { localStorage.setItem(KEYS.viewedProfile, "1"); } catch {}
  },
  markSentMatchRequest(): void {
    try { localStorage.setItem(KEYS.sentMatchRequest, "1"); } catch {}
  },
  hasViewedProfile(): boolean {
    try { return localStorage.getItem(KEYS.viewedProfile) === "1"; } catch { return false; }
  },
  hasSentMatchRequest(): boolean {
    try { return localStorage.getItem(KEYS.sentMatchRequest) === "1"; } catch { return false; }
  },
};
