import { ChartLine, Dumbbell, Home, MapPin, User, type LucideIcon } from "lucide-react";

// One shared destination config, two presentations (bottom bar + sidebar).
// POWRFIT_NAV_SPEC §3.
export type Destination = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const DESTINATIONS: Destination[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: ChartLine },
  { href: "/gyms", label: "Gyms", icon: MapPin },
  { href: "/profile", label: "Profile", icon: User },
];

/**
 * Whether two paths are the same page. The iOS app's static export ends
 * every path with "/" ("/log/"), the website doesn't ("/log"), so a plain
 * === check silently fails in the app.
 */
export function isSamePath(pathname: string, href: string): boolean {
  const strip = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);
  return strip(pathname) === strip(href);
}

// A destination is active for its own route and any nested route (e.g.
// /workouts/[id] keeps the Workouts tab lit).
export function isDestinationActive(href: string, pathname: string): boolean {
  return isSamePath(pathname, href) || pathname.startsWith(`${href}/`);
}
