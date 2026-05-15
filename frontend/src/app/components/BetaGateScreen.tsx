/**
 * BetaGateScreen — 베타 코드 입력 게이트.
 *
 * 동작:
 * 1. 앱 시작 시 `GET /api/v1/auth/beta-code/status` 조회
 * 2. enabled=false → 게이트 통과 (정식 출시 모드)
 * 3. enabled=true + 로컬에 인증 마커 없음 → 이 화면 표시
 * 4. 코드 입력 → `POST /verify` → 성공 시 백엔드 쿠키 + 프론트 localStorage 마커 저장
 */

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";

const BETA_PASSED_KEY = "palette_beta_passed";

interface BetaGateScreenProps {
  onPassed: () => void;
}

export function BetaGateScreen({ onPassed }: BetaGateScreenProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 마운트 시 게이트 상태 확인
  useEffect(() => {
    (async () => {
      try {
        const status = await api.get<{ enabled: boolean }>(
          "/api/v1/auth/beta-code/status"
        );
        if (!status.enabled) {
          // 베타 게이트 비활성 → 바로 통과
          localStorage.setItem(BETA_PASSED_KEY, "1");
          onPassed();
        }
      } catch {
        /* 무시 — 사용자가 직접 입력 가능 */
      }
    })();
  }, [onPassed]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error("베타 코드를 입력해주세요");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/api/v1/auth/beta-code/verify", { code: code.trim() });
      localStorage.setItem(BETA_PASSED_KEY, "1");
      toast.success("환영합니다! 🎨");
      onPassed();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("INVALID_BETA_CODE") || msg.includes("403")) {
        toast.error("유효하지 않은 베타 코드입니다");
      } else {
        toast.error("코드 검증에 실패했습니다");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 p-4">
      <div className="bg-card rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
        <div className="px-7 py-8 space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <div className="text-4xl">🎨</div>
            <h1 className="text-2xl font-bold text-foreground">Palette</h1>
            <p className="text-sm text-muted-foreground">
              클로즈드 베타 진행 중
            </p>
          </div>

          {/* 안내 */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-xs text-orange-800 leading-relaxed">
            지금은 초대받은 분만 사용 가능해요.
            <br />
            받으신 베타 코드를 입력해주세요.
          </div>

          {/* 입력 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              베타 코드
            </label>
            <Input
              type="text"
              placeholder="palette-beta-xxxx"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-12 text-sm font-semibold"
          >
            {submitting ? "확인 중..." : "입장하기"}
          </Button>

          <p className="text-[11px] text-muted-foreground text-center">
            베타 코드가 없으신가요? 인스타그램{" "}
            <span className="text-orange-500 font-medium">@palette.kr</span>{" "}
            에서 신청해주세요
          </p>
        </div>
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
