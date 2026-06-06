import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        /* ── shadcn 기존 ── */
        default:     "bg-brand-soft text-gold-strong hover:bg-brand-soft/70",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:     "border border-border-subtle bg-surface text-text-primary hover:bg-surface-sunken",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:       "text-text-secondary hover:bg-surface-sunken hover:text-text-primary",
        link:        "text-primary underline-offset-4 hover:underline",

        /* ── P2 신규 ── */
        /* brand: 시스템 주 강조 CTA (= default 유지, alias 추가) */
        brand:       "bg-brand text-brand-foreground hover:bg-brand/90 active:bg-brand/80",
        /* soft: 보조 CTA — 브랜드 소프트 배경 */
        soft:        "bg-brand-soft text-primary hover:bg-brand-soft/70 border border-primary/20",
        /* subtle: 3차 액션 — 흐린 배경 */
        subtle:      "bg-surface-sunken text-text-secondary hover:bg-border-subtle hover:text-text-primary",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm:      "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg:      "h-11 rounded-lg px-6 has-[>svg]:px-4",
        xl:      "h-12 rounded-lg px-8 text-base has-[>svg]:px-6",
        icon:    "size-9 rounded-md",
        "icon-sm": "size-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
