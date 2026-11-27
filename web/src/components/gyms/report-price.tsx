"use client";

import { useState } from "react";
import { Flag } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { sendPriceFlag } from "@/lib/gyms/gym-repo";
import type { Gym } from "@/lib/gyms/gyms";

// "Report" (Phase 8, App Review guideline 1.2): any member can flag a price
// that members sent as wrong or offensive. It goes to the admin's review
// screen, which can take the price down. Offline, Firestore sends it later.
export function ReportPrice({ gym }: { gym: Gym }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const report = () => {
    setOpen(false);
    if (!user) return;
    // Not awaited: it resolves only once the server has it, which offline is later.
    sendPriceFlag(user.uid, { placeId: gym.placeId, gymName: gym.name, createdAt: new Date().toISOString() }).catch(
      (err) => console.error("Reporting a price failed", err)
    );
    setSent(true);
  };

  if (sent) {
    return <p className="flex min-h-11 items-center text-footnote text-muted-foreground">Reported. We&apos;ll check it.</p>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Report the price at ${gym.name}`}
        className="flex min-h-11 items-center gap-2 rounded-full px-3 text-footnote font-semibold text-muted-foreground hover:bg-surface-raised hover:text-foreground"
      >
        <Flag className="size-4" aria-hidden />
        Report
      </button>

      <Sheet
        open={open}
        title="Report this price?"
        onClose={() => setOpen(false)}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="min-h-12 flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="lg" className="flex-1" onClick={report}>
              Report price
            </Button>
          </div>
        }
      >
        <p className="text-footnote text-muted-foreground">
          If the price at {gym.name} is wrong or offensive, PowrFit will check it and take it down. Only PowrFit sees
          who reported it.
        </p>
      </Sheet>
    </>
  );
}
