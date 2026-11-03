"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Common = {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
};

type ChevronRow = Common & { variant?: "chevron"; href?: string; onClick?: () => void; external?: boolean };
type ToggleRow = Common & { variant: "toggle"; checked: boolean; onCheckedChange: (checked: boolean) => void };
type DestructiveRow = Common & { variant: "destructive"; onClick: () => void };

const rowClass =
  "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-raised focus-visible:bg-surface-raised focus-visible:outline-none";

function Text({ ids, title, description, tone }: { ids: Ids; title: string; description?: string; tone?: "danger" }) {
  return (
    <span className="min-w-0 flex-1">
      <span id={ids.title} className={cn("block text-body font-semibold", tone === "danger" ? "text-danger" : "text-foreground")}>
        {title}
      </span>
      {description && (
        <span id={ids.description} className="mt-0.5 block text-footnote text-muted-foreground">
          {description}
        </span>
      )}
    </span>
  );
}

type Ids = { title: string; description: string };

function Icon({ icon, tone }: { icon?: ReactNode; tone?: "danger" }) {
  if (!icon) return null;
  return (
    <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center [&_svg]:size-5", tone === "danger" ? "text-danger" : "text-muted-foreground")}>
      {icon}
    </span>
  );
}

// A row in a settings-style list (UI playbook Phase 2). Group rows in
// <ListGroup>, which draws one card with hairlines between rows, like iOS
// Settings. Variants: chevron (a link shows a chevron; with onClick it's an
// action and doesn't), toggle (a switch) and
// destructive (red, for actions such as Delete account; the action itself
// must still confirm).
export function ListRow(props: ChevronRow | ToggleRow | DestructiveRow) {
  const { title, description, icon, className } = props;
  const id = useId();
  const ids = { title: `${id}-title`, description: `${id}-description` };
  // The row's name is its title; the description is read after it, as a hint.
  const a11y = { "aria-labelledby": ids.title, "aria-describedby": description ? ids.description : undefined };

  if (props.variant === "toggle") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        {...a11y}
        onClick={() => props.onCheckedChange(!props.checked)}
        className={cn(rowClass, className)}
      >
        <Icon icon={icon} />
        <Text ids={ids} title={title} description={description} />
        <span
          aria-hidden
          className={cn(
            "relative h-7 w-12 shrink-0 rounded-full transition-colors",
            props.checked ? "bg-success" : "bg-border"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-6 rounded-full bg-foreground transition-transform motion-reduce:transition-none",
              props.checked ? "translate-x-5.5" : "translate-x-0.5"
            )}
          />
        </span>
      </button>
    );
  }

  if (props.variant === "destructive") {
    return (
      <button type="button" onClick={props.onClick} className={cn(rowClass, className)} {...a11y}>
        <Icon icon={icon} tone="danger" />
        <Text ids={ids} title={title} description={description} tone="danger" />
      </button>
    );
  }

  const content = (
    <>
      <Icon icon={icon} />
      <Text ids={ids} title={title} description={description} />
      {props.href && <ChevronRight className="size-5 shrink-0 text-tertiary-foreground" aria-hidden />}
    </>
  );
  if (props.href) {
    return props.external ? (
      <a href={props.href} target="_blank" rel="noopener noreferrer" className={cn(rowClass, className)} {...a11y}>
        {content}
      </a>
    ) : (
      <Link href={props.href} className={cn(rowClass, className)} {...a11y}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={props.onClick} className={cn(rowClass, className)} {...a11y}>
      {content}
    </button>
  );
}

/** One card of rows with hairlines between them, and an optional heading above. */
export function ListGroup({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={className} aria-label={title}>
      {title && <h2 className="mb-2 px-1 text-footnote font-semibold text-muted-foreground">{title}</h2>}
      <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">{children}</div>
    </section>
  );
}
