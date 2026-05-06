/**
 * PhotoCarousel — F01 사진 캐러셀
 * embla-carousel-react 사용 + 인디케이터 + 스와이프
 */
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "../ui/utils";

interface PhotoCarouselProps {
  photos: string[];
  alt: string;
  className?: string;
  /** true이면 추가 사진이 잠겨있음 (F13 visibility guard) */
  additionalLocked?: boolean;
}

export function PhotoCarousel({ photos, alt, className, additionalLocked }: PhotoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setCurrent(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  if (photos.length === 0) {
    return (
      <div
        className={cn(
          "w-full aspect-[3/4] bg-surface-sunken rounded-2xl flex items-center justify-center",
          className,
        )}
      >
        <span className="text-text-tertiary text-body-sm">사진 없음</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div ref={emblaRef} className="overflow-hidden rounded-2xl">
        <div className="flex touch-pan-y">
          {photos.map((url, i) => (
            <div key={i} className="flex-none w-full aspect-[3/4] relative">
              <img
                src={url}
                alt={`${alt} 사진 ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* 잠금 오버레이 (마지막 + additionalLocked) */}
              {additionalLocked && i >= 1 && (
                <div className="absolute inset-0 backdrop-blur-xl bg-surface/70 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-surface shadow-card flex items-center justify-center">
                    <span className="text-xl">🔒</span>
                  </div>
                  <p className="text-body-sm font-semibold text-text-primary">
                    나머지 사진 보기
                  </p>
                  <p className="text-caption text-text-tertiary text-center px-6">
                    매칭권 1개로 전체 사진을 볼 수 있어요
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 인디케이터 */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={cn(
                "rounded-pill transition-all duration-200",
                i === current
                  ? "w-5 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/50",
              )}
              aria-label={`사진 ${i + 1}로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
