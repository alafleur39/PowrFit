import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = { title: "Privacy · PowrFit" };

// Privacy in plain words (P5-05, D31). Public, so it can be read before
// signing up.
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/home"
        className="inline-flex min-h-11 items-center gap-2 text-footnote font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-5" aria-hidden />
        PowrFit
      </Link>
      <h1 className="mt-2 text-title1 font-bold">Privacy</h1>
      <p className="mt-1 text-footnote text-muted-foreground">Last updated November 9, 2026.</p>

      <div className="mt-6 flex flex-col gap-6 text-body leading-relaxed">
        <section>
          <h2 className="text-headline font-bold">What PowrFit stores</h2>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground">
            <li>Your email address and password, to sign you in. The password is never stored in readable form.</li>
            <li>The workouts you log: exercises, sets, weights, reps, cardio times and distances, notes, and when you trained.</li>
            <li>The routines you create, and whether you use kg or lb.</li>
            <li>The name and avatar color you pick in your profile. There are no profile photos.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-headline font-bold">Where it&apos;s kept</h2>
          <p className="mt-2 text-muted-foreground">
            In Google Firebase, which runs PowrFit&apos;s sign-in and database. Your phone also keeps a
            copy so the app works offline. Only your account can read your data; the developer can
            reach the database to fix problems.
          </p>
        </section>
        <section>
          <h2 className="text-headline font-bold">Gyms near you</h2>
          <p className="mt-2 text-muted-foreground">
            Location is only asked for when you tap Near me. Your phone sends PowrFit a rough area of
            about 1 km, never your exact spot, and nothing about where you searched is saved to your
            account. Gyms are found on OpenStreetMap; a typed city or zip code is sent to
            OpenStreetMap&apos;s place search. A price you report is stored without your name or
            account, and shows to everyone once it&apos;s checked.
          </p>
        </section>
        <section>
          <h2 className="text-headline font-bold">Video suggestions</h2>
          <p className="mt-2 text-muted-foreground">
            Suggestions are worked out on your phone from your workouts. To find videos, PowrFit&apos;s
            server sends YouTube only the suggestion&apos;s topic, such as &quot;bench press form&quot;,
            never your workout data or who you are. Videos play in YouTube&apos;s privacy-enhanced
            player, which sets no YouTube cookies until you press play; once a video plays, or you
            open it on YouTube, YouTube&apos;s own privacy policy applies.
          </p>
          <p className="mt-2 text-muted-foreground">
            PowrFit uses YouTube API Services. By watching videos in PowrFit you agree to the{" "}
            <a href="https://www.youtube.com/t/terms" className="underline" target="_blank" rel="noopener noreferrer">
              YouTube Terms of Service
            </a>
            , and{" "}
            <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">
              Google&apos;s Privacy Policy
            </a>{" "}
            explains how Google handles data.
          </p>
        </section>
        <section>
          <h2 className="text-headline font-bold">Feedback</h2>
          <p className="mt-2 text-muted-foreground">
            Send feedback opens a short form outside the app. Only what you type into it is sent, and
            it&apos;s used to fix bugs and improve PowrFit.
          </p>
        </section>
        <section>
          <h2 className="text-headline font-bold">What it&apos;s not used for</h2>
          <p className="mt-2 text-muted-foreground">
            No ads, no selling or sharing your data, and no tracking across other sites or apps.
          </p>
        </section>
        <section>
          <h2 className="text-headline font-bold">Deleting it</h2>
          <p className="mt-2 text-muted-foreground">
            Profile → Delete account removes your workouts, routines, settings and login for good.
            You can also delete single workouts from their summary.
          </p>
        </section>
      </div>
    </main>
  );
}
