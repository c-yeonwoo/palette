import { useState } from "react";
import { adminApi } from "../lib/adminApi";
import { adminAuth, type AdminInfo } from "../lib/adminAuth";

interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  admin: AdminInfo;
}

interface Props {
  onSuccess: (admin: AdminInfo) => void;
}

export function AdminLoginScreen({ onSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.post<AdminLoginResponse>(
        "/api/v1/admin/auth/login",
        { email, password },
        { requiresAuth: false },
      );
      adminAuth.setSession(res.accessToken, res.refreshToken, res.admin);
      onSuccess(res.admin);
      // pathname 정리 (login → dashboard)
      window.history.replaceState(null, "", "/admin");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "로그인 실패";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.18em] text-muted-foreground mb-1">팔레트 운영자</p>
          <h1 className="text-2xl font-bold text-foreground">Admin Console</h1>
          <p className="text-sm text-muted-foreground mt-2">운영자 계정으로만 로그인 가능합니다</p>
        </div>

        <form onSubmit={submit} className="space-y-4 bg-card border border-border rounded-2xl p-6 shadow-card">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">이메일</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@palette.kr"
              className="w-full h-11 px-3 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-border bg-card text-sm focus:border-primary focus:outline-none"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          운영자 계정이 없으면 시스템 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
