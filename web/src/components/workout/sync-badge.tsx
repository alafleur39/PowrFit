import { AlertTriangle, Check, CloudUpload } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DisplayStatus } from "@/lib/workout/history-merge";

// Honest sync status (Phase 2 plan, section B): "Synced" only after the
// server confirmed the save.
const STATUS = {
  pending: { label: "Waiting to sync", icon: CloudUpload, className: "text-muted-foreground" },
  synced: { label: "Synced", icon: Check, className: "text-success" },
  failed: { label: "Sync failed", icon: AlertTriangle, className: "text-danger" },
} as const;

export function SyncBadge({ status, className }: { status: DisplayStatus; className?: string }) {
  const { label, icon: Icon, className: tone } = STATUS[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", tone, className)}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
