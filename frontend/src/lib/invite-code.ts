/**
 * invite-code.ts — F12 초대 코드 생성·검증
 *
 * 규칙:
 *   - 6자 영숫자
 *   - 헷갈리는 문자 제외: 0/O/1/I/l
 *   - 사용자당 영구 고정 코드 1개 (userId 해시 기반)
 *   - localStorage 키: "palette_invite_code"
 */

const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // 0,1,I,O,l 제외

/** userId 기반 결정론적 코드 생성 (항상 동일 출력) */
function deterministicCode(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
  }
  let code = "";
  let n = Math.abs(hash);
  for (let i = 0; i < 6; i++) {
    code += CHARS[n % CHARS.length];
    n = Math.floor(n / CHARS.length) || (n + 7919); // 소수 salt
  }
  return code;
}

/** 사용자의 초대 코드 반환 (없으면 생성 후 저장) */
export function getMyInviteCode(userId = "me-001"): string {
  const STORAGE_KEY = "palette_invite_code";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const code = deterministicCode(userId);
    localStorage.setItem(STORAGE_KEY, code);
    return code;
  } catch {
    return deterministicCode(userId);
  }
}

/** 초대 링크 생성 */
export function buildInviteLink(code: string): string {
  return `https://palette.app/invite/${code}`;
}

/** 일일 노출 한도 체크 (어뷰징 방지 — 하루 10회) */
const DAILY_LIMIT = 10;
export function checkDailyShareLimit(): { allowed: boolean; remaining: number } {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem("palette_invite_shares");
    const data = raw ? JSON.parse(raw) : {};
    const count = data[today] ?? 0;
    const allowed = count < DAILY_LIMIT;
    return { allowed, remaining: Math.max(0, DAILY_LIMIT - count) };
  } catch {
    return { allowed: true, remaining: DAILY_LIMIT };
  }
}

export function recordShare(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem("palette_invite_shares");
    const data = raw ? JSON.parse(raw) : {};
    data[today] = (data[today] ?? 0) + 1;
    localStorage.setItem("palette_invite_shares", JSON.stringify(data));
  } catch {}
}
