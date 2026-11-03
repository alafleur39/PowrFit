# UI/UX playbook run log

Approved Nov 3, 2026: "you can implement every phase of the ui ux playbook".
Phases are committed locally as `ui(phase-N): …`. Push and deploy happen
only when asked.

| Phase | Commit | Notes |
|---|---|---|
| 0 Recon | 55e1571 | audit.md, screenshot loop, design rules, design-critic agent |
| 1 Tokens | c51e51c | pushed and deployed Nov 3 |
| 2 Components | c130edb | components/ui/*, /dev/components |
| 3 App shell | a5af8a5 | wordmark, large-title header, no "+", tab re-tap, new icon |
| 4 Screens (logger, Home) | 22252d2 | critic blocking issues fixed |
| 4 Screens (Workouts, Progress, Profile, Gyms, sign-in) | (this commit) | critic run; see below |

## Pending decisions (temporary defaults, easy to undo)

1. **Wordmark.** Default: option 4, Barlow Condensed ExtraBold Italic in
   white with a custom yellow bolt between POWR and FIT. The comparison
   image is `docs/design/wordmark/compare.jpg`, and the options are SVGs
   in that folder. To switch, re-run `make.py` with another option and
   regenerate `src/components/wordmark-paths.ts`.
   **Why 4:** it's the only ownable one. It cuts yellow down to one
   accent, and its bolt becomes the app icon.
2. **Header.** Default: option (a), iOS large titles. There's no top bar
   on phones. Each screen's title scrolls away, and a slim bar with the
   small title fades in. Home shows the wordmark instead of "Home".
   **Why not (b), a compact brand header:** it keeps a bar on every screen
   only to show the logo, plus a second title below it. That's the height
   problem from the audit.
3. **"+" button.** Default: removed. "Start workout" is the primary button
   on Workouts (top right), and Home keeps "Start <routine>". The active
   workout strip still brings you back to a workout in progress.
4. **App icon.** The new slanted bolt, yellow on near-black. The web
   icons, apple-icon, favicon and the iOS AppIcon were all regenerated.
5. **Haptics.** These need `@capacitor/haptics`, a new package that hasn't
   been approved yet. Until then: no haptic on tab change (Phase 3) or on
   set complete, PRs or destructive actions (Phase 5).

## Logic issues (not touched)

See `audit.md` → "Logic issues" (L1–L3).

## Phase 4 critic follow-ups (second review)

The second review saw a mix of old and new screenshots: the capture script
still clicked the old Progress "Month" tab and stopped partway, so some
images were from before the changes. Its one real blocking issue was fixed:
the exercise trend now says "all time", so it no longer looks like it
follows Week/Month/Year. Also fixed: shorter "Up next" reason,
sentence-case eyebrows, the Gyms subtitle, and some wording.

Still open (should-fix and nits):
- Workouts sections use underline tabs. The critic wants a segmented
  control. They swipe, so I kept them.
- Progress Month chart shows future weeks.
- Profile's yellow avatar default.
- "Saved" badge on every History card.
- Explore list inset and chips have no "All" or selected state.
- Login card width and no show/hide toggle on the password field.

Stopped Nov 3 around 3:40 AM because the Mac was heavily loaded (load
average 8, a screenshot run took 19 minutes instead of 35 seconds). The
last copy tweaks passed typecheck, lint and unit tests, but the browser
tests weren't rerun for them. Next session: a fresh `SHOTS_PHASE=phase4`
capture, a quick critic pass, then Phases 5–7.
