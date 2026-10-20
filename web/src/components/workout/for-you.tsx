"use client";

import { useId, useMemo, useState } from "react";
import { ExternalLink, PlayCircle } from "lucide-react";

import { suggestTopics, videoLinkFor } from "@/lib/strength";
import { useHistoryLogs } from "./use-records";

// "For you" (P6-02, D37): videos picked from the user's own training, each
// with the reason it was picked. Worked out on the phone; opening one sends
// only the search words to YouTube. Hidden when there's nothing to suggest.
export function ForYou({ className }: { className?: string }) {
  const { logs, loading } = useHistoryLogs();
  const [now] = useState(() => new Date());
  const headingId = useId();
  const suggestions = useMemo(() => suggestTopics(logs, now), [logs, now]);
  if (loading || suggestions.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="mb-2 text-sm font-bold">
        For you
      </h2>
      <ul className="flex flex-col gap-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion.topic}>
            <a
              href={videoLinkFor(suggestion)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-surface p-4 hover:bg-surface-raised"
            >
              <PlayCircle className="size-6 shrink-0 text-accent" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{suggestion.title}</span>
                <span className="block text-sm text-muted-foreground">{suggestion.reason}</span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-label="Opens YouTube" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
