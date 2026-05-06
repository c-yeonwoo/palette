/**
 * NICE 본인인증 모달
 *
 * 플로우:
 * 1. 모달 오픈 → 백엔드에서 NICE 파라미터 요청
 * 2a. NICE 설정 있음 → NICE 팝업 오픈 (표준창 v2.0)
 * 2b. DEV 모드 → 이름/전화번호 직접 입력 후 /dev-bypass 호출
 * 3. 팝업 닫힘 감지 → /result/{requestNo} polling
 * 4. onVerified(phoneNumber, name) 콜백
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";

const NICE_FORM_URL = "https://nice.checkplus.co.kr/CheckPlusSafeModel/checkplus.cb";
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 300_000; // 5분

interface NiceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phoneNumber: string, name: string) => void;
}

interface NiceRequestResponse {
  mode: "nice" | "dev" | "error";
  tokenVersionId?: string;
  encData?: string;
  integrityValue?: string;
  requestNo?: string;
  errorMessage?: string;
}

export default function NiceVerificationModal({
  isOpen,
  onClose,
  onVerified,
}: NiceVerificationModalProps) {
  const [step, setStep] = useState<"idle" | "loading" | "nice-popup" | "dev-form" | "polling">("idle");
  const [requestNo, setRequestNo] = useState<string | null>(null);
  const [devName, setDevName] = useState("");
  const [devPhone, setDevPhone] = useState("");
  const [devSubmitting, setDevSubmitting] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const popupRef = useRef<Window | null>(null);
  const niceFormRef = useRef<HTMLFormElement | null>(null);

  // 팝업 닫힘 감지 → polling 시작
  useEffect(() => {
    if (step !== "nice-popup") return;

    const checkPopup = setInterval(() => {
      if (popupRef.current?.closed) {
        clearInterval(checkPopup);
        if (requestNo) startPolling(requestNo);
      }
    }, 500);

    return () => clearInterval(checkPopup);
  }, [step, requestNo]);

  // NICE postMessage 수신 (팝업 → 부모)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "NICE_COMPLETE") {
        if (requestNo) startPolling(requestNo);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [requestNo]);

  // 모달 닫히면 정리
  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      popupRef.current?.close();
      setStep("idle");
      setRequestNo(null);
      setDevName("");
      setDevPhone("");
    }
  }, [isOpen]);

  async function handleStart() {
    setStep("loading");
    try {
      const res = await api.post<NiceRequestResponse>("/api/v1/identity/nice/request", {});

      if (res.mode === "dev") {
        setRequestNo(res.requestNo ?? null);
        setStep("dev-form");
        return;
      }

      if (res.mode === "error") {
        toast.error(res.errorMessage ?? "본인인증 서비스에 연결할 수 없습니다");
        setStep("idle");
        return;
      }

      // NICE 팝업 오픈 (form POST targeting popup)
      setRequestNo(res.requestNo ?? null);
      openNicePopup(res);
      setStep("nice-popup");
    } catch {
      toast.error("본인인증 준비에 실패했습니다");
      setStep("idle");
    }
  }

  function openNicePopup(res: NiceRequestResponse) {
    const popup = window.open(
      "",
      "niceAuth",
      "width=500,height=700,scrollbars=yes,resizable=yes"
    );
    if (!popup) {
      toast.error("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");
      setStep("idle");
      return;
    }
    popupRef.current = popup;

    // form POST를 팝업 안에서 실행
    const form = document.createElement("form");
    form.method = "POST";
    form.action = NICE_FORM_URL;
    form.target = "niceAuth";

    const fields: Record<string, string> = {
      m: "checkplusSafe",
      token_version_id: res.tokenVersionId ?? "",
      enc_data: res.encData ?? "",
      integrity_value: res.integrityValue ?? "",
    };

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  function startPolling(reqNo: string) {
    setStep("polling");
    const start = Date.now();

    pollTimerRef.current = setInterval(async () => {
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        stopPolling();
        toast.error("본인인증 시간이 초과되었습니다");
        setStep("idle");
        return;
      }

      try {
        const res = await api.get<{ status: string; phoneNumber?: string; name?: string; error?: string }>(
          `/api/v1/identity/nice/result/${reqNo}`
        );

        if (res.status === "completed" && res.phoneNumber && res.name) {
          stopPolling();
          toast.success("본인인증이 완료되었습니다");
          onVerified(res.phoneNumber, res.name);
          onClose();
        } else if (res.status === "failed") {
          stopPolling();
          toast.error(res.error ?? "본인인증에 실패했습니다");
          setStep("idle");
        }
        // status === "pending" → 계속 polling
      } catch {
        // 네트워크 오류는 무시하고 계속 polling
      }
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }

  // DEV bypass 제출
  async function handleDevSubmit() {
    if (!devName.trim() || !devPhone.trim()) {
      toast.error("이름과 전화번호를 입력해주세요");
      return;
    }
    setDevSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; phoneNumber?: string; name?: string }>(
        "/api/v1/identity/nice/dev-bypass",
        { name: devName.trim(), phoneNumber: devPhone.replace(/-/g, "") }
      );
      if (res.success && res.phoneNumber && res.name) {
        toast.success("[DEV] 본인인증 자동 완료");
        onVerified(res.phoneNumber, res.name);
        onClose();
      }
    } catch {
      toast.error("인증 처리에 실패했습니다");
    } finally {
      setDevSubmitting(false);
    }
  }

  function formatPhone(v: string) {
    const d = v.replace(/\D/g, "");
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">본인인증</h2>
            <p className="text-xs text-muted-foreground mt-0.5">PASS 통신사 인증</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={step === "loading" || step === "polling"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* idle */}
          {step === "idle" && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-4">
                  <div className="text-2xl">📱</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">PASS 앱 또는 통신사 인증</p>
                    <p className="text-xs text-muted-foreground mt-0.5">SKT · KT · LGU+ 모두 지원</p>
                  </div>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground px-1">
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 실명 및 생년월일 자동 수집</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 휴대폰 번호 자동 등록</li>
                  <li className="flex items-center gap-2"><span className="text-green-500">✓</span> 1인 1계정 중복가입 방지</li>
                </ul>
              </div>
              <Button onClick={handleStart} className="w-full h-12 text-sm font-semibold">
                본인인증 시작하기
              </Button>
            </>
          )}

          {/* loading */}
          {step === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">준비 중...</p>
            </div>
          )}

          {/* NICE popup opened */}
          {step === "nice-popup" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="text-4xl">🔐</div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">팝업창에서 인증을 완료해주세요</p>
                <p className="text-xs text-muted-foreground mt-1">팝업이 보이지 않으면 브라우저 팝업 차단을 해제해주세요</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  popupRef.current?.focus();
                  popupRef.current?.close();
                  setStep("idle");
                }}
              >
                취소
              </Button>
            </div>
          )}

          {/* polling */}
          {step === "polling" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">인증 결과 확인 중...</p>
            </div>
          )}

          {/* DEV bypass form */}
          {step === "dev-form" && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-800 font-medium">
                🚧 DEV 모드 — NICE 미연동 상태입니다. 정보를 직접 입력하세요.
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">이름</label>
                  <Input
                    placeholder="홍길동"
                    value={devName}
                    onChange={(e) => setDevName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">휴대폰 번호</label>
                  <Input
                    type="tel"
                    placeholder="010-1234-5678"
                    value={devPhone}
                    onChange={(e) => setDevPhone(formatPhone(e.target.value))}
                    maxLength={13}
                  />
                </div>
              </div>
              <Button
                onClick={handleDevSubmit}
                disabled={devSubmitting}
                className="w-full h-12 text-sm"
              >
                {devSubmitting ? "처리 중..." : "인증 완료 (DEV)"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
