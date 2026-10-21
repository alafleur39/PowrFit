"use client";

import { useId, useMemo, useState } from "react";
import { Loader2, LocateFixed, MapPin, Navigation, Search } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { useActiveWorkout } from "@/components/workout/active-workout-provider";
import { searchGyms, GymSearchError, type GymSearch, type GymSearchResult } from "@/lib/gyms/gym-api";
import { loadGymPrices } from "@/lib/gyms/gym-repo";
import type { GymPrices } from "@/lib/gyms/gyms";
import { formatDistance, formatMonthly, rankGyms, type GymSort, type RankedGym } from "@/lib/gyms/rank";
import { cn } from "@/lib/utils";
import { AddPrice } from "./add-price";

type Found = GymSearchResult & {
  /** Where distances are measured from: your position, or the place's centre. */
  origin: { lat: number; lon: number };
  label: string;
  prices: Map<string, GymPrices>;
};

// The last search, kept for this session only (like D39's lastSeen): coming
// back to the screen shows it again without asking for location. Never
// written to storage, so no position is left on the device.
let lastFound: Found | null = null;

const BUDGETS = [25, 50, 75, 100] as const;

function locate(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new GymSearchError("This browser can't share your location. Search a city or zip code instead."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      (error) =>
        reject(
          new GymSearchError(
            error.code === error.PERMISSION_DENIED
              ? "Location is off for PowrFit. Search a city or zip code instead."
              : "Couldn't find your location. Search a city or zip code instead."
          )
        ),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }
    );
  });
}

// Gyms near you (P6-06, D35, D36): gyms from OpenStreetMap around you or a
// place you type, cheapest known price first. Prices are ones members
// reported and you approved; anyone can report one.
export function GymsView() {
  const { user } = useAuth();
  const { unit } = useActiveWorkout();
  const [found, setFound] = useState<Found | null>(lastFound);
  const [place, setPlace] = useState("");
  const [busy, setBusy] = useState<"near" | "place" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<GymSort>("price");
  const [budget, setBudget] = useState<number | undefined>();
  const resultsId = useId();

  const run = async (kind: "near" | "place") => {
    if (!user || busy) return;
    if (kind === "place" && place.trim().length < 2) {
      setError("Type a city, neighbourhood or zip code.");
      return;
    }
    setBusy(kind);
    setError(null);
    try {
      const here = kind === "near" ? await locate() : null;
      const search: GymSearch = here ? { kind: "near", ...here } : { kind: "place", place };
      const result = await searchGyms(user, search);
      const prices = await loadGymPrices(result.gyms.map((gym) => gym.placeId));
      const next: Found = {
        ...result,
        origin: here ?? result.center,
        label: here ? "near you" : `near ${place.trim()}`,
        prices,
      };
      lastFound = next;
      setFound(next);
    } catch (err) {
      if (!(err instanceof GymSearchError)) console.error("Gym search failed", err);
      setError(err instanceof GymSearchError ? err.message : "Something went wrong finding gyms. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const ranked = useMemo(
    () => (found ? rankGyms(found.gyms, found.prices, found.origin, { sort, maxMonthly: budget }) : []),
    [found, sort, budget]
  );
  const hidden = found ? found.gyms.length - ranked.length : 0;
  const currency = ranked.find((item) => item.cheapest)?.cheapest?.currency ?? "USD";

  return (
    <div className="flex flex-col gap-4 px-4 pb-6 sm:px-6">
      <section aria-label="Find gyms" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <button
          type="button"
          onClick={() => void run("near")}
          disabled={busy !== null}
          className="brand-glow flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 font-bold text-accent-foreground disabled:opacity-70"
        >
          {busy === "near" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <LocateFixed className="size-4" aria-hidden />
          )}
          Near me
        </button>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run("place");
          }}
        >
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">City or zip code</span>
            <MapPin
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={place}
              maxLength={80}
              onChange={(event) => setPlace(event.target.value)}
              placeholder="City or zip code"
              className="h-11 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy !== null}
            aria-label="Search"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border text-foreground hover:bg-surface-raised disabled:opacity-70"
          >
            {busy === "place" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
          </button>
        </form>
        <p className="text-xs text-muted-foreground">
          Near me sends only your rough area (about 1 km), never your exact spot.
        </p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </section>

      {found && (
        <section aria-labelledby={resultsId} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id={resultsId} className="text-sm font-bold">
              {found.gyms.length === 0 ? "No gyms found" : `Gyms ${found.label}`}
            </h2>
            <div className="flex items-center gap-2">
              <div role="group" aria-label="Sort" className="flex rounded-full border border-border p-0.5">
                {(["price", "distance"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={sort === option}
                    onClick={() => setSort(option)}
                    className={cn(
                      "h-10 rounded-full px-3 text-sm font-medium",
                      sort === option ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                  >
                    {option === "price" ? "Cheapest" : "Nearest"}
                  </button>
                ))}
              </div>
              <label className="sr-only" htmlFor={`${resultsId}-budget`}>
                Budget
              </label>
              <select
                id={`${resultsId}-budget`}
                value={budget ?? ""}
                onChange={(event) => setBudget(event.target.value ? Number(event.target.value) : undefined)}
                className="h-11 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
              >
                <option value="">Any price</option>
                {BUDGETS.map((amount) => (
                  <option key={amount} value={amount}>
                    Up to {formatMonthly({ monthlyPrice: amount, currency })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {found.gyms.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted-foreground">
              The map has no gyms within 5 km. Try a nearby town or zip code.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {ranked.map((item) => (
                <GymRow key={item.gym.placeId} item={item} unit={unit} />
              ))}
            </ul>
          )}
          {hidden > 0 && (
            <p className="text-sm text-muted-foreground">
              {hidden === 1 ? "1 gym costs" : `${hidden} gyms cost`} more than your budget.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Gym locations ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              OpenStreetMap contributors
            </a>
            . Prices come from members and are checked before they show.
          </p>
        </section>
      )}
    </div>
  );
}

function GymRow({ item, unit }: { item: RankedGym; unit: "kg" | "lb" }) {
  const { gym, cheapest, distanceKm } = item;
  const directions = `https://maps.apple.com/?daddr=${gym.lat},${gym.lon}&q=${encodeURIComponent(gym.name)}`;
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{gym.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatDistance(distanceKm, unit)}
            {gym.address && ` · ${gym.address}`}
          </p>
        </div>
        <p className={cn("shrink-0 text-right", cheapest ? "font-mono font-bold text-accent" : "text-sm text-muted-foreground")}>
          {cheapest ? (
            <>
              {formatMonthly(cheapest)}
              <span className="block font-sans text-xs font-normal text-muted-foreground">{cheapest.name}</span>
            </>
          ) : (
            "No price yet"
          )}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Directions to ${gym.name}`}
          className="flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-surface-raised"
        >
          <Navigation className="size-4" aria-hidden />
          Directions
        </a>
        <AddPrice gym={gym} />
      </div>
    </li>
  );
}
