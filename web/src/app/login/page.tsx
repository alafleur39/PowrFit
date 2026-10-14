"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { PowrFitLogo } from "@/components/powrfit-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const emailRegex = /\S+@\S+\.\S+/;

// Ported from the Expo app's Login.tsx — same friendly error mapping.
function mapFirebaseError(code: string | undefined): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Try signing in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Incorrect email or password. Please try again.";
    case "auth/user-not-found":
      return "We couldn’t find an account with that email.";
    case "auth/weak-password":
      return "Choose a stronger password (at least 6 characters).";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    default:
      return "Something went wrong. Please try again.";
  }
}

type AuthAction = "signIn" | "signUp";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState<AuthAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Straight to the app.
  useEffect(() => {
    if (!loading && user) {
      router.replace("/profile");
    }
  }, [loading, user, router]);

  const handleAuth = async (action: AuthAction) => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Enter both email and password to continue.");
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setSubmitting(action);

    try {
      if (action === "signIn") {
        await signIn(trimmedEmail, password);
      } else {
        await signUp(trimmedEmail, password);
      }
      router.replace("/profile");
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "code" in err
          ? mapFirebaseError((err as { code?: string }).code)
          : "Something went wrong. Please try again.";
      setError(message);
      setSubmitting(null);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleAuth("signIn");
  };

  return (
    <main className="w-screen flex-1 overflow-x-hidden bg-background lg:grid lg:grid-cols-[1fr_0.95fr]">
      <section className="energy-grid flex w-screen min-w-0 items-center justify-center px-4 py-10 lg:w-auto">
      <Card
        className="glass-card rounded-2xl border"
        style={{ width: "calc(100vw - 2rem)", maxWidth: "22rem" }}
      >
        <CardHeader className="items-center text-center">
          <PowrFitLogo variant="wordmark" className="mb-2 justify-center" />
          <CardTitle className="text-2xl text-white">Sign into PowrFit</CardTitle>
          <CardDescription>
            This is where fitness journeys start.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting !== null}
                aria-invalid={Boolean(error)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting !== null}
                aria-invalid={Boolean(error)}
              />
            </div>

            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting !== null}
              className="mt-1 bg-primary font-black uppercase text-primary-foreground hover:bg-primary/90"
            >
              {submitting === "signIn" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Sign In
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/15 bg-white/[0.06] text-white hover:bg-white/10"
              disabled={submitting !== null}
              onClick={() => handleAuth("signUp")}
            >
              {submitting === "signUp" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Create Account
            </Button>
          </form>
          <p className="text-muted-foreground mx-auto mt-6 max-w-xs text-center text-xs">
            Creating an account will sync your workouts and progress securely
            with PowrFit.
          </p>
        </CardContent>
      </Card>
      </section>
      <section className="relative hidden overflow-hidden bg-[#080c12] lg:block">
        <Image
          src="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=1400&auto=format&fit=crop"
          alt="Gym floor with strength training equipment"
          fill
          sizes="50vw"
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(217,255,45,0.18),transparent_24rem),linear-gradient(180deg,rgba(8,12,18,0.05),rgba(8,12,18,0.92))]" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <PowrFitLogo variant="compact" className="mb-6" />
          <p className="max-w-md text-4xl font-black uppercase leading-none tracking-normal">
            Every rep, session, and goal in one focused training app.
          </p>
        </div>
      </section>
    </main>
  );
}
