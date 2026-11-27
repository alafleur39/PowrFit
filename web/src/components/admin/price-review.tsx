"use client";

import { useEffect, useState } from "react";
import { Ban, Check, Trash2, X } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { StoredPriceFlag, StoredPriceReport } from "@/lib/gyms/gyms";
import { formatMonthly } from "@/lib/gyms/rank";
import {
  approveReport,
  banSender,
  dismissFlag,
  isAdmin,
  loadPriceFlags,
  loadPriceReports,
  rejectReport,
  removeFlaggedPrices,
} from "@/lib/gyms/review-repo";

type State =
  | { kind: "loading" }
  | { kind: "not-admin" }
  | { kind: "error" }
  | { kind: "ready"; reports: StoredPriceReport[]; flags: StoredPriceFlag[] };

// Price review (Phase 8): members' price reports, oldest first. Approve adds
// the price to the gym for everyone; Reject drops it; Ban also stops the
// sender reporting again. Only the admin gets past the first check, and the
// rules enforce the same.
export function PriceReview() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [banning, setBanning] = useState<StoredPriceReport | null>(null);
  const [takingDown, setTakingDown] = useState<StoredPriceFlag | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const show = (next: State) => {
      if (!cancelled) setState(next);
    };
    void (async () => {
      if (!(await isAdmin(user.uid))) return show({ kind: "not-admin" });
      try {
        const [reports, flags] = await Promise.all([loadPriceReports(), loadPriceFlags()]);
        show({ kind: "ready", reports, flags });
      } catch (err) {
        console.error("Loading price reports failed", err);
        show({ kind: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, attempt]);

  const act = async (report: StoredPriceReport, action: (report: StoredPriceReport) => Promise<void>) => {
    setBusyId(report.id);
    setError(null);
    try {
      await action(report);
      setState((current) =>
        current.kind === "ready" ? { ...current, reports: current.reports.filter((r) => r.id !== report.id) } : current
      );
    } catch (err) {
      console.error("Price review failed", err);
      setError(`Couldn't update ${report.gymName}. Check your connection and try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const actOnFlag = async (flag: StoredPriceFlag, action: (flag: StoredPriceFlag) => Promise<void>) => {
    setBusyId(flag.id);
    setError(null);
    try {
      await action(flag);
      setState((current) =>
        current.kind === "ready" ? { ...current, flags: current.flags.filter((f) => f.id !== flag.id) } : current
      );
    } catch (err) {
      console.error("Price review failed", err);
      setError(`Couldn't update ${flag.gymName}. Check your connection and try again.`);
    } finally {
      setBusyId(null);
    }
  };

  if (state.kind === "loading") {
    return (
      <div aria-busy="true" aria-label="Loading price reports" className="flex flex-col gap-2 px-4 sm:px-6">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }
  if (state.kind === "not-admin") {
    return <Notice>Only PowrFit&apos;s admin can review prices.</Notice>;
  }
  if (state.kind === "error") {
    return (
      <Notice>
        Couldn&apos;t load price reports.{" "}
        <button
          type="button"
          onClick={() => {
            setState({ kind: "loading" });
            setAttempt((n) => n + 1);
          }}
          className="min-h-11 font-semibold text-foreground underline"
        >
          Try again
        </button>
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-6 sm:px-6">
      {error && (
        <p role="alert" className="text-footnote text-danger">
          {error}
        </p>
      )}
      {state.flags.length > 0 && (
        <section aria-labelledby="reported-prices" className="flex flex-col gap-2">
          <h2 id="reported-prices" className="text-headline font-bold">
            Reported prices
          </h2>
          <ul className="flex flex-col gap-2">
            {state.flags.map((flag) => (
              <li key={flag.id} className="rounded-card border border-border bg-surface p-4">
                <p className="truncate font-bold">{flag.gymName}</p>
                <p className="text-footnote text-muted-foreground">
                  A member says this gym&apos;s price is wrong or offensive
                  {flag.createdAt && ` · ${new Date(flag.createdAt).toLocaleDateString()}`}.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    loading={busyId === flag.id}
                    disabled={busyId !== null}
                    aria-label={`Take down the prices at ${flag.gymName}`}
                    onClick={() => setTakingDown(flag)}
                  >
                    <Trash2 aria-hidden />
                    Take down
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busyId !== null}
                    aria-label={`Keep the prices at ${flag.gymName}`}
                    onClick={() => void actOnFlag(flag, dismissFlag)}
                  >
                    <Check aria-hidden />
                    Keep
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {state.reports.length === 0 ? (
        <Notice>No prices to check. New reports from members show up here.</Notice>
      ) : (
        <ul className="flex flex-col gap-2">
          {state.reports.map((report) => (
            <li key={report.id} className="rounded-card border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{report.gymName}</p>
                  <p className="text-footnote text-muted-foreground">
                    {report.plan}
                    {report.createdAt && ` · sent ${new Date(report.createdAt).toLocaleDateString()}`}
                  </p>
                </div>
                <p className="shrink-0 tabular-nums font-bold text-accent">{formatMonthly(report)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  loading={busyId === report.id}
                  disabled={busyId !== null}
                  aria-label={`Approve ${report.plan} at ${report.gymName}`}
                  onClick={() => void act(report, approveReport)}
                >
                  <Check aria-hidden />
                  Approve
                </Button>
                <Button
                  variant="ghost"
                  disabled={busyId !== null}
                  aria-label={`Reject ${report.plan} at ${report.gymName}`}
                  onClick={() => void act(report, rejectReport)}
                >
                  <X aria-hidden />
                  Reject
                </Button>
                <Button
                  variant="destructive"
                  disabled={busyId !== null}
                  aria-label={`Ban the sender of ${report.plan} at ${report.gymName}`}
                  onClick={() => setBanning(report)}
                >
                  <Ban aria-hidden />
                  Ban
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={takingDown !== null}
        title="Take down these prices?"
        onClose={() => setTakingDown(null)}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="min-h-12 flex-1" onClick={() => setTakingDown(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="flex-1"
              onClick={() => {
                const flag = takingDown;
                setTakingDown(null);
                if (flag) void actOnFlag(flag, removeFlaggedPrices);
              }}
            >
              Take down
            </Button>
          </div>
        }
      >
        <p className="text-footnote text-muted-foreground">
          Every member price for {takingDown?.gymName} is removed and the gym shows No price yet. Members can send
          new prices for you to check.
        </p>
      </Sheet>

      <Sheet
        open={banning !== null}
        title="Ban this sender?"
        onClose={() => setBanning(null)}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="min-h-12 flex-1" onClick={() => setBanning(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="flex-1"
              onClick={() => {
                const report = banning;
                setBanning(null);
                if (report) void act(report, banSender);
              }}
            >
              Ban sender
            </Button>
          </div>
        }
      >
        <p className="text-footnote text-muted-foreground">
          This report is removed, and its sender can&apos;t send prices again. You can undo a ban in the Firebase
          console.
        </p>
      </Sheet>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 sm:px-6">
      <p className="rounded-card border border-dashed border-border bg-surface p-6 text-center text-footnote text-muted-foreground">
        {children}
      </p>
    </div>
  );
}
