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
| 4 Screens (Workouts, Progress, Profile, Gyms, sign-in) | 1521857 | critic run; see below |
| 5 Feel | 59b5ff8 | pushed and deployed Nov 4 with Phases 2–4; haptics wired (silent until the package is approved), skeletons, keyboard |
| 6 Accessibility | (this commit) | Dynamic Type, Increase Contrast, color-free cues, VoiceOver hints |

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

## Phase 5: Feel (Nov 4)

Interactions added, and where:

| Interaction | Where |
|---|---|
| Light haptic (selection) | bottom tab bar (switching tabs), Tabs (Workouts sections), SegmentedControl (Progress range, unit), ListRow toggles |
| Success haptic | ticking a set done (set-row); new PRs on the summary right after Finish (RecordsCard, `celebrate`) |
| Warning haptic | every destructive Button, IconButton and ListRow (discard workout, delete routine/workout, delete account, failed-save discard) |
| Skeletons instead of spinners | logger restore, workout summary, History, Progress, routine editor; the sign-in gate is now a plain dark screen like the launch screen |
| Keyboard never covers inputs | set stepper bar and every Sheet ride on top of the iPhone keyboard (`use-keyboard-inset.ts`, visual viewport); the focused set field scrolls clear of the bar |
| Reduce Motion | the inline button spinners now stop spinning too |

Already in place before this phase: press-in feedback on every button and
link (globals.css), screen crossfade via view transitions, and Reduce
Motion turning both off.

Haptics: `src/lib/haptics.ts` calls the native Haptics plugin through
`registerPlugin`, guarded by `Capacitor.isPluginAvailable`. Nothing happens
on the website or until `@capacitor/haptics` is installed and synced, at
which point they start working with no code change. Still needs the
owner's OK (pending decision 5).

Pull-to-refresh: not added. Every user-data screen is a live Firestore
listener, so it would only re-show the same data, and Gyms re-fetches with
its Search button. A pull gesture in WKWebView would be custom code with
no payoff.

Checks: typecheck, lint, 370 unit tests; logger, profile and progress
browser tests on iPhone. Screenshots not retaken (machine load ~50 at
the start of the session from macOS background work).

## Phase 6: Accessibility (Nov 4)

What changed:
- **Dynamic Type.** Web text ignores the iPhone text size unless asked.
  `src/lib/dynamic-type.ts` runs inline before the first paint, reads
  `-apple-system-body`, and sets `--type-scale` (1 by default, up to 3.1
  at the largest accessibility size); it re-reads when the app comes back
  to the front. Every type token multiplies by it; titles grow at most
  1.75× (`--title-scale`), as in iOS. Only text grows, not spacing.
  - Controls that held text at a fixed height now use a minimum height
    (`h-11` → `min-h-11` and so on); buttons wrap instead of running off
    the side.
  - Dense parts grow only to 1.75× (`type-cap`): set tables, the rest
    timer, the logger's sticky bar, the stepper bar, segmented controls,
    tab strips. The bottom tab bar and the slim title bar stay one size,
    like iOS bars. Chart axis labels stay one size because they sit at
    fixed SVG positions; the chart's summary and readout scale.
  - Headers and heading rows wrap (Workouts "Start workout", "New
    routine", the Profile header, the Explore equipment filter).
- **Increase Contrast.** `prefers-contrast: more` brightens secondary
  text (11.9:1) and tertiary text (9.3:1), and makes borders 3:1 against
  the background, with a lighter raised surface.
- **Color is never the only signal.** An invalid number in a set field
  now shows a warning icon as well as the red border. Everything else
  already pairs color with an icon and words (Saved / Sync failed, PR
  trophy, ✓ on done sets, red text on destructive rows).
- **VoiceOver.** The set ✓ button now says what it will do ("Fills in
  185 lb × 5 reps" or "Enter weight and reps first") through
  aria-describedby; that was in a `title`, which VoiceOver doesn't
  reliably read. ListRow descriptions are hints (Phase 4). Charts have
  text summaries (P4-06).
- **Screenshots** now take `SHOTS_TYPE_SCALE`, `SHOTS_CONTRAST=more` and
  `SHOTS_AXE=1` (axe-core, already installed with the lint tools).

Checklist, iPhone 13 size. Labels = axe (WCAG 2.1 A/AA) plus the e2e
labelled-controls check; Text = largest accessibility size (3.1×);
Color = not the only signal; Contrast = Increase Contrast on.

| Screen | Labels | Text | Color | Contrast |
|---|---|---|---|---|
| Sign in | pass | pass | pass | pass |
| Privacy | pass | pass | pass | pass |
| Home (empty, new week, populated) | pass | pass | pass | pass |
| Workouts: Routines | pass | pass (fixed: Start workout covered the title, New routine ran off) | pass | pass |
| Workouts: History | pass | pass | pass | pass |
| Workouts: Explore | pass | pass (fixed: equipment filter ran off); the search placeholder is cut, as any long placeholder is | pass | pass |
| Logger | pass | pass (fixed: rest timer overlap, weights cut off) | pass (fixed: invalid field) | pass |
| Finish sheet, summary | pass | pass | pass | pass |
| Progress | pass | pass (fixed: Week/Month/Year ran together, axis labels overlapped) | pass | pass |
| Profile | pass | pass (fixed: name and email cut off; the email now breaks mid-word at 3.1×) | pass | pass |
| Gyms | pass | pass | pass | pass |

axe found one issue, on the dev-only Components page (a scrollable tab
strip with nothing focusable in it); it's not in release builds.

Not done here: a pass with real VoiceOver on a phone (focus order was
checked in code and by the keyboard-only logger test on desktop), and
checking that `-apple-system-body` gives the expected sizes inside the
Capacitor app. Both are for the first TestFlight build.

Images (not in git): `docs/screenshots/phase6/` (default size, with
axe.json), `phase6-ax5/` (largest text), `phase6-contrast/`.

Checks: typecheck, lint, 376 unit tests, full browser suite (85 passed,
9 skipped as usual).
