"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useActiveWorkout } from "@/components/workout/active-workout-provider";
import { Dialog } from "@/components/workout/dialog";
import { deleteAccount } from "@/lib/account";
import { errorCode } from "@/lib/workout/sync-status";

function message(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "That password isn't right.";
    case "auth/too-many-requests":
      return "Too many tries. Wait a few minutes, then try again.";
    case "auth/network-request-failed":
    case "unavailable":
      return "Deleting needs a connection. Connect to the internet and try again.";
    default:
      return "Something went wrong, and your account wasn't deleted. Please try again.";
  }
}

// "Delete account" (P5-05, D31). Asks for the password, which confirms the
// choice and gives Firebase the recent sign-in it requires. Signing out
// afterwards happens on its own: the app sends a signed-out user to login.
export function DeleteAccount() {
  const { user } = useAuth();
  const { clearDevice } = useActiveWorkout();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setOpen(false);
    setPassword("");
    setError(null);
  };

  const confirm = async () => {
    if (!user || password === "") {
      setError("Enter your password to confirm.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(user, password, clearDevice);
    } catch (err) {
      console.error("Deleting the account failed", err);
      setError(message(errorCode(err)));
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="h-12 w-full border-danger/50 bg-transparent text-base font-semibold text-danger hover:bg-surface sm:w-auto"
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>

      <Dialog
        open={open}
        title="Delete your account?"
        onClose={busy ? () => undefined : close}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" className="h-12 flex-1" disabled={busy} onClick={close}>
              Keep it
            </Button>
            <Button
              className="h-12 flex-1 bg-danger text-white hover:bg-danger/90"
              disabled={busy}
              onClick={confirm}
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Delete forever
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            This deletes your workouts, routines and settings, and your login, on every device. It
            can&apos;t be undone.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground focus-visible:border-ring focus-visible:outline-none"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
