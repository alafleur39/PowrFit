# PowrFit UI/UX audit (playbook Phase 0)

Done November 3, 2026, on `feat/phase-7`. No visual changes in this phase.

## Stack and how we see the app

- **Stack:** Next.js 16 + React 19 + Tailwind CSS 4 (CSS-variable theme in `src/app/globals.css`), shadcn-style primitives in `src/components/ui/`, lucide icons, framer-motion. The iOS app is the same site in a Capacitor 8 shell (`ios/`), so a web change is an app change.
- **Not Expo/React Native.** Playbook terms translate as:
  - `src/theme/` → the tokens in `globals.css` (`:root` and `@theme inline`).
  - Dynamic Type → rem-based sizes. WKWebView follows the iOS text size only if we opt in with `font: -apple-system-body` on the root. Today it doesn't.
  - `expo-haptics` → `@capacitor/haptics`. It isn't installed (new package, so it needs approval). Today there are no haptics.
  - SF Pro → `system-ui` / `-apple-system`. Today the app uses Geist Sans and Geist Mono (`src/app/layout.tsx:2-3`, `globals.css` `--font-sans`/`--font-mono`).
- **Screenshot loop:** `npm run screenshots`, using `scripts/screenshots.spec.ts` and `scripts/screenshots.config.ts`.
  - It runs Playwright WebKit at iPhone 13 size (390×844 @3x) against the Firebase emulators.
  - It seeds two test accounts: a new one, and one with 5 weeks of Push/Pull/Leg history.
  - It saves JPEGs to `docs/screenshots/<SHOTS_PHASE>/` (default `phase0`).
  - 27 shots, 5.0 MB, about 50 s.
  - `docs/screenshots/` is gitignored because the repo is public.
- **Limits of web screenshots:**
  - They show layout only. Fonts are close, but safe areas, haptics and the keyboard need a real iPhone or the Simulator.
  - The round "N" at the bottom left of every shot is the Next.js dev-mode indicator. It isn't in the app.

## Screens

| Route | File | Screenshot(s) |
|---|---|---|
| `/login` | `src/app/login/page.tsx` | login |
| `/home` | `src/app/(app)/home/page.tsx` | home-empty, home-new-week, home-populated (+ `-bottom`) |
| `/workouts` (Routines / History / Explore) | `src/app/(app)/workouts/page.tsx`, `components/workout/workouts-tabs.tsx` | workouts-* |
| `/workouts/routines/edit` | `src/app/(app)/workouts/routines/edit/page.tsx` | — |
| `/workouts/history/view` | `src/app/(app)/workouts/history/view/page.tsx` | — |
| `/log` (active-workout logger) | `src/app/(app)/log/page.tsx` | logger-start, logger-set-done, logger-bottom, logger-finish-dialog, logger-summary |
| `/progress` | `src/app/(app)/progress/page.tsx`, `components/workout/progress-view.tsx` | progress-empty, progress-week, progress-month (+ bottom) |
| `/gyms` | `src/app/(app)/gyms/page.tsx`, `components/gyms/gyms-view.tsx` | gyms-empty |
| `/profile` | `src/app/(app)/profile/page.tsx`, `components/profile/*` | profile-empty, profile, profile-bottom |
| `/privacy` | `src/app/privacy/page.tsx` | privacy |
| `/dashboard` | `src/app/(app)/dashboard/page.tsx` | (old address, redirects) |

Not captured yet:
- routine editor
- one workout's history detail
- exercise picker sheet
- account drawer
- gyms results
- error/offline states
- largest text size

## Shared components and where styles live

- **Tokens:** `src/app/globals.css`.
  - Brand variables: `--bg #0a0a0a`, `--surface #161616`, `--surface-active #1a1a0e`, `--surface-raised #1f1f1f`, `--hairline #262626`, `--brand #ffd60a`, `--on-brand`, `--text-primary #fff`, `--text-secondary #8e8e93`, `--success #30d158`, `--danger #ff453a`.
  - These are mapped to shadcn names.
  - One radius: `--radius 0.625rem`.
  - Utilities: `brand-glow`, `glass-card` (blur), `energy-grid`.
  - Press feedback: 120 ms with opacity and scale. Page crossfade: 120/180/240 ms. A Reduce Motion block exists.
- **Primitives:** `components/ui/` (button, card, input, label).
- **Shell:** `components/app-shell.tsx`, `components/powrfit-logo.tsx`, and `components/shell/`:
  - `bottom-tab-bar.tsx`, `fab.tsx`, `sidebar.tsx`, `stats-rail.tsx`, `segmented-tabs.tsx`, `account-drawer.tsx`
  - `placeholder.tsx` (holds `ScreenHeader`)
- **Feature components:** `components/workout/` (24 files), `components/gyms/` (2), `components/profile/` (4).
- **Missing as shared components:**
  - ListRow, EmptyState, StatTile, Skeleton, Toast, ChartContainer.
  - Each screen builds its own version from Tailwind classes. For example, the stat tiles in Home `WeekChips` and in `ProfileCard` are separate.
  - The Dialog lives in `components/workout/dialog.tsx`.

## Hardcoded style values (63 `.tsx` files scanned, tests excluded)

| What | Count | Where |
|---|---|---|
| Hex / rgb colors in components | 14 | `app/opengraph-image.tsx` (6, fine: image generator), `app/login/page.tsx` (4), `app/layout.tsx` (1, theme-color), `powrfit-logo.tsx` (1), `profile-avatar.tsx` (1), `profile-card.tsx` (1) |
| Arbitrary text sizes `text-[…]` | 11 | `progress-charts.tsx` (6 × `text-[10px]`), `powrfit-logo.tsx`, `profile-avatar.tsx`, `profile-card.tsx`, `bottom-tab-bar.tsx`, `set-row.tsx` |
| Named Tailwind text sizes | 244 | everywhere (scale exists but isn't a semantic type ramp) |
| Arbitrary spacing/sizes `p-[…]`, `h-[…]` … | 13 | `app-shell.tsx` (3), `active-workout-strip.tsx` (2), `dialog.tsx` (2), `rest-timer.tsx` (2), `log/page.tsx`, `account-drawer.tsx`, `bottom-tab-bar.tsx`, `fab.tsx` (mostly safe-area `calc()`s, legitimate) |
| Arbitrary radii / shadows | 3 | `dialog.tsx` (2), `powrfit-logo.tsx` |
| Glow / shadow classes | 8 | `ui/button.tsx` (4), `powrfit-logo.tsx`, `fab.tsx`, `ui/card.tsx`, `ui/input.tsx`, plus `brand-glow` utility on the logo, FAB and Home's start button |
| `font-mono` | 24 | 16 files; most in `home/page.tsx`, `progress-view.tsx`, `workout-summary.tsx` (3 each) |
| `rounded-full` | 31 | buttons, chips, avatar, FAB, tab pills |
| `text-accent` / `bg-accent` | 60 | yellow is used broadly |

Spacing already follows Tailwind's 4-px scale, so the work there is consistency, not a new scale.

## Known issues: confirmed or rejected

Layout and navigation

1. **"+" covers content.** Confirmed.
   - `components/shell/fab.tsx:12-14`: fixed at `bottom-[calc(5rem+safe-area)] right-4`, `size-14`, on every tab below `md` (`app-shell.tsx:105`).
   - It covers the right edge of the last card on Home, Workouts (Leg day "Start"), Progress and Profile (Privacy row) in `*-bottom.jpg`.
   - It has an `aria-label` ("Log workout") but no visible label.
   - It opens `/log`, the same as "Empty workout" when no workout is in progress.
2. **Bottom spacing.** Partly confirmed.
   - `main` has `pb-24` (`app-shell.tsx:73-76`), so the last item clears the tab bar.
   - It doesn't clear the FAB, which sits 80 px up and is 56 px tall. See `workouts-routines-bottom.jpg`.
3. **Header height.** Confirmed.
   - Top bar `h-[calc(3.5rem+safe-area)]` (`app-shell.tsx:79`), then `ScreenHeader` adds `pt-5 pb-4` + `text-2xl` title + subtitle (`shell/placeholder.tsx:14-18`). That's about 200 px of 844 before content (≈ 24 %).
   - The avatar repeats Profile and opens a drawer (`app-shell.tsx:80-87`).
   - **Logo off-centre:** the left button is `size-11` (44 px) while the right spacer is `size-9` (36 px) (`app-shell.tsx:91`), so the logo sits 4 px left of centre. The wordmark text is also wider than the tile, so it reads further off.

Visual system

4. **Too much yellow.** Confirmed.
   - Home has 8 yellow elements: avatar, logo tile, "FIT", start button, 3 stat values, FAB, active tab, "All history" link.
   - Across components there are 60 `text-accent`/`bg-accent` uses, and the avatar defaults to yellow (`lib/profile.ts:41`).
5. **Monospace numbers.** Confirmed.
   - `font-mono` is Geist Mono, which has slashed zeros. It's used in 24 places across 16 files.
   - Examples: `home/page.tsx:59,124`; `set-row.tsx`; `profile-card.tsx`; `stats-rail.tsx:25`; the logger timer `log/page.tsx`.
   - It also makes "6,270 lb" render with wide gaps (`home-new-week-bottom.jpg`).
6. **Inconsistent buttons.** Confirmed.
   - Home start buttons are hand-built `button`s (`home/page.tsx:79-100`): pill, glow, h-11, auto width.
   - Preset "Start" pills (`routine-list.tsx` ~l.53) and the outlined "New routine" pill are separate.
   - The `ui/button.tsx` variants are used elsewhere, e.g. Delete account is `h-12` full width, rounded-md.
7. **The same tabs used for sections and filters.** Confirmed. `shell/segmented-tabs.tsx` is used by `workouts-tabs.tsx:10` (sections) and `progress-view.tsx:48` (time filter).
8. **Gray text contrast.** Rejected: it passes AA.
   - `#8e8e93` is 6.07:1 on `#0a0a0a`, 5.55:1 on `#161616`, 5.06:1 on `#1f1f1f` and 5.38:1 on `#1a1a0e`.
   - Yellow on black is 14.0:1, red is 5.8:1, green is 9.0:1.
   - The real legibility problem is size: chart labels are `text-[10px]` (`progress-charts.tsx:57,159-169`).

States and data trust

9. **Home vs Profile.** Not a bug. Both follow the rules as written, but nothing on screen explains them. Details are in the investigation below.
10. **Empty states.** Confirmed.
    - Home: three yellow zeros (`home/page.tsx:112-130`, `home-empty.jpg`).
    - Gyms: about 55 % blank below the search card (`gyms-empty.jpg`).
    - Trend chart: the y-axis prints `compact.format(high/low)` with **no unit** (`progress-charts.tsx:159-163`), so a single point shows a bare number like "104.5".
11. **"Up next" has no reason.** Confirmed. `home/page.tsx:63-77` picks the preset after the last preset done (Push → Pull → Leg) and shows only the name. A logic gap is listed below.

Content and controls

12. **Copy icon on presets.** Confirmed as a visual problem: it's icon-only. It does have an accessible name, "Copy Push day to my routines" (`routine-list.tsx:163-167`). It saves the preset into My routines.
13. **Raw YouTube thumbnails.** Mostly fixed by V-03 (`components/workout/for-you.tsx`).
    - Each video now shows title, channel, length and an official nocookie embed or the YouTube app.
    - The thumbnails themselves are still YouTube's own art, which often has loud text. We can't change them under YouTube's rules, only crop or frame them.
    - New finding: "For you" also appears at the bottom of Progress (`progress-view.tsx:61`), so the same cards show twice in the app.
14. **Delete account looks like a heading.** Confirmed.
    - `profile-bottom.jpg`: a bold "Delete account" heading and paragraph, then an outlined red full-width button (`delete-account.tsx:65-68`).
    - Confirmation already exists: a dialog asks for the password (`delete-account.tsx:28`, l.76-104).
15. **Name falls back to the email prefix.** Confirmed. `defaultProfile` in `lib/profile.ts:39-41` uses the part before "@". Editing exists (Profile → Edit), but nothing asks for a name.

Brand

16. **Wordmark.** Partly confirmed.
    - **Not a gradient:** it's two flat colours, "Powr" white and "Fit" yellow, as live text with `uppercase font-black` in Geist Sans (`powrfit-logo.tsx:82-89`). On a phone the yellow/white split can read like a fade.
    - **Glow confirmed:** `brand-glow` plus `shadow-[0_0_32px_rgba(217,255,45,0.28)]` (`powrfit-logo.tsx:72`). That rgba is **lime green**, left over from an older palette, layered under the yellow glow.
    - **Bolt:** a hand-written SVG path, not lucide's `Zap`, but drawn in the same style, in a rounded yellow tile with an inner highlight path (`powrfit-logo.tsx:12-38`).
    - **Casing:** "POWRFIT" in the logo vs "PowrFit" in text. Confirmed.
    - **Unused tagline:** the "Charge training" tagline (l.92) shows only in the full variant.
17. **Template-like details.**
    - `glass-card` (blur 16px) and `energy-grid` utilities exist in `globals.css`. The header uses `backdrop-blur-xl` (`app-shell.tsx:79`).
    - Every screen has a filler subtitle, e.g. "Your training at a glance." (`home/page.tsx:25`), and Gyms, Log and others do the same.
    - 31 `rounded-full` uses.

## New issues found

- N1. **Lime glow** on the logo (above). Off-brand colour.
- N2. **"For you" shows on both Home and Progress.** Decided (Nov 3): keep it on Home only; remove it from Progress in Phase 4 (Progress screen).
- N3. **No haptics anywhere.** The playbook's Phase 5 depends on `@capacitor/haptics`, a new package.
- N4. **Dark-only by design** (`globals.css:7-9`, `color-scheme: dark`). That's a deliberate choice to keep and document for App Review.
- N5. **The rest timer bar** stacks above the tab bar while logging (`logger-set-done.jpg`). The logger then has about 470 px of visible content between the header strip and the timer.
- N6. **Fonts:** Geist Sans for text, not the iOS system font. Moving to `system-ui` gets SF Pro on iPhone and drops two web-font downloads.

## Issue 9 investigation

**Home "This week" shows 0.**
- Home counts workouts since `weekStart(now)`: Monday 00:00 in the **device's** time zone (`lib/workout/format.ts:140-145`, `components/workout/use-week-stats.ts:13`).
- The screenshots were taken on a Monday, so a new week had just begun and 0 is correct.

**Profile shows a 1-week streak.**
- `weekStreak` doesn't count the current week against you until it's over (`lib/workout/week-stats.ts:21-34`). On Monday it counts back from last week, so 1 is also correct.

**Total volume and Workouts on Profile** are lifetime numbers (up to the last 500 workouts, `use-records.ts:12`), not this week's.

**0 PRs from 3 workouts** is correct under rule D22 (`lib/strength/records.ts:1-7`).
- A PR is a heaviest set that **beats an earlier workout's** heaviest set of that exercise.
- The first time you do an exercise never counts, and a tie isn't a PR.
- Three workouts on different routines (Push, Pull, Legs), or the same lift at the same weight, give 0.
- Reproduced with the seeded account: 12 workouts with rising weights give 11 PRs (`profile.jpg`).
- I can't check your own data from here. If any lift went up between two workouts, tell me and I'll dig in.

**Reproduced:** `home-new-week.jpg` (0 / 0 / 0 lb) and `profile.jpg` (streak 5) are from the same account on a Tuesday, with the last workout on Sunday.

**Suggested UI-only fixes (Phase 4 Home/Profile):**
- Label Profile's numbers as "All time".
- On Home in a new week, show "New week: last week you did N workouts" plus the streak instead of zeros.
- Explain PRs ("Beat your best weight on a lift to set a PR").

## Logic issues (found, not touched)

- L1. **"Up next" ignores your own routines.**
  - `home/page.tsx:63-68` looks only at `PRESET_ROUTINES`.
  - If your last workout was a custom routine or an empty workout, `lastIndex` is -1 and it suggests Push day.
- L2. **"This week" and Profile's "now" are frozen at mount.**
  - `useWeekStats` keeps `since` in `useState` (`use-week-stats.ts:13`), and `ProfileCard` keeps `now` the same way (`profile-card.tsx:40`).
  - If the app stays open over Sunday→Monday midnight, which is likely in an iOS app that's suspended rather than closed, Home keeps showing last week until a reload.
- L3. **"This week" uses the device clock and time zone.** Travel can move a late-night workout into the next or previous week. That's acceptable, but worth knowing.

## Disk space

- **Free at start:** 15 GB of 228 GB. That's below the playbook's 20 GB line; you approved this phase anyway.
- **This phase used:** about 5 MB of screenshots plus the dev server's `.next` cache, which already existed.
- **Space hogs:** `~/Library/Developer/CoreSimulator` 4.4 GB, `web/node_modules` 1.0 GB, `~/Library/Caches/ms-playwright` 851 MB, npm cache 532 MB, Xcode DerivedData 296 KB.
- **Cleanups you could run** (I didn't):
  - `xcrun simctl delete unavailable`
  - `npm cache clean --force` (about 0.5 GB)
  - In the Playwright cache, delete any browser folders other than the current `webkit-*` and `chromium-*`.
