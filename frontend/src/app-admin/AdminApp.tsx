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
import { AdminUserActivityScreen } from "./components/AdminUserActivityScreen";
import { AdminMatchmakingFlowScreen } from "./components/AdminMatchmakingFlowScreen";
import { AdminInterviewQuestionsScreen } from "./components/AdminInterviewQuestionsScreen";
import { AdminFieldOptionsScreen } from "./components/AdminFieldOptionsScreen";
import { AdminOnboardingFieldsScreen } from "./components/AdminOnboardingFieldsScreen";
import { AdminApprovalsScreen } from "./components/AdminApprovalsScreen";
import { AdminAlertsScreen } from "./components/AdminAlertsScreen";
import { AdminPalettePickBatchScreen } from "./components/AdminPalettePickBatchScreen";
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
  | { kind: "llm" }
  | { kind: "activity" }
  | { kind: "flow" }
  | { kind: "interviewQuestions" }
  | { kind: "fieldOptions" }
  | { kind: "onboardingFields" }
  | { kind: "approvals" }
  | { kind: "alerts" }
  | { kind: "palettePickBatch" };

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
  if (path === "/admin/activity") return { kind: "activity" };
  if (path === "/admin/flow") return { kind: "flow" };
  if (path === "/admin/interview-questions") return { kind: "interviewQuestions" };
  if (path === "/admin/field-options") return { kind: "fieldOptions" };
  if (path === "/admin/onboarding-fields") return { kind: "onboardingFields" };
  if (path === "/admin/approvals") return { kind: "approvals" };
  if (path === "/admin/alerts") return { kind: "alerts" };
  if (path === "/admin/palette-pick-batch") return { kind: "palettePickBatch" };
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
    case "activity":
      return <AdminUserActivityScreen onBack={() => navigate("/admin")} />;
    case "flow":
      return <AdminMatchmakingFlowScreen onBack={() => navigate("/admin")} />;
    case "interviewQuestions":
      return <AdminInterviewQuestionsScreen onBack={() => navigate("/admin")} />;
    case "fieldOptions":
      return <AdminFieldOptionsScreen onBack={() => navigate("/admin")} />;
    case "onboardingFields":
      return <AdminOnboardingFieldsScreen onBack={() => navigate("/admin")} />;
    case "approvals":
      return <AdminApprovalsScreen onBack={() => navigate("/admin")} />;
    case "alerts":
      return <AdminAlertsScreen onBack={() => navigate("/admin")} onNavigate={navigate} />;
    case "palettePickBatch":
      return <AdminPalettePickBatchScreen onBack={() => navigate("/admin")} />;
  }
}
