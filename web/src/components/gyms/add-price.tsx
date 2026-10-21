"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/workout/dialog";
import { sendPriceReport } from "@/lib/gyms/gym-repo";
import { CURRENCIES, PRICE_LIMITS, priceReportProblems, type Currency, type Gym } from "@/lib/gyms/gyms";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring focus-visible:outline-none";

// "Add a price" (P6-06, D36, D42): a member says what they pay. The report
// is anonymous and only shows once it's checked (P6-07). Offline, Firestore
// queues it and sends it when the connection returns.
export function AddPrice({ gym }: { gym: Gym }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [problems, setProblems] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  const close = () => {
    setOpen(false);
    setPlan("");
    setPrice("");
    setProblems([]);
  };

  const submit = () => {
    const report = { placeId: gym.placeId, gymName: gym.name, plan, monthlyPrice: Number(price), currency };
    const found = priceReportProblems(price.trim() === "" ? { ...report, monthlyPrice: Number.NaN } : report);
    if (found.length > 0) {
      setProblems(found);
      return;
    }
    // Not awaited: it resolves only once the server has it, which offline is later.
    sendPriceReport({ ...report, createdAt: new Date().toISOString() }).catch((err) =>
      console.error("Sending a price report failed", err)
    );
    setSent(true);
    close();
  };

  if (sent) {
    return <p className="flex h-11 items-center text-sm text-muted-foreground">Thanks! It shows once it&apos;s checked.</p>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Add a price for ${gym.name}`}
        className="flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-surface-raised"
      >
        <Plus className="size-4" aria-hidden />
        Add a price
      </button>

      <Dialog
        open={open}
        title={`What do you pay at ${gym.name}?`}
        onClose={close}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 flex-1" onClick={close}>
              Cancel
            </Button>
            <Button className="h-12 flex-1 font-bold" onClick={submit}>
              Send price
            </Button>
          </div>
        }
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <p className="text-sm text-muted-foreground">
            Your name isn&apos;t sent with it. We check prices before they show to everyone.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Plan</span>
            <input
              value={plan}
              maxLength={PRICE_LIMITS.plan}
              onChange={(event) => setPlan(event.target.value)}
              placeholder="Basic, Unlimited, Student"
              className={fieldClass}
            />
          </label>
          <div className="flex gap-3">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-sm font-medium">Per month</span>
              <input
                inputMode="decimal"
                value={price}
                onChange={(event) => setPrice(event.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="25"
                className={fieldClass}
              />
            </label>
            <div className="flex w-28 flex-col gap-1.5">
              <label htmlFor={`${id}-currency`} className="text-sm font-medium">
                Currency
              </label>
              <select
                id={`${id}-currency`}
                value={currency}
                onChange={(event) => setCurrency(event.target.value as Currency)}
                className={fieldClass}
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {problems.length > 0 && (
            <ul role="alert" className="text-sm text-danger">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </form>
      </Dialog>
    </>
  );
}
