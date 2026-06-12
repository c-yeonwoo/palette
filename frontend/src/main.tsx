
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import AdminApp from "./app-admin/AdminApp.tsx";
  import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
  import "./styles/index.css";

  // pathname 으로 진입점 분기 — 같은 SPA 안에서 사용자 앱과 운영자 앱 분리
  // 라우팅 라이브러리 없이 단순 prefix 분기 (state-based 라우팅 유지)
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      {isAdminRoute ? (
        <AdminApp />
      ) : (
        // 사용자 앱은 모바일 프레임으로 감싼다 (웹 데스크탑에서도 모바일 폭 고정).
        // 어드민은 감싸지 않아 풀 화면 유지. 프레임 스타일은 styles/mobile-frame.css.
        <div className="app-frame-root">
          <div className="app-frame" id="appScroll">
            <App />
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
