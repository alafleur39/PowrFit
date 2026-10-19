"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { WorkoutLog } from "@/lib/strength";
import { useActiveWorkout } from "./active-workout-provider";
import { Dialog } from "./dialog";

// Recovery for a save the server refused (P2-14): retry with the same id,
// copy the workout as JSON, or discard it after confirming.
export function FailedSaveActions({ log, errorCode }: { log: WorkoutLog; errorCode?: string }) {
  const { retryReceipt, discardReceipt } = useActiveWorkout();
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        The server didn&apos;t accept this workout{errorCode ? ` (${errorCode})` : ""}. It&apos;s
        still saved on this device.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button className="h-11" onClick={() => retryReceipt(log.id)}>
          Retry
        </Button>
        <Button
          variant="outline"
          className="h-11 border-border bg-transparent text-foreground hover:bg-surface hover:text-foreground"
          onClick={copy}
        >
          {copied ? "Copied" : "Copy as text"}
        </Button>
        <Button
          variant="ghost"
          className="h-11 text-danger hover:bg-surface hover:text-danger"
          onClick={() => setConfirmOpen(true)}
        >
          Discard
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        title="Discard this workout?"
        onClose={() => setConfirmOpen(false)}
        footer={
          <div className="flex flex-col gap-2">
            <Button
              variant="destructive"
              className="h-12 text-base font-bold"
              onClick={() => {
                setConfirmOpen(false);
                discardReceipt(log.id);
              }}
            >
              Discard workout
            </Button>
            <Button
              variant="ghost"
              className="h-12 text-base text-foreground hover:bg-surface hover:text-foreground"
              onClick={() => setConfirmOpen(false)}
            >
              Keep it
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          It was never saved to your account, so discarding deletes it for good. Copy it first if
          you want a record.
        </p>
      </Dialog>
    </div>
  );
}
