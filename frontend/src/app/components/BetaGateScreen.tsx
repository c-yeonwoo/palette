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
          <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Palette">
            <defs>
              <linearGradient id="palette-heart-beta" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FF7E5F" />
                <stop offset="0.4" stopColor="#FFB088" />
                <stop offset="0.72" stopColor="#FFD166" />
                <stop offset="1" stopColor="#5EEAD4" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" rx="24" fill="#FFFFFF" />
            <g transform="translate(50 50) scale(0.62) translate(-50 -54)">
              <path d="M50 80 C16 56 20 28 40 28 C49 28 50 37 50 39 C50 37 51 28 60 28 C80 28 84 56 50 80 Z" fill="url(#palette-heart-beta)" />
            </g>
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#FF7E5F]/40 bg-[#FF7E5F]/10 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7E5F]" />
            <span className="text-[#FF7E5F] text-[0.7rem] font-semibold uppercase tracking-[0.24em]">
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
              className="w-full h-14 px-4 rounded-2xl bg-white/10 border border-white/20 text-white text-base placeholder-white/30 tracking-[0.2em] text-center font-mono backdrop-blur-md focus:outline-none focus:border-[#FF7E5F]/60 focus:bg-white/15 transition-colors"
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
          인스타그램 <span className="text-[#FF7E5F] font-medium">@palette.kr</span> 에서 신청해주세요
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
