/**
 * AccentScope — 런타임 유저 컬러 주입 컨텍스트
 *
 * 사용법:
 *   <AccentScope colorType="blue">
 *     <ProfileCard />  ← 내부에서 bg-user-accent, text-user-accent 사용 가능
 *   </AccentScope>
 *
 * 동작 원리:
 *   AccentScope가 --accent-h, --accent-s, --accent-l CSS 변수를 해당 DOM 노드에 주입.
 *   theme.css의 --user-accent: var(--accent-h) var(--accent-s) var(--accent-l) 이
 *   자동으로 해당 색상을 반영. bg-user-accent, bg-user-accent-soft 유틸리티 즉시 반응.
 *
 * 장점:
 *   - React 리렌더 없이 CSS 변수만 교체 → 성능 최적
 *   - 중첩 가능 (자신의 프로필 ≠ 상대방 프로필)
 *   - shadcn --accent 변수와 충돌 없음 (--user-accent 별도 네임스페이스)
 */
import React, { createContext, useContext, useMemo } from "react";
import { type ColorTypeKey, getColorTypeMeta } from "../../lib/colorTypes";

interface AccentScopeContextValue {
  colorType: ColorTypeKey | null;
}

const AccentScopeContext = createContext<AccentScopeContextValue>({ colorType: null });

export function useAccentScope() {
  return useContext(AccentScopeContext);
}

interface AccentScopeProps {
  colorType: ColorTypeKey | string | null | undefined;
  children: React.ReactNode;
  /** 추가 className (선택) */
  className?: string;
  /** 추가 style (선택, CSS 변수 외의 스타일) */
  style?: React.CSSProperties;
}

export function AccentScope({ colorType, children, className, style }: AccentScopeProps) {
  const meta = useMemo(() => getColorTypeMeta(colorType), [colorType]);

  const accentStyle: React.CSSProperties = {
    "--accent-h": String(meta.h),
    "--accent-s": `${meta.s}%`,
    "--accent-l": `${meta.l}%`,
    ...style,
  } as React.CSSProperties;

  const contextValue = useMemo(
    () => ({ colorType: meta.key }),
    [meta.key],
  );

  return (
    <AccentScopeContext.Provider value={contextValue}>
      <div style={accentStyle} className={className}>
        {children}
      </div>
    </AccentScopeContext.Provider>
  );
}
