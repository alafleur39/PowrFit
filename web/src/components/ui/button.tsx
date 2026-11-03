import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

// The one Button (UI playbook Phase 2). Actions are pills; every size is at
// least 44pt tall. Only `primary` is filled yellow, and a screen has at most
// one (DESIGN_RULES). `destructive` is red text on a dark surface, which
// passes AA where white on red (3.4:1) doesn't.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary: "bg-accent font-bold text-accent-foreground hover:bg-accent/90",
        secondary: "border border-border bg-surface-raised text-foreground hover:bg-border",
        ghost: "text-foreground hover:bg-surface-raised",
        destructive:
          "border border-danger/40 bg-surface-raised text-danger hover:bg-danger/10 focus-visible:ring-danger/40",
      },
      size: {
        md: "h-11 px-5 text-body",
        lg: "h-12 px-6 text-body",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      block: false,
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner, keeps the label, and ignores taps. */
    loading?: boolean;
  };

function Button({ className, variant, size, block, asChild = false, loading = false, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
