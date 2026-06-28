import { useState } from "react";
import { Button } from "./ui/button";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../lib/auth/authService";

interface LoginScreenProps {
  onEmailLogin?: () => void;
  /** Apple 로그인 성공 시 호출 — 이메일 로그인 성공과 동일한 후처리(현재 유저 로드 + 라우팅). */
  onLoginSuccess?: () => void;
}

/**
 * iOS WebView/native 에서만 Apple Sign In 버튼 노출.
 * Apple App Store Review 4.8 — 다른 third-party SSO 가 있는 앱은 Apple Sign In 의무.
 * 네이티브 플로우: @capacitor-community/apple-sign-in 으로 identityToken 받아
 * POST /api/v1/auth/oauth/apple 검증 → JWT 발급.
 */
function isIOSNative(): boolean {
  // Capacitor 환경 — iOS 네이티브 셸. 웹/Android 에선 false.
  return (
    typeof window !== "undefined" &&
    (window as any).Capacitor?.getPlatform?.() === "ios"
  );
}

export function LoginScreen({ onEmailLogin, onLoginSuccess }: LoginScreenProps) {
  const showAppleSignIn = isIOSNative();
  const [appleLoading, setAppleLoading] = useState(false);

  const handleKakaoLogin = () => {
    authService.loginWithKakao();
  };

  const handleAppleLogin = async () => {
    if (appleLoading) return;
    setAppleLoading(true);
    try {
      // 동적 import — 웹 번들에 네이티브 전용 플러그인이 끌려오지 않도록.
      const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
      const result = await SignInWithApple.authorize({
        clientId: "kr.ai.palette",
        // 네이티브 플로우에선 redirectURI 가 실제로 사용되지 않지만 플러그인 타입상 필요.
        redirectURI: "https://www.palette.ai.kr/auth/apple/callback",
        scopes: "email name",
      });

      const identityToken = result.response?.identityToken;
      if (!identityToken) {
        toast.error("Apple 로그인 토큰을 받지 못했어요. 다시 시도해주세요.");
        return;
      }

      const displayName =
        [result.response?.givenName, result.response?.familyName]
          .filter(Boolean)
          .join(" ")
          .trim() || undefined;

      await authService.loginWithAppleNative(
        identityToken,
        result.response?.authorizationCode,
        displayName,
      );

      toast.success("Apple 계정으로 로그인되었습니다!");
      onLoginSuccess?.();
    } catch (error: any) {
      // 사용자가 시트를 닫은 경우(취소)는 조용히 무시.
      const msg = String(error?.message ?? "");
      const canceled =
        error?.code === "1001" ||
        /cancel/i.test(msg) ||
        /1001/.test(msg);
      if (canceled) return;
      console.error("Apple Sign In failed:", error);
      toast.error(msg || "Apple 로그인에 실패했어요. 다시 시도해주세요.");
    } finally {
      setAppleLoading(false);
    }
  };

  const handleEmailLogin = () => {
    if (onEmailLogin) {
      onEmailLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/log-bg.png')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md w-full">
        {/* 필기체 P 마크 + Wordmark + slogan — 프리미엄 brand (Snell Roundhand vectorized) */}
        <div className="text-center flex flex-col items-center gap-6">
          {/* Palette 심볼 — 흰 카드 + 컬러 하트 (앱아이콘과 동일) */}
          <svg width="92" height="92" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Palette">
            <defs>
              <linearGradient id="palette-heart-login" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FF7E5F" />
                <stop offset="0.4" stopColor="#FFB088" />
                <stop offset="0.72" stopColor="#FFD166" />
                <stop offset="1" stopColor="#5EEAD4" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="24" fill="#FFFFFF" />
            <g transform="translate(50 50) scale(0.62) translate(-50 -54)">
              <path d="M50 80 C16 56 20 28 40 28 C49 28 50 37 50 39 C50 37 51 28 60 28 C80 28 84 56 50 80 Z" fill="url(#palette-heart-login)" />
            </g>
          </svg>
          <div className="space-y-3">
            <h1
              className="text-white text-[2.75rem] font-semibold uppercase tracking-[0.32em] leading-none"
              style={{ textIndent: '0.32em' }}  /* letter-spacing 마지막 글자 뒤 공백 보정 — 중앙정렬 시각 균형 */
            >
              Palette
            </h1>
            <p className="text-white/80 text-[0.95rem] tracking-wide">
              지인이 그려주는 인연
            </p>
          </div>
        </div>

        {/* Login Buttons */}
        <div className="w-full space-y-3 mt-8">
          <Button
            onClick={handleKakaoLogin}
            className="w-full h-14 bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c-4.97 0-9 3.58-9 8 0 1.75.58 3.36 1.55 4.68L3 21l6.5-3.5c.79.28 1.64.43 2.5.43 4.97 0 9-3.58 9-8s-4.03-8-9-8z"/>
            </svg>
            카카오로 시작하기
          </Button>

          {showAppleSignIn && (
            <Button
              onClick={handleAppleLogin}
              className="w-full h-14 bg-black hover:bg-neutral-900 text-white shadow-lg"
              aria-label="Apple 로 시작하기"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.4 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.44zM21.66 17.6c-.39.9-.864 1.81-1.595 2.94-.951 1.47-2.288 3.3-3.945 3.32-1.46.02-1.836-.95-3.823-.94-1.988.02-2.403.95-3.864.93-1.657-.02-2.929-1.7-3.88-3.16-2.659-4.13-2.95-8.97-1.3-11.55.967-1.52 2.522-2.41 3.998-2.43 1.508-.03 2.927.98 3.85.98.92 0 2.65-1.21 4.48-1.04.76.03 2.92.31 4.31 2.32-.11.07-2.57 1.5-2.55 4.49.04 3.58 3.15 4.78 3.18 4.79z" />
              </svg>
              Apple 로 시작하기
            </Button>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black/40 text-white/70">또는</span>
            </div>
          </div>

          <Button
            onClick={handleEmailLogin}
            variant="outline"
            className="w-full h-14 bg-white/95 hover:bg-white border-white/40 text-text-primary shadow-lg"
          >
            <Mail className="w-5 h-5 mr-2" />
            이메일로 시작하기
          </Button>
        </div>

        {/* Footer Text */}
        <p className="text-white/70 text-sm text-center mt-6 px-4">
          시작하기 버튼을 누르면 서비스 이용약관 및<br />
          개인정보 처리방침에 동의하는 것으로 간주됩니다
        </p>

      </div>
    </div>
  );
}