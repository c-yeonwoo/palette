import { useEffect, useState } from "react";
import { AdminLoginScreen } from "./components/AdminLoginScreen";
import { AdminDashboardScreen } from "./components/AdminDashboardScreen";
import { AdminUsersScreen } from "./components/AdminUsersScreen";
import { AdminUserDetailScreen } from "./components/AdminUserDetailScreen";
import { adminAuth, type AdminInfo } from "./lib/adminAuth";

/**
 * 운영자 진입점. pathname 기반 라우팅.
 *
 * 라우트:
 *   /admin                → dashboard (인증 필요)
 *   /admin/login          → 로그인
 *   /admin/users          → 회원 목록
 *   /admin/users/:userId  → 회원 상세
 *
 * 사용자 앱과 토큰 storage 분리 (adminAuth).
 */
type Screen =
  | { kind: "dashboard" }
  | { kind: "users" }
  | { kind: "user-detail"; userId: string };

function pathToScreen(path: string): Screen {
  if (path === "/admin" || path === "/admin/") return { kind: "dashboard" };
  if (path === "/admin/users") return { kind: "users" };
  const m = path.match(/^\/admin\/users\/([^/]+)$/);
  if (m) return { kind: "user-detail", userId: m[1] };
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
  }
}
