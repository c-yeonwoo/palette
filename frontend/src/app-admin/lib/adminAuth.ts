/**
 * Admin 토큰 관리. 사용자 토큰과 storage key 분리 (충돌 방지).
 * 같은 디바이스에서 사용자 + 운영자 로그인이 공존 가능.
 */

const KEY = {
  ACCESS: "palette.admin.access",
  REFRESH: "palette.admin.refresh",
  ADMIN: "palette.admin.info",
} as const;

export interface AdminInfo {
  userId: string;
  email: string;
  nickname: string;
  lastLoginAt: string;
}

export const adminAuth = {
  getAccessToken(): string | null {
    return localStorage.getItem(KEY.ACCESS);
  },
  getAdmin(): AdminInfo | null {
    const raw = localStorage.getItem(KEY.ADMIN);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminInfo;
    } catch {
      return null;
    }
  },
  setSession(accessToken: string, refreshToken: string, admin: AdminInfo) {
    localStorage.setItem(KEY.ACCESS, accessToken);
    localStorage.setItem(KEY.REFRESH, refreshToken);
    localStorage.setItem(KEY.ADMIN, JSON.stringify(admin));
  },
  clear() {
    localStorage.removeItem(KEY.ACCESS);
    localStorage.removeItem(KEY.REFRESH);
    localStorage.removeItem(KEY.ADMIN);
  },
  isLoggedIn(): boolean {
    return !!localStorage.getItem(KEY.ACCESS);
  },
};
