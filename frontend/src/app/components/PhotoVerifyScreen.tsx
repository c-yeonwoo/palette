/**
 * PhotoVerifyScreen — F04 사진 본인 인증
 * 단계: intro → capture → result
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, Camera, Shield, ShieldCheck, ShieldX, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { VerifyBadge } from "./verify/VerifyBadge";
import {
  verifySelfies,
  getFailReasonText,
  getVerificationStatus,
  saveVerificationStatus,
  type VerifyResult,
} from "../../lib/photo-verify";
import { getColorTypeMeta } from "../../lib/colorTypes";
import { toast } from "sonner";
import { cn } from "./ui/utils";
import { PHOTO_VERIFY_IS_BETA } from "../../lib/featureFlags";

type Step = "intro" | "capture" | "processing" | "success" | "failed";

const GUIDE_STEPS = [
  { label: "정면", hint: "얼굴을 정면으로 봐주세요" },
  { label: "왼쪽 30°", hint: "얼굴을 왼쪽으로 살짝 돌려주세요" },
  { label: "오른쪽 30°", hint: "얼굴을 오른쪽으로 살짝 돌려주세요" },
  { label: "V 포즈", hint: "손가락으로 V 모양을 만들어 주세요" },
];

interface PhotoVerifyScreenProps {
  onBack: () => void;
  onComplete: () => void;
  colorType?: string;
  userId?: string;
}

export function PhotoVerifyScreen({ onBack, onComplete, colorType = "orange", userId = "me-001" }: PhotoVerifyScreenProps) {
  const [step, setStep] = useState<Step>("intro");
  const [guideIdx, setGuideIdx] = useState(0);
  const [capturedUrls, setCapturedUrls] = useState<string[]>([]);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [agreed, setAgreed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const meta = getColorTypeMeta(colorType);
  const ringColor = `hsl(${meta.h} ${meta.s}% ${meta.l}%)`;

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraError("카메라 권한이 필요해요. 설정에서 허용해 주세요.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (step === "capture") startCamera();
    return () => { if (step === "capture") stopCamera(); };
  }, [step, startCamera, stopCamera]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const next = [...capturedUrls, dataUrl];
    setCapturedUrls(next);

    if (next.length < GUIDE_STEPS.length) {
      setGuideIdx(next.length);
    } else {
      // 모든 컷 촬영 완료 → 처리 (useEffect cleanup이 카메라 정리)
      setStep("processing");
      verifySelfies("", next).then((r) => {
        setResult(r);
        if (r.ok) {
          saveVerificationStatus({ userId, status: "verified", verifiedAt: new Date().toISOString(), attemptCount: 1 });
          setStep("success");
        } else {
          saveVerificationStatus({ userId, status: "failed", attemptCount: 1 });
          setStep("failed");
        }
      });
    }
  };

  const retake = () => {
    setCapturedUrls([]);
    setGuideIdx(0);
    setResult(null);
    setStep("capture");
  };

  // ── INTRO ────────────────────────────────────────────────
  if (step === "intro") return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center px-4 py-3 border-b border-border-subtle">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-sunken">
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-body font-semibold text-text-primary ml-2">본인 인증</h1>
      </div>

      <div className="flex-1 px-6 py-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-brand-soft flex items-center justify-center">
            <Shield className="w-10 h-10 text-brand" />
          </div>
          <div>
            <h2 className="text-display font-bold text-text-primary">사진 본인 인증</h2>
            {PHOTO_VERIFY_IS_BETA && (
              <span className="inline-block mt-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                베타 — AI 검증 준비 중
              </span>
            )}
            <p className="text-body-sm text-text-secondary mt-1.5">
              셀카 4컷으로 프로필 사진과 일치하는지 확인해요.
              <br />약 1분 소요됩니다.
            </p>
          </div>
        </div>

        {/* 인증 단계 미리보기 */}
        <div className="bg-surface shadow-card rounded-xl px-4 py-4 space-y-3">
          {GUIDE_STEPS.map((g, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-surface-sunken flex items-center justify-center flex-shrink-0">
                <span className="text-caption font-bold text-text-secondary">{i + 1}</span>
              </div>
              <div>
                <p className="text-body-sm font-medium text-text-primary">{g.label}</p>
                <p className="text-caption text-text-tertiary">{g.hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 프라이버시 안내 */}
        <div className="bg-surface-sunken rounded-xl px-4 py-4 space-y-2">
          <p className="text-caption font-semibold text-text-primary">🔒 개인정보 보호 안내</p>
          <ul className="space-y-1">
            {[
              "셀카는 검증 직후 30일 내 자동 삭제",
              "다른 사용자에게 공개되지 않음",
              "AI 학습에 사용하지 않음",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-caption text-text-secondary">
                <span className="text-state-success mt-0.5">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 동의 체크 */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 accent-primary"
          />
          <span className="text-body-sm text-text-secondary">
            개인정보처리방침에 동의하고 본인 인증을 진행합니다.
          </span>
        </label>
      </div>

      <div className="px-6 pb-8">
        <Button
          variant="brand"
          size="xl"
          className="w-full"
          disabled={!agreed}
          onClick={() => setStep("capture")}
        >
          시작하기
        </Button>
        <button onClick={onBack} className="w-full mt-3 text-body-sm text-text-tertiary text-center">
          다음에 하기
        </button>
      </div>
    </div>
  );

  // ── CAPTURE ────────────────────────────────────────────────
  if (step === "capture") return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <canvas ref={canvasRef} className="hidden" />

      {/* 프로그레스 */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-4 pt-12">
        {GUIDE_STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 h-1 rounded-pill transition-all",
              i < capturedUrls.length ? "bg-white" : i === guideIdx ? "bg-white/70" : "bg-white/30",
            )}
          />
        ))}
      </div>

      {cameraError ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <Camera className="w-12 h-12 text-white/50" />
          <p className="text-white">{cameraError}</p>
          <Button variant="outline" onClick={onBack}>돌아가기</Button>
        </div>
      ) : (
        <>
          {/* 카메라 뷰 */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ minHeight: "calc(100vh - 160px)" }}
          />

          {/* 가이드 오버레이 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div
              className="w-56 h-72 rounded-[50%] border-4"
              style={{ borderColor: ringColor, boxShadow: `0 0 32px ${ringColor}40` }}
            />
          </div>

          {/* 하단 가이드 + 촬영 버튼 */}
          <div className="absolute bottom-0 left-0 right-0 pb-12 flex flex-col items-center gap-5 bg-gradient-to-t from-black/60 pt-8">
            <div className="text-center">
              <p className="text-white font-semibold">{GUIDE_STEPS[guideIdx]?.label}</p>
              <p className="text-white/70 text-body-sm mt-0.5">{GUIDE_STEPS[guideIdx]?.hint}</p>
            </div>
            <button
              onClick={capture}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center"
              style={{ backgroundColor: ringColor }}
              aria-label="촬영"
            >
              <Camera className="w-7 h-7 text-white" />
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── PROCESSING ────────────────────────────────────────────
  if (step === "processing") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
      <div className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center animate-pulse">
        <Shield className="w-8 h-8 text-brand" />
      </div>
      <div className="text-center">
        <p className="text-title font-bold text-text-primary">인증 중...</p>
        <p className="text-body-sm text-text-secondary mt-1">프로필 사진과 비교하고 있어요</p>
      </div>
    </div>
  );

  // ── SUCCESS ────────────────────────────────────────────────
  if (step === "success") return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
      <div className="w-20 h-20 rounded-full bg-[hsl(152_48%_92%)] flex items-center justify-center">
        <ShieldCheck className="w-10 h-10 text-state-success" />
      </div>
      <div className="text-center">
        <h2 className="text-display font-bold text-text-primary">인증 완료!</h2>
        <p className="text-body-sm text-text-secondary mt-1.5">
          프로필에 <strong>본인인증</strong> 뱃지가 표시돼요.
        </p>
        <div className="flex justify-center mt-3">
          <VerifyBadge verified size="md" />
        </div>
      </div>
      <Button variant="brand" size="xl" className="w-full" onClick={onComplete}>
        확인
      </Button>
    </div>
  );

  // ── FAILED ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
      <div className="w-20 h-20 rounded-full bg-[hsl(4_74%_93%)] flex items-center justify-center">
        <ShieldX className="w-10 h-10 text-state-danger" />
      </div>
      <div className="text-center">
        <h2 className="text-display font-bold text-text-primary">인증 실패</h2>
        <p className="text-body-sm text-text-secondary mt-1.5">
          {result ? getFailReasonText(result.failReason) : "다시 시도해 주세요."}
        </p>
      </div>
      <div className="w-full space-y-2">
        <Button variant="brand" size="xl" className="w-full gap-2" onClick={retake}>
          <RotateCcw className="w-4 h-4" />
          다시 시도
        </Button>
        <Button variant="ghost" size="lg" className="w-full" onClick={onBack}>
          나중에 하기
        </Button>
      </div>
    </div>
  );
}
