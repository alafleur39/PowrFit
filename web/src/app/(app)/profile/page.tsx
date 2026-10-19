"use client";

import Link from "next/link";
import { ChevronRight, MessageSquare, Shield } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { DeleteAccount } from "@/components/profile/delete-account";
import { ScreenHeader } from "@/components/shell/placeholder";

/** The beta feedback form (D30). Unset: the button isn't shown. */
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL?.startsWith("https://")
  ? process.env.NEXT_PUBLIC_FEEDBACK_URL
  : undefined;

const row =
  "flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 hover:bg-surface-raised";

// Profile (P5-05): the account, feedback, privacy and deleting the account.
export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="pb-10">
      <ScreenHeader title="Profile" subtitle={user?.email ?? undefined} />
      <div className="mx-auto flex max-w-2xl flex-col gap-3 px-4 sm:px-6">
        {FEEDBACK_URL && (
          <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className={row}>
            <MessageSquare className="size-5 text-accent" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Send feedback</span>
              <span className="block text-sm text-muted-foreground">
                Bugs, ideas, anything confusing. Opens a short form.
              </span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </a>
        )}
        <Link href="/privacy" className={row}>
          <Shield className="size-5 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Privacy</span>
            <span className="block text-sm text-muted-foreground">What PowrFit stores and why.</span>
          </span>
          <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
        </Link>

        <section aria-labelledby="danger-zone" className="mt-6 flex flex-col gap-2">
          <h2 id="danger-zone" className="text-sm font-bold">
            Delete account
          </h2>
          <p className="text-sm text-muted-foreground">
            Removes your workouts, routines, settings and login for good.
          </p>
          <DeleteAccount />
        </section>
      </div>
    </div>
  );
}
