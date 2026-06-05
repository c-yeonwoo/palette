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
        {/* 필기체 P 마크 + Wordmark + slogan — 프리미엄 brand (Snell Roundhand vectorized) */}
        <div className="text-center flex flex-col items-center gap-6">
          {/* Palette 심볼 — 필기체 P (gold) */}
          <svg width="92" height="92" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Palette">
            <path transform="translate(58.76 399.54) scale(0.4038 -0.4038)" fill="#C9A86A"
              d="M979 723Q956 715 930.5 705.5Q905 696 885 684Q929 659 948.0 623.0Q967 587 967 539Q967 501 947.5 467.0Q928 433 898.0 407.0Q868 381 831.5 365.5Q795 350 762 350Q727 350 708.5 364.5Q690 379 690 402Q690 416 699.5 426.5Q709 437 724 437Q731 437 739.0 432.5Q747 428 750 421Q745 415 741.5 409.0Q738 403 738 395Q738 378 748.0 370.0Q758 362 774 362Q800 362 824.5 381.0Q849 400 869.0 431.0Q889 462 901.0 500.5Q913 539 913 578Q913 614 902.5 637.0Q892 660 870 675Q818 645 775.0 591.0Q732 537 691.5 471.5Q651 406 610.0 335.5Q569 265 521.5 201.5Q474 138 416.0 87.0Q358 36 283 10V8Q327 1 365.5 -1.5Q404 -4 449 -4Q598 -4 707.0 65.5Q816 135 895 257L903 253Q858 185 811.5 134.5Q765 84 710.0 50.5Q655 17 589.5 0.5Q524 -16 440 -16Q400 -16 352.5 -10.0Q305 -4 267 4Q258 4 213.0 -6.0Q168 -16 90 -16Q40 -16 19.0 -8.0Q-2 0 -2 13Q-2 26 10.0 34.0Q22 42 52 42Q76 42 99.0 40.0Q122 38 147.5 34.5Q173 31 201.5 25.5Q230 20 265 13Q309 23 353.0 69.0Q397 115 442.5 180.5Q488 246 535.5 322.5Q583 399 633.5 470.5Q684 542 739.0 599.0Q794 656 855 683Q834 693 804.0 696.5Q774 700 750 700Q696 700 635.5 686.5Q575 673 516.0 648.5Q457 624 403.5 588.0Q350 552 309.0 507.5Q268 463 244.0 409.5Q220 356 220 296Q220 248 242.5 222.0Q265 196 309 196Q347 196 380.0 215.5Q413 235 437.5 265.5Q462 296 476.0 333.5Q490 371 490 406V444H502V406Q502 369 487.0 329.5Q472 290 446.0 257.5Q420 225 383.5 204.5Q347 184 305 184Q279 184 257.5 194.0Q236 204 220.5 221.0Q205 238 196.5 260.5Q188 283 188 309Q188 355 209.5 402.5Q231 450 269.0 495.0Q307 540 360.0 579.5Q413 619 476.0 648.5Q539 678 610.5 695.0Q682 712 756 712Q794 712 821.0 706.5Q848 701 871 691Q921 713 977 727Z" />
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