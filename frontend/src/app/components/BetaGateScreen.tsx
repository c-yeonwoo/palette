/**
 * BetaGateScreen — 베타 코드 입력 게이트.
 *
 * LoginScreen 과 동일 디자인 결: 다크 배경 + gold 필기체 P + 반투명 입력/버튼.
 *
 * 동작:
 * 1. 앱 시작 시 `GET /api/v1/auth/beta-code/status` 조회
 * 2. enabled=false → 게이트 통과 (정식 출시 모드)
 * 3. enabled=true + 로컬에 인증 마커 없음 → 이 화면 표시
 * 4. 코드 입력 → `POST /verify` → 성공 시 백엔드 쿠키 + 프론트 localStorage 마커 저장
 */

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";

const BETA_PASSED_KEY = "palette_beta_passed";

interface BetaGateScreenProps {
  onPassed: () => void;
}

export function BetaGateScreen({ onPassed }: BetaGateScreenProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // onPassed 를 ref 로 보관 (부모 매 렌더마다 새 함수 reference 받아도
  // useEffect 가 재실행되지 않도록)
  const onPassedRef = useRef(onPassed);
  useEffect(() => {
    onPassedRef.current = onPassed;
  }, [onPassed]);

  // 마운트 시 한 번만 게이트 상태 확인
  // ⚠️ requiresAuth=false 필수 — 미로그인 상태에서 호출되는데
  //    apiClient 기본값(true)이면 토큰 없을 때 '/' 로 리다이렉트시켜서 무한 reload
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await api.get<{ enabled: boolean }>(
          "/api/v1/auth/beta-code/status",
          { requiresAuth: false }
        );
        if (!cancelled && !status.enabled) {
          // 베타 게이트 비활성 → 바로 통과
          localStorage.setItem(BETA_PASSED_KEY, "1");
          onPassedRef.current();
        }
      } catch {
        /* 무시 — 사용자가 직접 입력 가능 */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("베타 코드를 입력해주세요");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(
        "/api/v1/auth/beta-code/verify",
        { code: code.trim() },
        { requiresAuth: false }
      );
      localStorage.setItem(BETA_PASSED_KEY, "1");
      toast.success("환영합니다");
      onPassed();
    } catch (err: unknown) {
      // 에러 사유를 사용자에게 명확히 노출 (HTTP code + 백엔드 메시지)
      const e = err as { status?: number; message?: string };
      const status = e?.status;
      const msg = e?.message ?? String(err);
      if (status === 401) {
        toast.error("서버 인증 오류 (401) — 백엔드 주소 설정을 확인해주세요", {
          description: msg,
          duration: 6000,
        });
      } else if (status === 403 || msg.includes("INVALID_BETA_CODE")) {
        toast.error("유효하지 않은 베타 코드입니다");
      } else if (status === 0 || msg.includes("Failed to fetch")) {
        toast.error("백엔드에 연결할 수 없어요 — 서버가 켜져 있는지 확인", {
          description: msg,
          duration: 6000,
        });
      } else {
        toast.error(`코드 검증 실패${status ? ` (HTTP ${status})` : ""}`, {
          description: msg,
          duration: 6000,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Image — LoginScreen 과 동일 backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/log-bg.png')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md w-full">
        {/* 필기체 P 마크 + Wordmark + 베타 슬러그 — LoginScreen 결 */}
        <div className="text-center flex flex-col items-center gap-6">
          <svg width="76" height="76" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Palette">
            <path transform="translate(58.76 399.54) scale(0.4038 -0.4038)" fill="#E8896A"
              d="M979 723Q956 715 930.5 705.5Q905 696 885 684Q929 659 948.0 623.0Q967 587 967 539Q967 501 947.5 467.0Q928 433 898.0 407.0Q868 381 831.5 365.5Q795 350 762 350Q727 350 708.5 364.5Q690 379 690 402Q690 416 699.5 426.5Q709 437 724 437Q731 437 739.0 432.5Q747 428 750 421Q745 415 741.5 409.0Q738 403 738 395Q738 378 748.0 370.0Q758 362 774 362Q800 362 824.5 381.0Q849 400 869.0 431.0Q889 462 901.0 500.5Q913 539 913 578Q913 614 902.5 637.0Q892 660 870 675Q818 645 775.0 591.0Q732 537 691.5 471.5Q651 406 610.0 335.5Q569 265 521.5 201.5Q474 138 416.0 87.0Q358 36 283 10V8Q327 1 365.5 -1.5Q404 -4 449 -4Q598 -4 707.0 65.5Q816 135 895 257L903 253Q858 185 811.5 134.5Q765 84 710.0 50.5Q655 17 589.5 0.5Q524 -16 440 -16Q400 -16 352.5 -10.0Q305 -4 267 4Q258 4 213.0 -6.0Q168 -16 90 -16Q40 -16 19.0 -8.0Q-2 0 -2 13Q-2 26 10.0 34.0Q22 42 52 42Q76 42 99.0 40.0Q122 38 147.5 34.5Q173 31 201.5 25.5Q230 20 265 13Q309 23 353.0 69.0Q397 115 442.5 180.5Q488 246 535.5 322.5Q583 399 633.5 470.5Q684 542 739.0 599.0Q794 656 855 683Q834 693 804.0 696.5Q774 700 750 700Q696 700 635.5 686.5Q575 673 516.0 648.5Q457 624 403.5 588.0Q350 552 309.0 507.5Q268 463 244.0 409.5Q220 356 220 296Q220 248 242.5 222.0Q265 196 309 196Q347 196 380.0 215.5Q413 235 437.5 265.5Q462 296 476.0 333.5Q490 371 490 406V444H502V406Q502 369 487.0 329.5Q472 290 446.0 257.5Q420 225 383.5 204.5Q347 184 305 184Q279 184 257.5 194.0Q236 204 220.5 221.0Q205 238 196.5 260.5Q188 283 188 309Q188 355 209.5 402.5Q231 450 269.0 495.0Q307 540 360.0 579.5Q413 619 476.0 648.5Q539 678 610.5 695.0Q682 712 756 712Q794 712 821.0 706.5Q848 701 871 691Q921 713 977 727Z" />
          </svg>
          <div className="space-y-3">
            <h1
              className="text-white text-[2.25rem] font-semibold uppercase tracking-[0.32em] leading-none"
              style={{ textIndent: '0.32em' }}
            >
              Palette
            </h1>
            <p className="text-white/80 text-[0.9rem] tracking-wide">
              지인이 그려주는 인연
            </p>
          </div>

          {/* Closed Beta 배지 — gold accent */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E8896A]/40 bg-[#E8896A]/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8896A]" />
            <span className="text-[#E8896A] text-[0.7rem] font-semibold uppercase tracking-[0.24em]">
              Closed Beta
            </span>
          </div>
        </div>

        {/* 안내 + 입력 카드 — 반투명 검정 */}
        <div className="w-full mt-2 space-y-4">
          <p className="text-white/85 text-sm text-center leading-relaxed">
            지금은 초대받은 분만 사용 가능해요.<br />
            받으신 베타 코드를 입력해주세요.
          </p>

          <div className="space-y-2.5">
            <label className="block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/60">
              베타 코드
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
              placeholder="ABCD-1234"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full h-14 px-4 rounded-2xl bg-white/10 border border-white/20 text-white text-base placeholder-white/30 tracking-[0.2em] text-center font-mono backdrop-blur-md focus:outline-none focus:border-[#E8896A]/60 focus:bg-white/15 transition-colors"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 bg-white text-black hover:bg-white/95 disabled:bg-white/40 disabled:text-black/40 shadow-lg font-semibold text-sm tracking-wide"
          >
            {submitting ? "확인 중..." : "입장하기"}
          </Button>
        </div>

        {/* Footer — 인스타 신청 안내 */}
        <p className="text-white/60 text-xs text-center mt-2 leading-relaxed">
          베타 코드가 없으신가요?<br />
          인스타그램 <span className="text-[#E8896A] font-medium">@palette.kr</span> 에서 신청해주세요
        </p>
      </div>
    </div>
  );
}

/** 베타 게이트 통과 여부 확인 (앱 부팅 시 사용) */
export function hasBetaPassed(): boolean {
  return localStorage.getItem(BETA_PASSED_KEY) === "1";
}

/** 베타 마커 클리어 (개발용/로그아웃용) */
export function clearBetaPassed() {
  localStorage.removeItem(BETA_PASSED_KEY);
}
