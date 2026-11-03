"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { ExternalLink, PlayCircle, Search } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { suggestTopics, videoLinkFor, youtubeSearchUrl, type Suggestion } from "@/lib/strength";
import { embedUrl, formatVideoLength, topicVideos, watchUrl } from "@/lib/videos/video-api";
import type { Video } from "@/lib/videos/youtube";
import { Dialog } from "./dialog";
import { useHistoryLogs } from "./use-records";

// "For you" (P6-02, D37; videos in V-03): videos picked from the user's own
// training, each with the reason it was picked. The topics are worked out on
// the phone; only the topic goes to /api/videos. Each suggestion shows up to
// three videos that play inside PowrFit (D49). Until they arrive, or if they
// can't (offline, quota spent), it's a YouTube search link as before.
// The iOS app opens videos in YouTube instead: YouTube refuses to play embeds
// in a capacitor:// page (Error 153, checked in the Simulator on Nov 2).
export function ForYou({ className }: { className?: string }) {
  const { logs, loading } = useHistoryLogs();
  const [now] = useState(() => new Date());
  const [playing, setPlaying] = useState<Video | null>(null);
  const headingId = useId();
  const suggestions = useMemo(() => suggestTopics(logs, now), [logs, now]);
  if (loading || suggestions.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2 id={headingId} className="mb-2 text-footnote font-bold">
        For you
      </h2>
      <ul className="flex flex-col gap-3">
        {suggestions.map((suggestion) => (
          <li key={suggestion.topic}>
            <SuggestionCard suggestion={suggestion} onPlay={setPlaying} />
          </li>
        ))}
      </ul>
      <VideoPlayer video={playing} onClose={() => setPlaying(null)} />
    </section>
  );
}

type Loaded = { topic: string; videos: Video[] } | null;

function SuggestionCard({ suggestion, onPlay }: { suggestion: Suggestion; onPlay: (video: Video) => void }) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState<Loaded>(null);

  useEffect(() => {
    if (!user) return;
    let current = true;
    topicVideos(user, suggestion.topic).then(
      (videos) => current && setLoaded({ topic: suggestion.topic, videos }),
      () => current && setLoaded({ topic: suggestion.topic, videos: [] })
    );
    return () => {
      current = false;
    };
  }, [user, suggestion.topic]);

  const videos = loaded?.topic === suggestion.topic ? loaded.videos : [];
  if (videos.length === 0) return <SearchLinkCard suggestion={suggestion} />;

  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="font-semibold">{suggestion.title}</p>
      <p className="text-footnote text-muted-foreground">{suggestion.reason}</p>
      <ul
        aria-label={`Videos: ${suggestion.title}`}
        className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1"
      >
        {videos.map((video) => (
          <li key={video.videoId} className="w-56 shrink-0 snap-start">
            <VideoLink video={video} onPlay={onPlay}>
              <span className="relative block overflow-hidden rounded-tile bg-surface-raised">
                {/* A plain img: YouTube's thumbnails are already sized, and next/image would proxy them. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={video.thumbnail} alt="" loading="lazy" width={320} height={180} className="aspect-video w-full object-cover" />
                <PlayCircle className="absolute inset-0 m-auto size-10 text-foreground drop-shadow" aria-hidden />
                {video.durationSec > 0 && (
                  <span className="absolute right-1.5 bottom-1.5 rounded-input bg-scrim px-1 tabular-nums text-caption text-foreground">
                    {formatVideoLength(video.durationSec)}
                  </span>
                )}
              </span>
              <span className="mt-1.5 line-clamp-2 text-footnote font-medium">{video.title}</span>
              <span className="block truncate text-caption text-muted-foreground">{video.channel} · YouTube</span>
            </VideoLink>
          </li>
        ))}
      </ul>
      <a
        href={youtubeSearchUrl(suggestion.query)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-11 items-center gap-2 text-footnote font-semibold text-accent"
      >
        <Search className="size-4" aria-hidden />
        More on YouTube
      </a>
    </div>
  );
}

/** Plays in the sheet on the website; opens YouTube from the iOS app. */
function VideoLink({ video, onPlay, children }: { video: Video; onPlay: (video: Video) => void; children: ReactNode }) {
  const label = `Play ${video.title} by ${video.channel}`;
  if (Capacitor.isNativePlatform()) {
    return (
      <a href={watchUrl(video.videoId)} target="_blank" rel="noopener noreferrer" aria-label={label} className="block w-full">
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={() => onPlay(video)} aria-label={label} className="block w-full text-left">
      {children}
    </button>
  );
}

/** Today's card: a YouTube search (or the library's pick) in a new tab. */
function SearchLinkCard({ suggestion }: { suggestion: Suggestion }) {
  return (
    <a
      href={videoLinkFor(suggestion)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-14 items-center gap-3 rounded-card border border-border bg-surface p-4 hover:bg-surface-raised"
    >
      <PlayCircle className="size-6 shrink-0 text-accent" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{suggestion.title}</span>
        <span className="block text-footnote text-muted-foreground">{suggestion.reason}</span>
      </span>
      <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-label="Opens YouTube" />
    </a>
  );
}

/** The video in a sheet, with YouTube's privacy-enhanced player (D49). */
function VideoPlayer({ video, onClose }: { video: Video | null; onClose: () => void }) {
  return (
    <Dialog open={video !== null} title={video?.title ?? ""} onClose={onClose} className="md:max-w-2xl">
      {video && (
        <div className="flex flex-col gap-3">
          <iframe
            src={embedUrl(video.videoId)}
            title={`YouTube video: ${video.title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="aspect-video w-full rounded-tile bg-background"
          />
          <p className="text-footnote text-muted-foreground">{video.channel}</p>
          <a
            href={watchUrl(video.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-footnote font-semibold text-accent"
          >
            <ExternalLink className="size-4" aria-hidden />
            Watch on YouTube
          </a>
        </div>
      )}
    </Dialog>
  );
}
