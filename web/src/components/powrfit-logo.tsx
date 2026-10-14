import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type PowrFitLogoVariant = "icon" | "wordmark" | "compact";

type PowrFitLogoProps = {
  variant?: PowrFitLogoVariant;
  className?: string;
  markClassName?: string;
};

function LightningMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="PowrFit lightning mark"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M28.8 3.8 8.6 27.3c-1.3 1.5-.2 3.8 1.8 3.8h10.8l-2.4 13.2c-.4 2.2 2.4 3.5 3.8 1.8l19.9-24.6c1.2-1.5.1-3.7-1.8-3.7H30.3l2.1-12.1c.4-2.2-2.2-3.6-3.6-1.9Z"
        className="fill-current"
      />
      <path
        d="M28.8 3.8 8.6 27.3c-1.3 1.5-.2 3.8 1.8 3.8h10.8l-2.4 13.2c-.4 2.2 2.4 3.5 3.8 1.8l19.9-24.6c1.2-1.5.1-3.7-1.8-3.7H30.3l2.1-12.1c.4-2.2-2.2-3.6-3.6-1.9Z"
        className="stroke-black/[0.30]"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M27 8.8 13.7 24.4h12.2l-2 10.7 10.5-13H23.1L27 8.8Z"
        className="fill-white/[0.28]"
      />
    </svg>
  );
}

export function PowrFitLogo({
  variant = "wordmark",
  className,
  markClassName,
}: PowrFitLogoProps) {
  const iconOnly = variant === "icon";
  const compact = variant === "compact";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-foreground",
        iconOnly && "gap-0",
        className
      )}
    >
      <span
        className={cn(
          "brand-glow flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-primary text-primary-foreground shadow-[0_0_32px_rgba(217,255,45,0.28)]",
          compact && "size-9 rounded-lg",
          iconOnly && "size-10",
          markClassName
        )}
      >
        <LightningMark className={cn("size-7", compact && "size-5")} />
      </span>
      {!iconOnly && (
        <span className="min-w-0">
          <span
            className={cn(
              "block font-black uppercase leading-none tracking-normal text-white",
              compact ? "text-base" : "text-xl"
            )}
          >
            Powr<span className="text-primary">Fit</span>
          </span>
          {!compact && (
            <span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Charge training
            </span>
          )}
        </span>
      )}
    </span>
  );
}
