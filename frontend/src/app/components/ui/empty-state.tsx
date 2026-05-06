import * as React from "react";
import { cn } from "./utils";

/**
 * EmptyState — F11 빈 상태 표준화 (P2 보강)
 *
 * - variant: "page" (풀스크린, 기본) | "compact" (카드 안)
 * - illustration: SVG/이모지 플레이스홀더 (animate-float)
 * - primaryAction / secondaryAction 버튼
 * - 하위 호환: icon / body / action prop 유지
 *
 * 카피 규칙:
 *   title: 사실 + 따뜻함 ("아직 ~이 없어요" 형식)
 *   description: 다음 액션 hint 1문장
 *   액션 라벨: 동사 시작 ("친구 초대", "이상형 수정")
 */

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  /** 이모지 또는 SVG 일러스트 (animate-float 자동 적용) */
  illustration?: React.ReactNode;
  /** lucide 아이콘 (하위 호환) */
  icon?: React.ReactNode;
  title: string;
  /** description 우선, body는 하위 호환 */
  description?: string;
  body?: string;
  /** 1차 CTA */
  primaryAction?: EmptyStateAction;
  /** 2차 CTA (텍스트 링크) */
  secondaryAction?: EmptyStateAction;
  /** 기존 하위 호환 action */
  action?: React.ReactNode;
  /** "page" = 풀스크린 여백 (기본), "compact" = 최소 여백 */
  variant?: "page" | "compact";
  className?: string;
}

function EmptyState({
  illustration,
  icon,
  title,
  description,
  body,
  primaryAction,
  secondaryAction,
  action,
  variant = "page",
  className,
}: EmptyStateProps) {
  const descText = description ?? body;
  const visual = illustration ?? icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "page" ? "py-20 px-8 gap-4" : "py-10 px-5 gap-3",
        className,
      )}
    >
      {visual && (
        <div
          className={cn(
            "flex items-center justify-center text-text-tertiary animate-float",
            illustration
              ? variant === "page" ? "w-24 h-24" : "w-16 h-16"
              : "w-12 h-12 rounded-2xl",
          )}
        >
          {visual}
        </div>
      )}

      <div className="space-y-1.5">
        <p
          className={cn(
            "font-semibold text-text-primary",
            variant === "page" ? "text-body" : "text-body-sm",
          )}
        >
          {title}
        </p>
        {descText && (
          <p className="text-body-sm text-text-secondary leading-relaxed">
            {descText}
          </p>
        )}
      </div>

      {/* 액션 */}
      {(primaryAction || secondaryAction || action) && (
        <div className="flex flex-col items-center gap-2 mt-1 w-full max-w-[200px]">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="w-full py-2.5 px-5 bg-brand text-brand-foreground text-body-sm font-semibold rounded-xl hover:opacity-90 active:opacity-80 transition-opacity"
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="text-body-sm text-text-secondary underline underline-offset-2 hover:text-text-primary transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

/** 이모지 기반 플레이스홀더 일러스트레이션 */
export function EmptyIllustration({
  name,
  size = 64,
}: {
  name:
    | "telescope"
    | "paper-plane"
    | "frame"
    | "mailbox"
    | "palette"
    | "bell"
    | "shield"
    | "magnifier"
    | "spinner"
    | "balloon"
    | "color-card";
  size?: number;
}) {
  const EMOJI_MAP: Record<string, string> = {
    "telescope":   "🔭",
    "paper-plane": "✉️",
    "frame":       "🖼️",
    "mailbox":     "📭",
    "palette":     "🎨",
    "bell":        "🔔",
    "shield":      "🛡️",
    "magnifier":   "🔍",
    "spinner":     "⏳",
    "balloon":     "🎈",
    "color-card":  "🌈",
  };
  return (
    <span
      style={{ fontSize: size, lineHeight: 1 }}
      role="img"
      aria-hidden
    >
      {EMOJI_MAP[name] ?? "✨"}
    </span>
  );
}

export { EmptyState };
