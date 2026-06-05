import { Button } from "./ui/button";
import { Mail } from "lucide-react";
import { authService } from "../../lib/auth/authService";

interface LoginScreenProps {
  onEmailLogin?: () => void;
}

export function LoginScreen({ onEmailLogin }: LoginScreenProps) {
  const handleKakaoLogin = () => {
    authService.loginWithKakao();
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
        {/* 심볼 마크 + Wordmark + slogan — 두 색이 만나 제3의 색 (지인이 그려주는 인연) */}
        <div className="text-center flex flex-col items-center gap-5">
          {/* Palette 심볼 — 두 원의 겹침 */}
          <svg width="64" height="64" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Palette">
            <defs>
              <clipPath id="login-mark-left"><circle cx="206" cy="256" r="116" /></clipPath>
            </defs>
            <circle cx="206" cy="256" r="116" fill="#E0795C" />
            <circle cx="306" cy="256" r="116" fill="#4E79A8" />
            <g clipPath="url(#login-mark-left)">
              <circle cx="306" cy="256" r="116" fill="#7C5C75" />
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