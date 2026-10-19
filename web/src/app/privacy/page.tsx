import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Privacy · PowrFit" };

// Privacy in plain words (P5-05, D31). Public, so it can be read before
// signing up.
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/home"
        className="inline-flex h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        PowrFit
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Privacy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated October 19, 2026. PowrFit is in beta.</p>

      <div className="mt-6 flex flex-col gap-6 text-base leading-relaxed">
        <section>
          <h2 className="text-lg font-bold">What PowrFit stores</h2>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground">
            <li>Your email address and password, to sign you in. The password is never stored in readable form.</li>
            <li>The workouts you log: exercises, sets, weights, reps, notes, and when you trained.</li>
            <li>The routines you create, and whether you use kg or lb.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-bold">Where it&apos;s kept</h2>
          <p className="mt-2 text-muted-foreground">
            In Google Firebase, which runs PowrFit&apos;s sign-in and database. Your phone also keeps a
            copy so the app works offline. Only your account can read your data; the developer can
            reach the database to fix problems.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">What it&apos;s not used for</h2>
          <p className="mt-2 text-muted-foreground">
            No ads, no selling or sharing your data, and no tracking across other sites or apps.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Deleting it</h2>
          <p className="mt-2 text-muted-foreground">
            Profile → Delete account removes your workouts, routines, settings and login for good.
            You can also delete single workouts from their summary.
          </p>
        </section>
      </div>
    </main>
  );
}
