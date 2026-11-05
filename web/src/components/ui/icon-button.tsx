import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// An icon-only control (UI playbook Phase 2). `label` is required: it is the
// name VoiceOver reads and the tooltip on desktop. Always 44×44pt.
const iconButtonVariants = cva(
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        ghost: "text-muted-foreground hover:bg-surface-raised hover:text-foreground",
        secondary: "border border-border bg-surface-raised text-foreground hover:bg-border",
        destructive: "text-muted-foreground hover:bg-danger/10 hover:text-danger",
      },
    },
    defaultVariants: { variant: "ghost" },
  }
);

type IconButtonProps = Omit<React.ComponentProps<"button">, "aria-label" | "children"> &
  VariantProps<typeof iconButtonVariants> & {
    label: string;
    icon: React.ReactNode;
  };

export function IconButton({ label, icon, variant, className, type = "button", onClick, ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      onClick={
        variant === "destructive" && onClick
          ? (event) => {
              haptic("warning");
              onClick(event);
            }
          : onClick
      }
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant }), className)}
      {...props}
    >
      {icon}
    </button>
  );
}
