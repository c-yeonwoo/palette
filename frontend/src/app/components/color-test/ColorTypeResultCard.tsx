/**
 * ColorTypeResultCard — 컬러 타입 진단 결과 카드
 *
 * 결과 화면과 공유 이미지 캡처 양쪽에 사용됩니다.
 * forCapture=true이면 공유용 고정 크기(390×640)로 렌더링됩니다.
 *
 * @example
 * <ColorTypeResultCard colorType="orange" />
 * <ColorTypeResultCard colorType="blue" forCapture />
 */

import { cn } from "../ui/utils";
import { getColorTypeMeta } from "../../../lib/colorTypes";
import { COLOR_TYPE_DESCRIPTIONS } from "../../../lib/color-test/descriptions";
import type { ColorTypeKey } from "../../../lib/colorTypes";

interface ColorTypeResultCardProps {
  /** 결과 컬러 타입 */
  colorType: ColorTypeKey;
  /** true이면 공유 이미지용 고정 크기 (390×640px) */
  forCapture?: boolean;
}

/**
 * 컬러 타입 결과 카드
 *
 * - 배경: 해당 컬러 소프트 그라데이션 (10% → 5%)
 * - 큰 컬러 원 (64px)
 * - 제목·부제목·설명
 * - 키워드 칩 3개
 * - 잘 맞는 색 2개 + Palette 워터마크
 */
export function ColorTypeResultCard({
  colorType,
  forCapture = false,
}: ColorTypeResultCardProps) {
  const meta = getColorTypeMeta(colorType);
  const desc = COLOR_TYPE_DESCRIPTIONS[colorType];

  const hslBase = `hsl(${meta.h} ${meta.s}% ${meta.l}%)`;
  const hslSoft10 = `hsl(${meta.h} ${meta.s}% 96%)`;
  const hslSoft5 = `hsl(${meta.h} ${meta.s}% 98%)`;
  const hslText = `hsl(${meta.h} ${meta.s}% 30%)`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        forCapture ? "w-[390px] h-[640px]" : "w-full",
      )}
      style={{
        background: `linear-gradient(160deg, ${hslSoft10} 0%, ${hslSoft5} 100%)`,
      }}
    >
      {/* 배경 장식 원 */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ backgroundColor: hslBase }}
        aria-hidden
      />
      <div
        className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full opacity-5 pointer-events-none"
        style={{ backgroundColor: hslBase }}
        aria-hidden
      />

      {/* 콘텐츠 */}
      <div className="relative z-10 flex flex-col items-center px-6 py-8 gap-5">
        {/* 컬러 원 (64px) */}
        <div
          className="w-16 h-16 rounded-full shadow-card flex items-center justify-center text-white text-display font-bold"
          style={{ backgroundColor: hslBase }}
          aria-label={`${meta.label} 컬러`}
        >
          {meta.label[0]}
        </div>

        {/* 제목 영역 */}
        <div className="text-center space-y-1">
          <p className="text-body-sm font-medium" style={{ color: hslText }}>
            나의 컬러 타입
          </p>
          <h2
            className="text-display font-bold"
            style={{ color: hslText }}
          >
            {desc.title}
          </h2>
          <p className="text-body text-text-secondary">{desc.subtitle}</p>
        </div>

        {/* 설명 */}
        <p className="text-body text-text-secondary text-center leading-relaxed">
          {desc.description}
        </p>

        {/* 키워드 칩 3개 */}
        <div className="flex flex-wrap justify-center gap-2">
          {desc.keywords.map((keyword) => (
            <span
              key={keyword}
              className="px-3 py-1 rounded-pill text-body-sm font-semibold"
              style={{
                backgroundColor: `hsl(${meta.h} ${meta.s}% 90%)`,
                color: hslText,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>

        {/* 잘 맞는 색 */}
        <div className="w-full bg-surface rounded-xl p-4 shadow-hairline">
          <p className="text-caption text-text-tertiary font-medium mb-3 text-center">
            잘 맞는 색
          </p>
          <div className="flex justify-center gap-6">
            {desc.compatibleTypes.map((ctKey) => {
              const ctMeta = getColorTypeMeta(ctKey);
              const ctHsl = `hsl(${ctMeta.h} ${ctMeta.s}% ${ctMeta.l}%)`;
              return (
                <div key={ctKey} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-10 h-10 rounded-full shadow-soft"
                    style={{ backgroundColor: ctHsl }}
                    aria-label={ctMeta.label}
                  />
                  <span className="text-caption text-text-secondary font-medium">
                    {ctMeta.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 데이팅 특성 */}
        <p
          className="text-body-sm text-center font-medium italic"
          style={{ color: hslText }}
        >
          "{desc.trait}"
        </p>

        {/* Palette 워터마크 */}
        <div className="flex items-center gap-1.5 mt-1">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: hslBase }}
            aria-hidden
          />
          <span className="text-caption text-text-tertiary font-medium">
            palette.app
          </span>
        </div>
      </div>
    </div>
  );
}
