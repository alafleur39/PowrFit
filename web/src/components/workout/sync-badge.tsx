import { AlertTriangle, CloudUpload } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DisplayStatus } from "@/lib/workout/history-merge";

// Honest sync status (Phase 2 plan, section B). Saved is the normal case,
// so it shows nothing; only a workout still waiting for the server, or one
// it refused, gets a badge.
const STATUS = {
  pending: { label: "Waiting to sync", icon: CloudUpload, className: "text-muted-foreground" },
  failed: { label: "Sync failed", icon: AlertTriangle, className: "text-danger" },
} as const;

export function SyncBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  if (status === "synced") return null;
  const { label, icon: Icon, className: tone } = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-caption font-medium", tone, className)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
