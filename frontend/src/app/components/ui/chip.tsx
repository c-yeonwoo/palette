import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

/**
 * Chip — 선택 가능한 태그/필터 컴포넌트
 *
 * P6 모션:
 *   - transition: bg/color/border 150ms ease-out-soft
 *   - press: active:scale-[0.96]
 *   - selected 진입: chip-select keyframe (scale bump, 한 번)
 */
const chipVariants = cva(
  [
    "inline-flex items-center justify-center gap-1 font-medium select-none",
    "transition-[color,background-color,border-color,box-shadow] duration-[150ms]",
    "ease-[cubic-bezier(.2,.8,.2,1)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-surface shadow-hairline text-text-secondary rounded-pill hover:shadow-soft hover:text-text-primary",
        selected:
          "bg-[hsl(var(--brand)/0.08)] text-brand ring-1 ring-[hsl(var(--brand)/0.25)] shadow-none rounded-pill",
        category:
          "bg-surface shadow-hairline text-text-primary font-semibold rounded-md",
        count:
          "bg-brand text-brand-foreground rounded-pill",
      },
      size: {
        sm: "px-2.5 py-0.5 text-caption",
        md: "px-3 py-1 text-body-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ChipProps
  extends Omit<React.ComponentProps<"button">, "onClick">,
    VariantProps<typeof chipVariants> {
  asButton?: boolean;
  selected?: boolean;
  /** Widened to HTMLElement so callers don't need to match button vs span */
  onClick?: React.MouseEventHandler<HTMLElement>;
}

function Chip({
  className,
  variant,
  size,
  asButton = false,
  selected,
  onClick,
  ...props
}: ChipProps) {
  const resolvedVariant = selected ? "selected" : (variant ?? "default");

  /* P6: selected 진입 시 scale-bump 애니메이션 (한 번만) */
  const [bump, setBump] = React.useState(false);
  const prevSelected = React.useRef(selected);

  React.useEffect(() => {
    // only fire when transitioning false → true (not on initial render)
    if (selected && prevSelected.current === false) {
      setBump(true);
    }
    prevSelected.current = selected;
  }, [selected]);

  if (asButton) {
    return (
      <button
        type="button"
        data-slot="chip"
        onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
        onAnimationEnd={() => setBump(false)}
        className={cn(
          chipVariants({ variant: resolvedVariant, size }),
          "cursor-pointer active:scale-[0.96] transition-transform min-h-[36px]",
          bump && "animate-chip-select",
          className,
        )}
        {...(props as React.ComponentProps<"button">)}
      />
    );
  }

  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ variant: resolvedVariant, size }), className)}
      {...(props as React.ComponentProps<"span">)}
    />
  );
}

export { Chip, chipVariants };
