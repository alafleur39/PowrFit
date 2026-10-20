"use client";

import { AVATAR_SWATCH, initials } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { useProfile } from "./use-profile";

// The user's avatar without photos (D41): initials on their chosen colour.
export function ProfileAvatar({ className }: { className?: string }) {
  const { profile } = useProfile();
  return (
    <span
      aria-hidden
      style={{ backgroundColor: AVATAR_SWATCH[profile.avatar.color] }}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#0a0a0a]",
        className
      )}
    >
      {initials(profile.displayName)}
    </span>
  );
}
