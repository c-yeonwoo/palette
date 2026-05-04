/**
 * Skeleton — P6 shimmer 기반 로딩 플레이스홀더
 *
 * 기본 <Skeleton> + 3종 프리셋:
 *   <SkeletonProfileHeader />  원 + 두 줄
 *   <SkeletonCard />           카드 형태
 *   <SkeletonListRow />        row 반복
 */
import { cn } from "./utils";

/* ── 기본 atom ─────────────────────────────────────────────── */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        /* P6: 옅은 shimmer (warm-200 → warm-100 → warm-200) */
        "animate-shimmer rounded-md",
        className,
      )}
      {...props}
    />
  );
}

/* ── 프리셋: 프로필 헤더 (원 + 두 줄) ─────────────────────── */
function SkeletonProfileHeader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 px-5 py-4", className)}>
      {/* 아바타 원 */}
      <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
      {/* 이름 + 서브 */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32 rounded-pill" />
        <Skeleton className="h-3 w-20 rounded-pill" />
      </div>
    </div>
  );
}

/* ── 프리셋: 카드 ──────────────────────────────────────────── */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-surface-elevated border border-border-subtle rounded-lg p-4 space-y-3",
      className,
    )}>
      <Skeleton className="h-4 w-24 rounded-pill" />
      <Skeleton className="h-3 w-full rounded-pill" />
      <Skeleton className="h-3 w-3/4 rounded-pill" />
    </div>
  );
}

/* ── 프리셋: 리스트 row 반복 ───────────────────────────────── */
function SkeletonListRow({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn(
      "bg-surface-elevated border border-border-subtle rounded-lg overflow-hidden divide-y divide-border-subtle",
      className,
    )}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 min-h-12 gap-4">
          <Skeleton className="h-3 w-16 rounded-pill" />
          <Skeleton className="h-3 w-20 rounded-pill" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonProfileHeader, SkeletonCard, SkeletonListRow };
