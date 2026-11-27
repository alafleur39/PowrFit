import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = { title: "Support · PowrFit" };

/** The feedback form (D30), reused as the contact form. */
const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL?.startsWith("https://")
  ? process.env.NEXT_PUBLIC_FEEDBACK_URL
  : undefined;
/** Optional support address. Unset: only the form is offered. */
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.includes("@")
  ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL
  : undefined;

const FAQ: { q: string; a: string }[] = [
  {
    q: "I forgot my password.",
    a: "On the sign-in screen, type your email and tap Forgot password. A reset link arrives by email within a few minutes; check your spam folder too.",
  },
  {
    q: "How do I delete my account?",
    a: "Profile → Delete account. It removes your workouts, routines, settings and login for good, and asks you to confirm first.",
  },
  {
    q: "The rest timer doesn't ring when my phone is locked.",
    a: "PowrFit needs permission to send notifications. Open the iPhone Settings app → Notifications → PowrFit and turn on Allow Notifications.",
  },
  {
    q: "Near me can't find gyms.",
    a: "PowrFit needs your location once. Open Settings → Privacy & Security → Location Services → PowrFit and choose While Using the App. You can also type a city or ZIP code instead.",
  },
  {
    q: "Where do gym prices come from?",
    a: "Chain gyms show the chain's advertised price. Other prices are sent in by members and checked by PowrFit before they show. Prices can change, so confirm with the gym.",
  },
  {
    q: "A gym price is wrong or offensive.",
    a: "Tap Report next to the price in Gyms. PowrFit checks every report and takes the price down if it's wrong. People who send abusive prices are blocked from sending more.",
  },
  {
    q: "Does PowrFit work offline?",
    a: "Yes. Workouts you log offline are kept on your phone and saved to your account when you're back online.",
  },
];

// Support (Phase 8): the App Store's Support URL. Public, like Privacy.
export default function SupportPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
      <Link
        href="/home"
        className="inline-flex min-h-11 items-center gap-2 text-footnote font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-5" aria-hidden />
        PowrFit
      </Link>
      <h1 className="mt-2 text-title1 font-bold">Support</h1>
      <p className="mt-1 text-footnote text-muted-foreground">Answers to common questions, and how to reach us.</p>

      <div className="mt-6 flex flex-col gap-6 text-body leading-relaxed">
        <section>
          <h2 className="text-headline font-bold">Contact</h2>
          <p className="mt-2 text-muted-foreground">
            Found a bug, have an idea, or need help? {FEEDBACK_URL || SUPPORT_EMAIL ? "" : "Write to us from the App Store page."}
            {FEEDBACK_URL && (
              <>
                Send a message with the{" "}
                <a href={FEEDBACK_URL} className="underline" target="_blank" rel="noopener noreferrer">
                  contact form
                </a>
                {SUPPORT_EMAIL ? " or " : "."}
              </>
            )}
            {SUPPORT_EMAIL && (
              <>
                {FEEDBACK_URL ? "email " : "Email "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                  {SUPPORT_EMAIL}
                </a>
                .
              </>
            )}{" "}
            We usually reply within 2 days.
          </p>
        </section>
        <section>
          <h2 className="text-headline font-bold">Common questions</h2>
          <dl className="mt-2 flex flex-col gap-4">
            {FAQ.map(({ q, a }) => (
              <div key={q}>
                <dt className="font-semibold">{q}</dt>
                <dd className="mt-1 text-muted-foreground">{a}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section>
          <h2 className="text-headline font-bold">Privacy</h2>
          <p className="mt-2 text-muted-foreground">
            See{" "}
            <Link href="/privacy" className="underline">
              what PowrFit stores and why
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
