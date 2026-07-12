/**
 * CompletionMeter — F10 프로필 완성도 위젯
 *
 * - 도넛 차트 (SVG) + 완성도 % 텍스트
 * - 미완료 항목 빠른 진입 버튼 최대 3개
 * - 80% 달성 시 confetti 효과 + 배지
 * - 사용처: MyPageScreen, ProfileEditScreen 상단
 */
import { useEffect, useRef } from "react";
import { ChevronRight, Trophy } from "lucide-react";
import { cn } from "../ui/utils";
import {
  calculateCompletion,
  getNextActions,
  type ProfileCompletionInput,
} from "../../../lib/profile-completion";
import { getColorTypeMeta, keyFromColorType } from "../../../lib/colorTypes";

interface CompletionMeterProps {
  input?: ProfileCompletionInput;
  onAction?: (key: string) => void;
  /** 도넛 강조색 — 백엔드 colorType(UPPERCASE) 또는 이미 lowercase 키. 없으면 기본색. */
  colorType?: string | null;
}

const DONUT_R = 36;
const DONUT_CX = 44;
const DONUT_CY = 44;
const STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

export function CompletionMeter({
  input,
  onAction,
  colorType,
}: CompletionMeterProps) {
  const prevRef = useRef(0);
  const total = input ? calculateCompletion(input).total : 0;

  // confetti on first reaching 80%
  useEffect(() => {
    if (prevRef.current < 80 && total >= 80) {
      triggerConfetti();
    }
    prevRef.current = total;
  }, [total]);

  // 데이터 미전달 시 빈 상태 (mock 주입 안 함)
  if (!input) {
    return (
      <div className="bg-surface shadow-card rounded-2xl p-5 text-center text-text-tertiary">
        <p className="text-body-sm">프로필 완성도를 불러올 수 없어요</p>
        <p className="text-caption mt-1">프로필을 채우면 완성도가 표시돼요</p>
      </div>
    );
  }

  const nextActions = getNextActions(input);

  const meta = getColorTypeMeta(keyFromColorType(colorType));
  const accentHsl = `hsl(${meta.h} ${meta.s}% ${meta.l}%)`;

  const dashOffset = CIRCUMFERENCE * (1 - total / 100);
  const isHighAchiever = total >= 80;

  return (
    <div className="bg-surface shadow-card rounded-2xl p-5">
      <div className="flex items-center gap-5">
        {/* 도넛 차트 */}
        <div className="relative flex-shrink-0">
          <svg width={88} height={88} viewBox="0 0 88 88">
            {/* 트랙 */}
            <circle
              cx={DONUT_CX}
              cy={DONUT_CY}
              r={DONUT_R}
              fill="none"
              stroke="hsl(var(--neutral-200))"
              strokeWidth={STROKE}
            />
            {/* 진행 */}
            <circle
              cx={DONUT_CX}
              cy={DONUT_CY}
              r={DONUT_R}
              fill="none"
              stroke={accentHsl}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          {/* 중앙 텍스트 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-title font-bold text-text-primary">{total}%</span>
            {isHighAchiever && (
              <Trophy className="w-3.5 h-3.5 text-[hsl(42_92%_52%)]" />
            )}
          </div>
        </div>

        {/* 텍스트 + 다음 액션 */}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-body font-semibold text-text-primary">
              프로필 완성도
            </p>
            <p className="text-caption text-text-secondary">
              {total >= 80
                ? "완성도가 높아요! 매칭 확률 UP 🎉"
                : total >= 60
                ? "매칭 풀 진입 가능! 조금만 더 채워봐요"
                : "60% 이상이 되면 매칭 풀에 진입해요"}
            </p>
          </div>

          {nextActions.length > 0 && (
            <div className="space-y-1.5">
              {nextActions.map((action) => (
                <button
                  key={action.key}
                  onClick={() => onAction?.(action.key)}
                  className="flex items-center justify-between w-full px-3 py-2 bg-surface-sunken rounded-xl hover:bg-[hsl(var(--brand)/0.06)] transition-colors group"
                >
                  <span className="text-caption font-medium text-text-secondary group-hover:text-brand transition-colors">
                    {action.label}
                  </span>
                  <span className="flex items-center gap-1 text-caption text-brand">
                    +{action.weight}점
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function triggerConfetti() {
  const style = document.createElement("style");
  style.id = "confetti-style-completion";
  if (!document.getElementById("confetti-style-completion")) {
    style.textContent = `
      @keyframes confetti-pop {
        0%   { transform: translateY(0) scale(0); opacity: 1; }
        60%  { transform: translateY(-60px) scale(1.2); opacity: 1; }
        100% { transform: translateY(-120px) scale(1); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:9999;";
  document.body.appendChild(container);

  const colors = ["#F97316", "#3B82F6", "#EC4899", "#22C55E", "#A855F7", "#EAB308"];
  for (let i = 0; i < 30; i++) {
    const dot = document.createElement("div");
    const color = colors[i % colors.length];
    dot.style.cssText = `
      position:absolute;width:8px;height:8px;border-radius:50%;background:${color};
      left:${Math.random() * 160 - 80}px;top:${Math.random() * 160 - 80}px;
      animation:confetti-pop ${0.6 + Math.random() * 0.6}s ease-out ${Math.random() * 0.3}s forwards;
    `;
    container.appendChild(dot);
  }
  setTimeout(() => {
    container.remove();
  }, 1500);
}
