# UI/UX playbook run log

Approved Nov 3, 2026: "you can implement every phase of the ui ux playbook".
Phases are committed locally as `ui(phase-N): …`. Push and deploy happen
only when asked.

| Phase | Commit | Notes |
|---|---|---|
| 0 Recon | 55e1571 | audit.md, screenshot loop, design rules, design-critic agent |
| 1 Tokens | c51e51c | pushed and deployed Nov 3 |
| 2 Components | c130edb | components/ui/*, /dev/components |
| 3 App shell | (this commit) | wordmark, large-title header, no "+", tab re-tap, new icon |

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
