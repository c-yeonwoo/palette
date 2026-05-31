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
        {/* Logo and Slogan */}
        <div className="text-center space-y-4">
          {/* Palette 로고 — 물감 팔레트 SVG */}
          <div className="flex items-center justify-center">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* 팔레트 본체 */}
              <ellipse cx="36" cy="38" rx="28" ry="24" fill="white" fillOpacity="0.95"/>
              {/* 엄지 구멍 */}
              <ellipse cx="48" cy="26" rx="7" ry="7" fill="transparent" stroke="white" strokeOpacity="0.95" strokeWidth="3"/>
              {/* 물감 dot — 5색 */}
              <circle cx="22" cy="34" r="5" fill="#F97316"/>
              <circle cx="32" cy="26" r="5" fill="#EC4899"/>
              <circle cx="44" cy="34" r="5" fill="#3B82F6"/>
              <circle cx="42" cy="46" r="5" fill="#22C55E"/>
              <circle cx="28" cy="46" r="5" fill="#A855F7"/>
            </svg>
          </div>
          <h1 className="text-white text-[2.5rem] font-bold tracking-tight leading-none">팔레트</h1>
          <p className="text-white/85 text-base">지인이 보증하는 만남</p>
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