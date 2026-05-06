/**
 * ColorTestScreen — 컬러 타입 진단 전체 화면
 *
 * 3단계 내부 상태 머신:
 *   intro → question → result
 *
 * 로컬스토리지 키: "palette_color_test"
 * 저장 데이터: { answers: Record<number, number>, colorType?: ColorTypeKey }
 *
 * @example
 * <ColorTestScreen
 *   onComplete={(colorType) => navigate(`/home?ct=${colorType}`)}
 *   onSkip={() => navigate('/home')}
 * />
 */

import { useState, useEffect, useRef } from "react";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cn } from "./ui/utils";
import { Button } from "./ui/button";
import { ColorTestProgress } from "./color-test/ColorTestProgress";
import { ColorTestOption } from "./color-test/ColorTestOption";
import { ColorTypeResultCard } from "./color-test/ColorTypeResultCard";
import { ShareSheet } from "./color-test/ShareSheet";
import { getColorTypeMeta } from "../../lib/colorTypes";
import { QUESTIONS } from "../../lib/color-test/questions";
import {
  calculateDimensionScores,
  scoreToColorType,
} from "../../lib/color-test/score";
import { COLOR_TYPE_DESCRIPTIONS } from "../../lib/color-test/descriptions";
import type { ColorTypeKey } from "../../lib/colorTypes";

/** 화면 단계 */
type Step = "intro" | "question" | "result";

/** localStorage 저장 스키마 */
interface StoredColorTest {
  answers: Record<number, number>;
  colorType?: ColorTypeKey;
}

/** localStorage 키 */
const STORAGE_KEY = "palette_color_test";

interface ColorTestScreenProps {
  /** 진단 완료 후 콜백 (앱 라우팅 처리) */
  onComplete: (colorType: ColorTypeKey) => void;
  /** "나중에" 클릭 콜백 (1회 노출) */
  onSkip?: () => void;
}

/** 8가지 컬러 미리보기용 배열 (인트로 화면) */
const ALL_COLOR_TYPES: ColorTypeKey[] = [
  "orange", "blue", "red", "pink", "green", "purple", "yellow", "gray",
];

/**
 * 컬러 타입 진단 전체 화면 컴포넌트
 */
export function ColorTestScreen({ onComplete, onSkip }: ColorTestScreenProps) {
  // ── 상태 ──────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [colorType, setColorType] = useState<ColorTypeKey | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // 결과 로딩 애니메이션
  const [resultVisible, setResultVisible] = useState(false);

  // 선택 후 자동 진행을 위한 타이머 ref
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 현재 문항
  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const selectedOptionIndex = currentQuestion
    ? answers[currentQuestion.id]
    : undefined;

  // ── 로컬스토리지 복원 ──────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const stored: StoredColorTest = JSON.parse(raw);

      // 이전에 완료된 결과가 있으면 result step으로 바로
      if (stored.colorType) {
        setColorType(stored.colorType);
        setAnswers(stored.answers ?? {});
        setStep("result");
        // 결과 진입 시 애니메이션
        setTimeout(() => setResultVisible(true), 50);
      } else if (Object.keys(stored.answers ?? {}).length > 0) {
        // 진행 중이었던 답변 복원
        setAnswers(stored.answers);
        // 마지막으로 답한 문항 인덱스로 복원
        const lastAnsweredId = Math.max(...Object.keys(stored.answers).map(Number));
        const lastIndex = QUESTIONS.findIndex((q) => q.id === lastAnsweredId);
        const nextIndex = Math.min(lastIndex + 1, QUESTIONS.length - 1);
        setCurrentQuestionIndex(nextIndex);
      }
    } catch {
      // 파싱 오류 무시
    }
  }, []);

  // ── 답변 저장 (localStorage 동기화) ──────────────────────
  const saveToStorage = (
    newAnswers: Record<number, number>,
    ct?: ColorTypeKey,
  ) => {
    try {
      const data: StoredColorTest = { answers: newAnswers, colorType: ct };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 스토리지 오류 무시
    }
  };

  // ── 보기 선택 처리 ────────────────────────────────────────
  const handleOptionSelect = (optionIndex: number) => {
    if (!currentQuestion) return;

    // 이미 선택 후 타이머 진행 중이면 무시
    if (autoAdvanceTimer.current) return;

    const newAnswers = { ...answers, [currentQuestion.id]: optionIndex };
    setAnswers(newAnswers);
    saveToStorage(newAnswers);

    // 0.4초 후 자동 다음 문항 또는 결과
    autoAdvanceTimer.current = setTimeout(() => {
      autoAdvanceTimer.current = null;

      if (currentQuestionIndex < QUESTIONS.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        // 마지막 문항 → 결과 계산
        const scores = calculateDimensionScores(newAnswers);
        const ct = scoreToColorType(scores);
        setColorType(ct);
        saveToStorage(newAnswers, ct);
        setStep("result");
        // 0.8초 후 결과 카드 등장 애니메이션
        setTimeout(() => setResultVisible(true), 800);
      }
    }, 400);
  };

  // ── 뒤로가기 ─────────────────────────────────────────────
  const handleBack = () => {
    // 타이머 취소
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    if (currentQuestionIndex === 0) {
      // 첫 문항 → 인트로로
      setStep("intro");
    } else {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // ── 시작하기 ─────────────────────────────────────────────
  const handleStart = () => {
    setStep("question");
    setCurrentQuestionIndex(0);
  };

  // ── 다시 하기 ────────────────────────────────────────────
  const handleRetake = () => {
    setAnswers({});
    setColorType(null);
    setResultVisible(false);
    setCurrentQuestionIndex(0);
    saveToStorage({});
    setStep("intro");
  };

  // ── 완료 ─────────────────────────────────────────────────
  const handleComplete = () => {
    if (!colorType) return;
    onComplete(colorType);
  };

  // ── cleanup ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  // ══════════════════════════════════════════════════════════
  // RENDER: 인트로
  // ══════════════════════════════════════════════════════════
  if (step === "intro") {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        {/* 상단 여백 */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
          {/* 8가지 컬러 원 미리보기 */}
          <div className="flex flex-wrap justify-center gap-3">
            {ALL_COLOR_TYPES.map((ct) => {
              const m = getColorTypeMeta(ct);
              return (
                <div
                  key={ct}
                  className="w-10 h-10 rounded-full shadow-card"
                  style={{
                    backgroundColor: `hsl(${m.h} ${m.s}% ${m.l}%)`,
                  }}
                  aria-label={m.label}
                />
              );
            })}
          </div>

          {/* 제목 영역 */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-brand-soft text-brand text-caption font-semibold">
              <Sparkles className="size-3" />
              컬러 타입 진단
            </div>
            <h1 className="text-display-lg font-bold text-text-primary">
              나의 색깔은
              <br />
              무엇일까요?
            </h1>
            <p className="text-body text-text-secondary">
              14가지 질문으로 당신의 컬러 타입을 찾아드려요
            </p>
          </div>

          {/* 소요 시간 */}
          <div className="flex items-center gap-1.5 text-body-sm text-text-tertiary">
            <Clock className="size-4" />
            약 3분 소요
          </div>

          {/* 컬러 타입 미리보기 칩 */}
          <div className="flex flex-wrap justify-center gap-2 max-w-xs">
            {ALL_COLOR_TYPES.map((ct) => {
              const m = getColorTypeMeta(ct);
              const hslBase = `hsl(${m.h} ${m.s}% ${m.l}%)`;
              const hslText = `hsl(${m.h} ${m.s}% 32%)`;
              const hslSoft = `hsl(${m.h} ${m.s}% 93%)`;
              return (
                <span
                  key={ct}
                  className="px-2.5 py-1 rounded-pill text-caption font-semibold"
                  style={{ backgroundColor: hslSoft, color: hslText }}
                >
                  {m.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* 하단 CTA */}
        <div className="px-6 pb-10 space-y-3">
          <Button
            variant="brand"
            size="xl"
            className="w-full"
            onClick={handleStart}
          >
            시작하기
            <ArrowRight className="size-4" />
          </Button>

          {onSkip && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full text-text-tertiary"
              onClick={onSkip}
            >
              나중에 할게요
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RENDER: 질문
  // ══════════════════════════════════════════════════════════
  if (step === "question" && currentQuestion) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        {/* 진행 표시 */}
        <ColorTestProgress
          current={currentQuestionIndex + 1}
          total={QUESTIONS.length}
          onBack={handleBack}
        />

        {/* 질문 + 보기 */}
        <div className="flex-1 flex flex-col px-6 pt-8 pb-6 gap-6">
          {/* 질문 텍스트 */}
          <div className="text-center px-2">
            <h2 className="text-title font-bold text-text-primary leading-snug">
              {currentQuestion.text}
            </h2>
          </div>

          {/* 보기 카드 4개 */}
          <div className="flex flex-col gap-2.5">
            {currentQuestion.options.map((option, idx) => (
              <ColorTestOption
                key={idx}
                text={option.text}
                index={idx}
                selected={selectedOptionIndex === idx}
                onClick={() => handleOptionSelect(idx)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // RENDER: 결과
  // ══════════════════════════════════════════════════════════
  if (step === "result" && colorType) {
    const meta = getColorTypeMeta(colorType);
    const desc = COLOR_TYPE_DESCRIPTIONS[colorType];
    const hslSoft = `hsl(${meta.h} ${meta.s}% 96%)`;

    return (
      <>
        <div
          className="min-h-screen flex flex-col"
          style={{
            background: `linear-gradient(180deg, ${hslSoft} 0%, hsl(0 0% 100%) 50%)`,
          }}
        >
          {/* 상단 패딩 */}
          <div className="h-12" />

          {/* 로딩 → 결과 카드 전환 */}
          <div
            className={cn(
              "flex-1 flex flex-col px-6 gap-5 transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(.2,.8,.2,1)]",
              resultVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6",
            )}
          >
            {/* 로딩 중 (resultVisible false) 표시할 스피너 */}
            {!resultVisible && (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div
                  className="w-16 h-16 rounded-full animate-pulse shadow-card"
                  style={{
                    backgroundColor: `hsl(${meta.h} ${meta.s}% ${meta.l}%)`,
                  }}
                />
                <p className="text-body text-text-secondary">
                  결과를 분석하고 있어요...
                </p>
              </div>
            )}

            {/* 결과 카드 */}
            {resultVisible && (
              <>
                <ColorTypeResultCard colorType={colorType} />

                {/* CTA 버튼 */}
                <div className="space-y-2.5 pb-10">
                  <Button
                    variant="brand"
                    size="xl"
                    className="w-full"
                    onClick={() => setShareOpen(true)}
                  >
                    친구에게 공유하기
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full"
                    onClick={handleComplete}
                  >
                    홈으로 시작하기
                  </Button>
                  <button
                    type="button"
                    className="w-full text-caption text-text-tertiary hover:text-text-secondary py-2 transition-default"
                    onClick={handleRetake}
                  >
                    다시 진단하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 공유 시트 */}
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          colorType={colorType}
        />
      </>
    );
  }

  // fallback (로딩 중)
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-brand-soft animate-pulse" />
    </div>
  );
}
