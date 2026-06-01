export interface MockdataUserLike {
  email?: string | null;
  nickname?: string | null;
  accountType?: string | null;
}

const MOCK_KEYWORDS = ["mock", "seed", "test", "demo"];

export function isMockdataUser(user: MockdataUserLike | null | undefined): boolean {
  if (!user) return false;
  const email = (user.email ?? "").toLowerCase();
  const nickname = (user.nickname ?? "").toLowerCase();

  return MOCK_KEYWORDS.some((k) => email.includes(k) || nickname.includes(k));
}
