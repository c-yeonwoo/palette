/**
 * mock-account.ts — 데모(시드) 계정 판별 단일 소스
 *
 * 일반 가입 유저에게는 placeholder/mock 데이터가 노출되지 않아야 한다.
 * backend `/api/v1/auth/me` 가 `SeedUserPolicy.isSeed(user)` 결과를
 * `isMockDataAccount` 로 내려주며(ADR 0003), frontend 는 이 헬퍼만으로 분기한다.
 *
 * 규칙: 각 화면에서 이메일을 직접 비교하지 말고 반드시 이 헬퍼를 사용한다.
 */

/** isMockDataAccount 플래그를 가질 수 있는 최소 형태 (AuthUser 호환) */
export interface MockAccountAware {
  isMockDataAccount?: boolean;
}

/**
 * 데모(시드) 계정이면 true.
 * user 가 null/undefined 이거나 플래그가 없으면 false (= 실사용자 취급).
 */
export function isMockDataAccount(
  user: MockAccountAware | null | undefined,
): boolean {
  return user?.isMockDataAccount === true;
}
