# PowrFit — Mobile → Web Migration Plan

**From:** React Native / Expo mobile app
**To:** A sleek, modern, mobile-first gym **web** application
**Date:** 2026-06-12
**Status:** Proposal — no code changed yet.

---

## 1. Executive Summary

PowrFit today is a small Expo (React Native 0.79 / React 19) app built on top of
the `react-native-reusables` starter. In practice **only two screens have real
substance** — the Login form and the Profile dashboard — and the dashboard runs
entirely on mock data. Everything else (Home, Workouts, Details) is a stub, and
the tab layout has a hook-placement bug that breaks the bottom-sheet feature.

Because the surface area of "real" product code is so small, **a clean web
rewrite is dramatically cheaper and produces a far better result than dragging
React Native Web along.** The good news: the parts worth keeping — the Firebase
auth model, the data shapes, the error-mapping logic, and the design tokens —
are framework-agnostic and port almost verbatim.

**Recommended target stack:** **Next.js (App Router) + TypeScript + Tailwind CSS
+ shadcn/ui + Firebase Web SDK.** Rationale and the full roadmap follow.

> **Scope locked (2026-06-12):** This is a **web-only** migration — the native
> iOS/Android apps will be retired, not maintained (resolves Decision 1). The
> `origin/backend` branch was reviewed and contains **nothing salvageable** (see
> §3.4), so Firestore will be built fresh from the `lib/mockData.ts` models
> (resolves Decision 3).

---

## 2. Current State Audit

### 2.1 Stack & dependencies

| Area | Current | Notes for web |
|------|---------|---------------|
| Framework | Expo SDK 53, React Native 0.79.3, React 19 | New Architecture enabled |
| Routing | `expo-router` v5 (file-based) | Concept maps cleanly to Next App Router |
| Styling (A) | NativeWind v4 + Tailwind 3.3.5 | `components/ui/*` use it; **screens mostly don't** |
| Styling (B) | `StyleSheet.create` | Profile + Login screens are built this way |
| Styling (C) | `react-native-paper` (Material) | Login form + spinners only |
| Components | `react-native-reusables` (`ui/`: button, card, progress, text, tooltip, avatar) — a shadcn clone | Built on `@rn-primitives/*` + Radix |
| Auth/Backend | Firebase v12 (`firebase/auth` + `firestore`) | Email/password working |
| Tabs | `@react-navigation/material-top-tabs` | Swipeable mobile-native idiom |
| Gestures/anim | `react-native-gesture-handler` + `react-native-reanimated` | Powers the bottom sheet |
| Storage | `@react-native-async-storage/async-storage` | Auth persistence + progress cache |
| Icons | `lucide-react-native`, `@expo/vector-icons` (Ionicons) | |
| Dead weight | `pocketbase` (migrated away), `expo-auth-session`, `expo-web-browser` (unused) | Drop on migration |

**Notable:** the project already targets web (`app.json` → `web.bundler: "metro"`,
`react-native-web` present) — but via Metro/RN-Web, not a true web toolchain.

### 2.2 Routing & structure

```
app/
  _layout.tsx            Stack: (tabs) | details | Login
                         Wrapped: GestureHandlerRootView > PaperProvider > AuthProvider
  (tabs)/
    _layout.tsx          MaterialTopTabs: index(Home) | profile | workouts
                         Auth guard → <Redirect href="/Login"/>; renders BottomSheet overlay
    index.tsx            Home
    profile.tsx          Profile dashboard
    workouts.tsx         Workouts
  Login.tsx              Email/password auth
  details.tsx            Details

src/auth/AuthProvider.tsx   Firebase auth context (signIn/signUp/signOut + user/loading)
firebase/config.ts          Firebase init (auth persistence branches web vs native)
firebase/firebase.ts        Legacy re-export shim
lib/mockData.ts             Progress/goals/sessions mock "API" + types
lib/constants.ts            NAV_THEME color tokens
components/BottomSheet.tsx   Reanimated/gesture bottom sheet
components/ui/*              shadcn-style primitives (NativeWind)
config.ts                   USE_MOCK_DATA flag
global.css                  shadcn CSS-variable theme (light + dark)
tailwind.config.js          shadcn token mapping
```

### 2.3 Per-screen status

| Screen | State | Detail |
|--------|-------|--------|
| **Login** | ✅ Works | Full email/password form (Paper), validation, friendly Firebase error mapping, redirects to profile. The most production-ready screen. |
| **Profile** | 🟡 Real UI, fake data | The flagship screen: hero card, stat cards w/ deltas, weekly-goal bar, quick actions, upcoming sessions, active goals. ~680 lines of `StyleSheet`. Entirely driven by `lib/mockData.ts` + AsyncStorage cache. Settings icon doubles as sign-out (placeholder). |
| **Home** (`index`) | 🔴 Placeholder | "Welcome to PowrFit" + a "Go to Login" button — redundant, since tabs are already auth-gated. |
| **Workouts** | 🔴 Stub | Renders the text "Workouts". |
| **Details** | 🔴 Stub | Renders the text "Details". |

### 2.4 What's broken or half-finished

1. **Hook-placement bug (real crash risk).** `app/(tabs)/_layout.tsx` calls
   `useRef(...)` and `useCallback(...)` at **module top level** (lines 17–26),
   outside any component. This is an invalid hook call; the bottom-sheet toggle
   never works as intended. The toggle button itself is a tiny near-invisible
   `TouchableOpacity`.
2. **Everything runs on mock data.** `USE_MOCK_DATA = true`; there are **no real
   Firestore reads/writes** for workouts, goals, or sessions yet.
3. **Dead no-op interactions:** "Log activity", "View all", "See calendar",
   Quick Actions — all static.
4. **Three competing styling systems** (NativeWind `ui/`, raw `StyleSheet`
   screens, Paper) — the polished `ui/` primitives aren't actually used by the
   screens.
5. **Fragile Firebase config:** `firebase/config.ts` calls `dotenv.config()` and
   reads `process.env.apiKey` — `dotenv` doesn't run inside the RN/Metro bundle
   the way it does in Node, so the key is only reliably available on web. Only
   `apiKey` is externalized; the rest is hardcoded. `.env` uses `apiKey =…`
   (note the space).
6. **Dead dependencies:** `pocketbase`, `expo-auth-session`, `expo-web-browser`.
7. **Repo hygiene:** a stray `.git 2/` directory sits in the root; git history
   contains a "fix leaked secret" commit (the API key was tracked at some point —
   it should be rotated). There is an `origin/backend` branch not reviewed here.

### 2.5 Code that won't translate (native-only idioms)

These technically run under React Native Web but either add dead weight or fight
the goal of a *sleek web* feel:

- `react-native-paper` (Material) — heavy, opinionated mobile look.
- `@react-navigation/material-top-tabs` — swipeable native tab idiom.
- `react-native-gesture-handler` + `reanimated` bottom sheet — native gesture model.
- `expo-status-bar`, `expo-splash-screen`, `expo-navigation-bar`,
  `lib/android-navigation-bar.ts` — native chrome, no web equivalent.
- `SafeAreaView`, `StyleSheet`, `<Image source={{uri}}>`, `Pressable`,
  `@expo/vector-icons` — all need web equivalents.
- `AsyncStorage` → `localStorage`/`IndexedDB`.
- `getReactNativePersistence` → Firebase browser persistence (config already branches on `Platform.OS === "web"`).

---

## 3. Recommended Target Stack

### 3.1 Recommendation: Next.js (App Router) + Tailwind + shadcn/ui

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 15 (App Router)** | File-based routing mirrors `expo-router` (gentle mental port); SSR/edge for fast first paint on mobile networks; image optimization; trivial deploy (Vercel/Firebase Hosting); room to grow (server actions, API routes) without re-platforming. |
| Language | **TypeScript** | Already in use. |
| Styling | **Tailwind CSS** | Already the project's styling vocabulary. |
| Components | **shadcn/ui** | The existing `components/ui/*` are a *React Native port of shadcn*, and `global.css` already defines **shadcn's exact CSS-variable tokens** (light + dark). Adopting real shadcn/ui means the design language and theme port ~1:1. |
| Auth/Data | **Firebase Web SDK** (`firebase/auth`, `firebase/firestore`) | Same SDK, same project — auth and data logic reused directly. |
| Icons | **lucide-react** | The web sibling of `lucide-react-native`. |
| State | React context (reuse `AuthProvider`) + **TanStack Query** for Firestore reads | Query gives caching/loading/refetch that replaces the hand-rolled AsyncStorage cache. |
| Charts | **Recharts** (or visx) | For the gym progress/goal visualizations. |
| Animation | **Framer Motion** | Sleek web transitions (replaces reanimated). |
| PWA (optional) | `next-pwa` / Serwist | Installable "app-like" experience + offline shell. |

### 3.2 Why Next.js over Vite + React (SPA)

- **Mobile-first performance:** SSR/streaming gives a faster first contentful
  paint on phones than a client-only SPA bundle.
- **Routing parity:** App Router's folder routing is the closest analog to
  `expo-router`, reducing translation friction.
- **One-step deploy & built-in image optimization**, which matters for an
  image-heavy gym UI.

**Pick Vite + React instead only if** you want a pure client SPA, no server, and
the simplest possible toolchain (e.g. you'll wrap it as a PWA and never need
SSR). It's a fine choice — lighter conceptually — but you give up SSR perf and
the routing parity. **Default recommendation stands: Next.js.**

### 3.3 Why NOT React Native Web

| | Clean web rewrite (recommended) | React Native Web (keep RN, ship to web) |
|---|---|---|
| Effort given *this* codebase | **Low** — only Login + Profile are real | Misleadingly "free" but you inherit every native quirk |
| Sleek web feel | **Native to the platform** | Always slightly "app-shaped"; fighting RN-Web defaults |
| Bundle size | Lean | Ships RN-Web + Paper + reanimated + gesture-handler |
| SEO / SSR | First-class (Next) | Poor |
| Hiring/ecosystem | Standard web stack | Niche |
| Keep iOS/Android too? | ❌ Diverges from native | ✅ One codebase for all platforms |

**The deciding factor:** RN Web only pays off when you must keep shipping the
native iOS/Android apps from the same code. If the goal is a *web* product that
feels sleek on mobile browsers, the rewrite wins — and here it's cheap because
there's so little real product code to rewrite.

> **Decision 1 — RESOLVED:** Web-only. The native apps are being retired, so the
> clean web rewrite is confirmed (no RN Web / monorepo needed).

### 3.4 `origin/backend` branch review (reviewed, not merged)

Reviewed via `git show` / `git ls-tree` — never checked out or merged.
**Verdict: salvage nothing.** The branch is an abandoned dead-end.

- **Entire contents:** 2 commits adding one 7-line file, `pocketbase.js`:
  a PocketBase client pointing at `http://127.0.0.1:8090`, plus the `pocketbase`
  dependency in `package.json`. That's all.
- **No** Firestore reads/writes, **no** schema/collections/migrations, **no** API
  routes, **no** server logic, **no** auth code.
- It **predates the Firebase work** entirely (no `firebase/` dir, no
  `AuthProvider`). The project later abandoned this approach — the `frontend`
  branch history literally notes *"switched from pocketbase to firebase."*
- The referenced local PocketBase server (`:8090`) is **not defined anywhere** in
  the repo (no schema, seed, or config).

**Implication:** there is **no backend of record** beyond Firebase Auth on
`frontend`. The `lib/mockData.ts` types remain the only data spec, so the
Firestore schema (Phase 5) is genuinely net-new — confirming Decision 3.

---

## 4. Reuse vs. Rebuild

### ✅ Reuse (port nearly as-is — framework-agnostic logic)

- **Auth model** — `src/auth/AuthProvider.tsx`: the context shape
  (`user/loading/signIn/signUp/signOut`) and `onAuthStateChanged` flow are pure
  Firebase JS; drop the RN imports and it's a web provider.
- **Firebase init** — `firebase/config.ts`: keep the config object; delete the
  native-persistence branch (web uses default browser persistence). Move secrets
  to env (see §6).
- **Data models** — `lib/mockData.ts` types (`ProgressStats`, `ProgressGoal`,
  `UpcomingSession`, `MockUserProgress`) become the canonical Firestore schema.
- **Business logic** — Login's `mapFirebaseError`, email validation, and the
  delta/percent helpers in `profile.tsx` (`formatDelta`, `percentOfGoal`) are
  plain functions.
- **Design tokens** — `global.css` + `tailwind.config.js` shadcn variables port
  straight into the Next app.
- **The mock layer** as a seed/fallback while wiring real Firestore.

### 🔁 Rebuild (re-author in web idioms)

- **All screens' markup** — `View/Text/StyleSheet` → semantic HTML + Tailwind +
  shadcn components. (Profile is the big one but its structure is a clear spec.)
- **Login form** — re-author with shadcn `Input`/`Button`/form; keep the logic.
- **Navigation** — `expo-router` Stack/Tabs → Next App Router layouts + a
  mobile-friendly bottom tab bar / top nav component.
- **Bottom sheet** — replace reanimated sheet with a web sheet (shadcn `Sheet`
  / `Drawer` / Vaul) — better mobile-web ergonomics.
- **Spinners/icons** — Paper `ActivityIndicator` → shadcn spinner;
  `@expo/vector-icons` → `lucide-react`.

### 🗑️ Drop

`expo-*`, `react-native*`, `nativewind`, `react-native-paper`,
`@react-navigation/*`, `@rn-primitives/*`, `react-native-reanimated`,
`react-native-gesture-handler`, `pocketbase`, `@react-native-async-storage/*`.

---

## 5. Phased Migration Roadmap

> Recommended approach: build the web app **fresh in a new directory/branch**
> (e.g. `web/` or a new repo), porting logic file-by-file, rather than mutating
> the Expo app in place. This keeps the native app runnable as a reference until
> the web app reaches parity.

### Phase 0 — Decisions & scaffold (0.5 day)
- Resolve the open decisions in §7.
- `create-next-app` (TS, App Router, Tailwind). Init shadcn/ui.
- Port `global.css` tokens + `tailwind.config` theme. Verify light/dark.
- **Milestone:** blank themed Next app builds and deploys to a preview URL.

### Phase 1 — Firebase + Auth (1 day)
- Add Firebase Web SDK; move config to `.env.local` (`NEXT_PUBLIC_FIREBASE_*`).
  **Rotate the leaked API key.**
- Port `AuthProvider` (strip RN). Add a route-group guard (server check +
  client provider) replacing the `<Redirect>` pattern.
- **Milestone:** sign up / sign in / sign out / session-persist works on web;
  protected routes redirect to `/login`.

### Phase 2 — Login screen (0.5 day)
- Rebuild with shadcn form components; reuse validation + `mapFirebaseError`.
- **Milestone:** Login visually polished and mobile-responsive.

### Phase 3 — App shell & navigation (1 day)
- Root layout with a sleek **mobile bottom tab bar** (Home / Workouts / Profile)
  that becomes a side/top nav at desktop breakpoints.
- Route stubs for each tab; 404/loading states.
- **Milestone:** authenticated users navigate a real app shell.

### Phase 4 — Profile dashboard (2 days)
- Rebuild the flagship screen as responsive shadcn `Card`s: hero, stat cards w/
  deltas, weekly-goal progress, quick actions, upcoming sessions, active goals.
- Keep the mock layer behind a `USE_MOCK_DATA` flag initially.
- Add Recharts for goal/progress visuals; Framer Motion for entrance polish.
- **Milestone:** dashboard at full visual parity (still mock data).

### Phase 5 — Real data in Firestore (2–3 days)
- Define Firestore collections from the §4 models
  (`users/{uid}/progress`, `goals`, `sessions`, `workouts`).
- Replace `fetchMockUserProgress` with TanStack Query + Firestore reads/writes.
- Implement "Log activity" and seed data.
- Write Firestore **security rules** (owner-only access).
- **Milestone:** dashboard reflects per-user live data.

### Phase 6 — Build out Workouts (2–3 days)
- The currently-empty screen becomes a real feature: workout list, detail view
  (replaces `details.tsx`), start/log a session, history.
- **Milestone:** core gym loop (browse → do → log → see progress) works.

### Phase 7 — Polish, PWA, ship (1–2 days)
- Responsive QA across phone/tablet/desktop; touch targets; safe-area insets via
  CSS `env()`; transitions; empty/error/loading states.
- Optional: PWA manifest + service worker (installable, offline shell).
- Lighthouse pass (perf/a11y/PWA); analytics.
- Deploy to production (Vercel or Firebase Hosting).
- **Milestone:** public, installable, mobile-sleek PowrFit web app.

### Phase 8 — Decommission native (0.5 day)
- Archive the Expo app/branch; update README; remove dead deps and `.git 2/`.

**Rough total:** ~12–16 working days for a solo dev to a polished v1.

---

## 6. Security & Hygiene (do early)

- **Rotate the Firebase API key** (history shows it was committed). Firebase web
  keys aren't "secret" per se, but rotate given the leak and gate access with
  **Firestore security rules** + App Check.
- Move all Firebase config to env (`NEXT_PUBLIC_FIREBASE_*`); drop `dotenv`.
- Delete the stray **`.git 2/`** directory.
- Remove dead deps (`pocketbase`, `expo-auth-session`, `expo-web-browser`).

---

## 7. Risks, Gaps & Decisions You Need to Make

### Decisions
1. ~~**Keep native iOS/Android?**~~ ✅ **RESOLVED: web-only.** Native apps
   retired → clean web rewrite confirmed.
2. **Next.js vs Vite SPA?** Recommend Next.js; pick Vite only for a pure
   client-only PWA with no server needs. *(still open)*
3. ~~**Backend of record?**~~ ✅ **RESOLVED: Firebase/Firestore, built fresh.**
   `origin/backend` reviewed — nothing salvageable (§3.4); schema comes from the
   `lib/mockData.ts` models.
4. **Auth methods:** email/password only, or add Google/Apple/social? (The
   unused `expo-auth-session` hints social was planned.) *(still open)*
5. **PWA / installable + offline?** Yes/no affects Phase 7 scope. *(still open)*
6. **Product scope for v1:** is Workouts (Phase 6) in scope for first launch, or
   is a polished dashboard + auth enough? *(still open)*

### Risks & gaps
- **No real backend data yet** — the entire app is mock; Firestore schema,
  writes, and rules are net-new work (Phases 5–6), the biggest unknown.
- **Design is implied, not specified** — there's no design system beyond the
  shadcn tokens; "sleek and modern" needs at least a reference/inspiration set
  to avoid churn.
- **Profile screen is the spec** — its ~680 lines encode the intended
  information architecture; rebuild faithfully to avoid scope creep.
- ~~The `origin/backend` branch was not reviewed~~ — reviewed (§3.4); empty, no
  impact on the plan.
- **Feature parity is low today**, which is actually *de-risking*: there's very
  little to lose, so the rewrite is low-regret.

---

## 8. TL;DR

- **Scope locked: web-only.** Native apps retired; clean rewrite, no RN Web.
- Real product code = Login + (mock) Profile. Everything else is stub or broken.
- **No backend to salvage** — `origin/backend` is an empty PocketBase stub;
  Firestore is built fresh from the mock-data models.
- **Next.js + Tailwind + shadcn/ui + Firebase.** The existing shadcn tokens and
  Firebase auth port almost directly; screens get re-authored in web idioms.
- ~12–16 dev-days to a polished, mobile-first, optionally-installable v1.
- Remaining decisions: Next vs Vite (§7.2), auth methods (§7.4), PWA (§7.5),
  v1 scope (§7.6). First actions: rotate the key, scaffold Phase 0.
