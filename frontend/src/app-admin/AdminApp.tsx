import { useEffect, useState } from "react";
import { AdminLoginScreen } from "./components/AdminLoginScreen";
import { AdminDashboardScreen } from "./components/AdminDashboardScreen";
import { adminAuth, type AdminInfo } from "./lib/adminAuth";

/**
 * 운영자 전용 진입점.
 *
 * 라우팅 (state 기반, 사용자 앱과 동일 패턴):
 *   /admin            → 로그인 필요 시 login 화면, 아니면 dashboard
 *   /admin/login      → 항상 login 화면
 *
 * 사용자 앱과 토큰 storage 분리 (adminAuth).
 */
export default function AdminApp() {
  const path = window.location.pathname;
  const [admin, setAdmin] = useState<AdminInfo | null>(() => adminAuth.getAdmin());

  useEffect(() => {
    // 명시적 /admin/login 진입 시에는 로그인 화면 강제
    if (path === "/admin/login") {
      setAdmin(null);
    }
  }, [path]);

  const handleLoginSuccess = (info: AdminInfo) => {
    setAdmin(info);
  };

  if (!admin || path === "/admin/login") {
    return <AdminLoginScreen onSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboardScreen admin={admin} />;
}
