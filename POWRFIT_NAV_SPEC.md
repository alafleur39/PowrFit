# PowrFit — Navigation & Theming Spec

Build brief for the navigation shell and dark theme of the PowrFit web app.
Implement the navigation in the **X (Twitter) style**, mobile-first, fully
responsive to laptop/desktop. Build the **shell with placeholder screens
first**; real content comes after.

---

## 1. Tech stack (assumed already scaffolded)

- Next.js (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui (the existing `components/ui/*` were a port of this)
- Firebase Web SDK (Auth + Firestore) — already used by Login
- Framer Motion — tab-indicator + content transitions
- lucide-react — icons
- Deploy target: Vercel

If the Next.js app does not yet exist, scaffold it first, then return to this spec.

---

## 2. Theme — "lights out" black + electric yellow

Define these once as CSS variables in `globals.css` and map them in
`tailwind.config`. Everything reads from tokens — no hardcoded hex in components.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0A0A0A` | App background |
| `--surface` | `#161616` | Cards, chips, bars |
| `--surface-active` | `#1A1A0E` | Active sidebar item background (subtle yellow tint) |
| `--border` | `#262626` | Hairline borders/dividers |
| `--accent` | `#FFD60A` | Electric yellow — accents ONLY |
| `--text-primary` | `#FFFFFF` | Primary text |
| `--text-secondary` | `#8E8E93` | Muted text, inactive icons |

### Color rules (non-negotiable)
- **Yellow is for accents only**: active nav state, key stat numbers, the
  primary "Log workout" CTA, the logo. **Never** use yellow for body text.
- On yellow surfaces (FAB, CTA), text/icons are near-black (`#0A0A0A`).
- Use electric yellow `#FFD60A`, never pure `#FFFF00` (it halates on black).
- App is dark-only by design; no light-mode variant required this pass.

---

## 3. Navigation architecture

### Top-level destinations (one shared config, two presentations)
1. Home — `ti/lucide: home`
2. Workouts — `barbell`
3. Progress — `chart-line` / `line-chart`
4. Profile — `user`

Plus a primary action: **Log workout** (the FAB / CTA).
Plus an **account/avatar** entry that opens a slide-out drawer (settings, account).

### Within a section: swipeable / segmented top tabs
Example for Workouts: `My plans / Explore / History`, with a yellow active
underline that animates between tabs (Framer Motion `layoutId`).

---

## 4. Responsive behavior (mobile-first, Tailwind breakpoints)

Write the phone layout as default; layer desktop changes with `md:` / `lg:`.

| Element | Mobile (default) | Tablet/Desktop `md:` ≥768px | Wide `lg:` ≥1024px |
|---|---|---|---|
| Bottom tab bar | shown (`flex md:hidden`) | hidden | hidden |
| Left sidebar | hidden (`hidden md:flex`) | shown, icon + label | shown |
| Primary action | floating FAB above bottom bar | full-width "Log workout" button in sidebar | same |
| Content column | full width | `max-width` + centered | centered |
| Right stats rail | inline chips in content | inline chips | dedicated right rail (`hidden lg:block`) |
| Top segmented tabs | swipeable (touch) | clickable | clickable |
| Avatar | top-left, opens drawer | bottom of sidebar | bottom of sidebar |

Content column must cap its width on large monitors so lines don't stretch.

---

## 5. Components to build (this pass)

- `BottomTabBar` — mobile, 4 destinations, active = yellow icon + label
- `Sidebar` — desktop, logo, nav items, "Log workout" CTA, account chip
- `SegmentedTabs` — animated yellow underline indicator
- `Fab` — mobile floating "Log workout" (yellow, dark icon)
- `AccountDrawer` — slide-out from avatar
- `AppShell` — composes the above, swaps nav by breakpoint, renders children
- Placeholder screens: Home, Workouts, Progress, Profile

---

## 6. Motion

- Active tab underline slides between tabs (`layoutId` shared element).
- Content fades/slides on tab change.
- **Swipe caveat:** native swipe-between-tabs is the one thing harder on web
  than it was in React Native. Ship clickable + animated tabs first. Add a
  touch-swipe library later only if it's missed. Do not block the shell on this.

---

## 7. Accessibility

- Icon-only controls get `aria-label`; decorative icons `aria-hidden`.
- Active nav item: `aria-current="page"`.
- Drawer is focus-trapped and closes on `Esc`.
- Yellow-on-black accents are high-contrast; keep body text white/gray.

---

## 8. Build order & acceptance

1. Theme tokens wired into Tailwind + `globals.css`.
2. `AppShell` with both navs swapping correctly at the `md` breakpoint.
3. Placeholder screens reachable from every destination.
4. Segmented tabs animate; FAB and sidebar CTA both fire the same action.
5. Resize from 375px → 1440px: bottom bar folds into sidebar, right rail
   appears at `lg`, content stays centered and capped.

**Stop after the shell and show it before wiring real content.**

### Out of scope this pass
Real Firestore data, the actual Log-workout flow, social login, PWA/offline.
