import { useEffect, useState } from "react";
import { AdminLoginScreen } from "./components/AdminLoginScreen";
import { AdminDashboardScreen } from "./components/AdminDashboardScreen";
import { AdminUsersScreen } from "./components/AdminUsersScreen";
import { AdminUserDetailScreen } from "./components/AdminUserDetailScreen";
import { AdminMatchingScreen } from "./components/AdminMatchingScreen";
import { AdminBillingScreen } from "./components/AdminBillingScreen";
import { AdminReportsScreen } from "./components/AdminReportsScreen";
import { AdminWithdrawalsScreen } from "./components/AdminWithdrawalsScreen";
import { AdminTransactionsScreen } from "./components/AdminTransactionsScreen";
import { AdminBlocksScreen } from "./components/AdminBlocksScreen";
import { AdminTipsScreen } from "./components/AdminTipsScreen";
import { AdminLlmUsageScreen } from "./components/AdminLlmUsageScreen";
import { adminAuth, type AdminInfo } from "./lib/adminAuth";

/**
 * 운영자 진입점. pathname 기반 라우팅.
 *
 * 라우트:
 *   /admin                → dashboard (인증 필요)
 *   /admin/login          → 로그인
 *   /admin/users          → 회원 목록
 *   /admin/users/:userId  → 회원 상세
 *   /admin/matching       → 매칭 관리 (AI / 주선자 풀 탭)
 *
 * 사용자 앱과 토큰 storage 분리 (adminAuth).
 */
type Screen =
  | { kind: "dashboard" }
  | { kind: "users" }
  | { kind: "user-detail"; userId: string }
  | { kind: "matching" }
  | { kind: "billing" }
  | { kind: "reports" }
  | { kind: "withdrawals" }
  | { kind: "transactions" }
  | { kind: "blocks" }
  | { kind: "tips" }
  | { kind: "llm" };

function pathToScreen(path: string): Screen {
  if (path === "/admin" || path === "/admin/") return { kind: "dashboard" };
  if (path === "/admin/users") return { kind: "users" };
  const m = path.match(/^\/admin\/users\/([^/]+)$/);
  if (m) return { kind: "user-detail", userId: m[1] };
  if (path === "/admin/matching" || path === "/admin/recommendations") return { kind: "matching" };
  if (path === "/admin/billing") return { kind: "billing" };
  if (path === "/admin/reports") return { kind: "reports" };
  if (path === "/admin/withdrawals") return { kind: "withdrawals" };
  if (path === "/admin/transactions") return { kind: "transactions" };
  if (path === "/admin/blocks") return { kind: "blocks" };
  if (path === "/admin/tips") return { kind: "tips" };
  if (path === "/admin/llm") return { kind: "llm" };
  return { kind: "dashboard" };
}

export default function AdminApp() {
  const path = window.location.pathname;
  const [admin, setAdmin] = useState<AdminInfo | null>(() => adminAuth.getAdmin());
  const [screen, setScreen] = useState<Screen>(() => pathToScreen(path));

  // 브라우저 뒤로/앞으로 대응
  useEffect(() => {
    const onPop = () => setScreen(pathToScreen(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // /admin/login 강제 진입 시 admin null 처리
  useEffect(() => {
    if (path === "/admin/login") setAdmin(null);
  }, [path]);

  const navigate = (to: string) => {
    window.history.pushState(null, "", to);
    setScreen(pathToScreen(to));
  };

  const handleLoginSuccess = (info: AdminInfo) => {
    setAdmin(info);
  };

  if (!admin || path === "/admin/login") {
    return <AdminLoginScreen onSuccess={handleLoginSuccess} />;
  }

  switch (screen.kind) {
    case "dashboard":
      return (
        <AdminDashboardScreen
          admin={admin}
          onNavigate={navigate}
        />
      );
    case "users":
      return (
        <AdminUsersScreen
          onBack={() => navigate("/admin")}
          onSelectUser={(uid) => navigate(`/admin/users/${uid}`)}
        />
      );
    case "user-detail":
      return (
        <AdminUserDetailScreen
          userId={screen.userId}
          onBack={() => navigate("/admin/users")}
        />
      );
    case "matching":
      return <AdminMatchingScreen onBack={() => navigate("/admin")} />;
    case "billing":
      return <AdminBillingScreen onBack={() => navigate("/admin")} />;
    case "reports":
      return <AdminReportsScreen onBack={() => navigate("/admin")} />;
    case "withdrawals":
      return <AdminWithdrawalsScreen onBack={() => navigate("/admin")} />;
    case "transactions":
      return <AdminTransactionsScreen onBack={() => navigate("/admin")} />;
    case "blocks":
      return <AdminBlocksScreen onBack={() => navigate("/admin")} />;
    case "tips":
      return <AdminTipsScreen onBack={() => navigate("/admin")} />;
    case "llm":
      return <AdminLlmUsageScreen onBack={() => navigate("/admin")} />;
  }
}
