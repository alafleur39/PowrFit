# PowrFit — UI/UX Overhaul Playbook for Claude Code

> Save this file in your repo as `docs/uiux-playbook.md`.
> Put your current screenshots in `docs/screenshots/before/` (home, workouts, progress, gyms, profile).

## How to run it

1. Start Claude Code (in plan mode if possible) and send:
   `Read docs/uiux-playbook.md and run Phase 0 only. Stop at the gate.`
2. Read its report, answer its questions, and commit.
3. Run `/clear`, then send `Read docs/uiux-playbook.md and run Phase 1.` Do the same for each phase after that.
4. Don't let it run two phases in one session. Small steps that it checks as it goes work better than one big rewrite.

**One-hour auto-mode run (unattended):**
1. In Claude Code, press Shift+Tab until the status line says auto mode is on. A markdown file can't turn auto mode on; only you can.
2. Send: `Read docs/uiux-playbook.md. Auto mode is on. Follow <auto_mode> for 60 minutes starting now, beginning at Phase 0.`
3. When it's done, read `docs/design/run-log.md` and the gate reports, check the screenshots, and answer any pending decisions.

Your kickoff message is the permission, not this file. That way the grant covers that one session and can't carry over into a later one by accident.

**Why it's set up this way (agentic engineering basics):**
- **Rules that always apply go in CLAUDE.md; the steps go here.** Claude Code loads CLAUDE.md at the start of every session. It only reads this playbook when you point it here.
- **Claude has to see what it builds.** Without screenshots, UI work is guesswork. Phase 0 sets up a way to capture screenshots, and every later phase shows before/after images as proof.
- **Foundations first, then screens.** The order is tokens → components → app shell → screens. If you start with screens, you end up fixing the same problem on six of them.
- **Gates.** Every phase ends with a stop so you can review. You decide what the product should be, and Claude does the engineering.
- **A separate reviewer.** A design-critic subagent that has never seen the code reviews the screenshots, so Claude isn't grading its own work.

---

# PROMPT: Claude, start reading here

<role>
You are a senior iOS product designer and front-end engineer working in this repository. PowrFit is a strength-training app that already works. Your job is to get it ready for the App Store and pleasant to use, without breaking anything that works today.
</role>

<product_context>
- PowrFit has three parts: a workout logger, a progress tracker, and a finder for cheap gyms. It's designed for iPhone first.
- Tabs:
  - Home
  - Workouts (Routines / History / Explore)
  - Progress (Week / Month / Year, plus an exercise trend chart)
  - Gyms (search near me or by city/zip; cheapest monthly price first)
  - Profile (stats, weight unit, feedback, privacy, delete account)
- Core loop: open the app → start a routine → log sets quickly between lifts → see progress.
- The **active-workout logger** is the most important screen, even though there's no screenshot of it. It has to work with one hand, between sets, with sweaty hands, in a dim gym.
- Keep the brand: near-black background, electric-yellow accent, lightning-bolt mark, "POWRFIT" wordmark. Refine it; don't replace it.
- Audience: people who lift, from beginners (the app suggests form videos) to regulars who track PRs.
</product_context>

<known_issues>
These come from screenshots of the current build in `docs/screenshots/before/`. Treat them as things to confirm in the code, not as a complete list.

Layout and navigation
1. **The floating "+" button covers content on every tab.** It sits over the Leg day "Start" button, the Privacy row, the progress chart, and the second video card. It has no label, it does the same thing as "Empty workout", and it shows up on Gyms and Profile, where it's unclear what it does.
2. **Bottom spacing.** Check that the last item on each screen can scroll fully above the tab bar and the "+" button.
3. **The header takes about 12% of every screen.**
   - The "C" avatar duplicates the Profile tab.
   - The logo isn't optically centered.
   - Each screen then repeats its tab name as a large title below the header.

Visual system
4. **Too much yellow.** Five or six elements per screen use it (avatar, logo, primary button, stat numbers, "+" button, active tab), so no single action stands out.
5. **Numbers use a monospace code-style font** with slashed zeros, which clashes with the rest of the UI. Use the system font with tabular (fixed-width) digits instead.
6. **Buttons are inconsistent** in style and width: "Start Push day" vs "Empty workout", the "Start" pills, and the outlined "New routine" pill.
7. **The same underline tabs do two jobs.** Workouts uses them to switch sections; Progress uses them to filter by time. On iOS, a filter is usually a segmented control.
8. **Gray secondary text on near-black needs a contrast check** against WCAG AA (4.5:1 for body text).

States and data trust
9. **Home and Profile appear to disagree.** Home "This week" shows 0 workouts / 0 sets / 0 lb. Profile shows a 1-week streak, 3 workouts, 18,530 lb and 0 PRs.
   - This may be correct: the screenshots were taken on a Monday, so a new week had just started.
   - Even so, nothing on screen explains it.
   - Confirm the week-start day and time-zone handling.
   - Check why 3 workouts produced 0 PRs.
   - **Report what you find. Don't change data logic without my approval.**
10. **Empty states look like failures.**
    - Home shows three yellow zeros.
    - Gyms is about 60% blank before a search.
    - The exercise trend shows one dot and an unlabeled "104.5" with no unit.
11. **"Up next: Push day" doesn't say why** that routine is next.

Content and controls
12. **The copy-icon button on presets has no visible label.** What it does is unclear (save to my routines?).
13. **"For you" shows raw YouTube thumbnails** with loud overlay text that clashes with the brand. Show each video in a consistent card (title, channel, length), and use only the official YouTube player or embed.
14. **"Delete account" looks like a section header.** Account deletion has to stay easy to find (App Store requirement). Make it a red destructive row with a confirmation step.
15. **The display name falls back to the email prefix** (the part of the email before the @). Onboarding or Edit profile should ask for a name.

Brand
16. **The "POWRFIT" wordmark looks generic and AI-generated.**
    - "POWR" fades from white into yellow "FIT" with a gradient. The blend is muddy in the middle of the word.
    - The bolt tile and the avatar have a soft outer glow.
    - The bolt appears to be a stock icon (it looks like Lucide's "zap") in a rounded yellow square. That's a very common default logo.
    - The typeface is a heavy geometric sans in all caps with default letter spacing, so the gap between W and R looks uneven.
    - The casing is inconsistent: the logo says "POWRFIT" and the app text says "PowrFit".
17. **Other template-like details** to remove across the app:
    - glow and blur effects
    - gradient text
    - a stock icon used as the brand mark
    - a generic subtitle under every title ("Your training at a glance.")
    - every element the same pill shape
</known_issues>

<operating_rules>
- Run one phase per session, then stop at its gate. Never start the next phase on your own. **Exception:** during an auto-mode window, follow <auto_mode> instead.
- Before editing, show a plan and wait for my approval (except during an auto-mode window).
- Change UI only. Don't change data models, API calls, storage or calculations unless a phase says to and I approve it. If a UI problem turns out to be a logic bug, log it in `docs/design/audit.md` under "Logic issues" and move on.
- Ask before adding any dependency. Use what the stack already has (for example `expo-haptics`, or reanimated if it's installed).
- From Phase 1 on, screens contain no hardcoded colors, font sizes, spacing or radii. Everything comes from tokens.
- Don't say a visual change works until you've looked at a screenshot of it. If you can't get screenshots, say so and ask me for them.
- Keep the app shippable after every phase. Run typecheck, lint and the existing tests before each gate.
- After I approve a phase, commit with the message `ui(phase-N): <summary>`.
- My local machine is short on disk space. Follow <disk_space> in every phase.
</operating_rules>

<auto_mode>
I've given you permission to work on your own for **one hour**. This applies only when my message in this session says auto mode is on and gives a time limit. Without that message, the normal gate rules apply.

Start
- Run `date` and record the start time at the top of `docs/design/run-log.md`.
- If this is a git repo, create a branch called `ui-overhaul` and work there. Commit locally after each phase. Never push.

While the window is open
- Work through the phases in order, starting from the one I named.
- Each gate becomes a checkpoint instead of a stop:
  - write the gate report to `docs/design/gates/phase-N.md`, with screenshot paths
  - commit
  - add one line to the run log
  - continue to the next phase
- **Decisions that need my taste** (the wordmark, the header option, removing the "+" button):
  - build the options and the comparison images
  - pick your recommendation as a temporary default that's easy to undo
  - log it under "Pending Scanio's decision" in the run log
  - keep going
- Run the design-critic subagent at each checkpoint, and fix the issues it marks Blocking before you move on.
- Keep big outputs (screenshot reviews, long logs) in subagents or files so your context stays small.
- Run `date` after each step. At **55 minutes**:
  - don't start anything new
  - finish or revert the step you're on
  - commit, and write the final summary
- Stop at 60 minutes.

Stop early, and log why, if any of these happen
- Free disk space drops under 10 GB, or the work needs a large download (see <disk_space>).
- A fix needs a change to data logic, storage, API calls or calculations.
- The work needs a new dependency.
- An action would delete something outside the repo, push to a remote, touch signing, certificates or App Store Connect, or publish anything.
- The build or tests still fail after two honest attempts to fix them.
- Auto mode keeps blocking an action. Don't try to work around a block.

Final summary in the run log
- What's done, by phase, with commits and screenshot folders.
- Pending decisions, with your recommendation for each.
- Logic issues you found but didn't touch.
- Disk space at the start and at the end.
- The exact message I should send to pick up where you left off.
</auto_mode>

<disk_space>
My local drive is tight, so treat disk space like a budget.

Check before you spend
- Run `df -h .` at the start of every session and before any build, install or download.
- If free space is under **20 GB**, tell me before you build, install or download anything.
- If free space is under **10 GB**, stop and ask me what to do.
- At every gate, report how much space is free and roughly how much this phase used (`du -sh` on the folders you added to).

Ask before any large download
- New npm/pip packages (this is already a rule).
- Playwright browsers: install Chromium only (`npx playwright install chromium`), never every browser.
- iOS Simulator runtimes, Xcode components, or new simulator devices. Use one simulator device that already exists.
- CocoaPods updates, `expo prebuild --clean`, and local EAS builds (`eas build --local`).

Keep screenshots small
- Save JPEG instead of PNG: use `xcrun simctl io booted screenshot --type=jpeg <path>.jpg`, or Playwright `type: 'jpeg', quality: 80`.
- Keep only `before/`, the current phase, and `final/`. After I approve a gate, ask whether to delete the previous phase's screenshot folder.
- Add `docs/screenshots/*` to `.gitignore`, but keep `before/` and `final/` tracked.
- No screen recordings or videos unless I ask for them.

Builds and caches
- Do incremental builds. Don't do a clean build unless an incremental one fails.
- Don't create git worktrees or second copies of the repo, because each one needs its own `node_modules` and build output.
- Shut down the simulator when you're done (`xcrun simctl shutdown all`).

Never delete anything outside this repo
- In Phase 0, measure the usual space hogs and report their sizes: `~/Library/Developer/Xcode/DerivedData`, `~/Library/Developer/CoreSimulator`, `~/Library/Caches/ms-playwright`, the npm cache, and `node_modules`.
- Suggest cleanup commands (for example `xcrun simctl delete unavailable`, or clearing DerivedData). Don't run them. I'll decide.
- Inside the repo, delete only files you created during this playbook.
</disk_space>

<verification_loop>
Set this up in Phase 0 and use it in every phase after that.

1. **Detect the stack** (Expo/React Native, SwiftUI, Capacitor, Flutter, or web). Also detect where you're running: a Mac with Xcode, or a cloud/Linux session.
2. **Choose how to see the app:**
   - **Mac with Xcode:**
     - Run the app in the iOS Simulator on an iPhone with Dynamic Island.
     - Take screenshots as JPEG with `xcrun simctl io booted screenshot --type=jpeg <path>.jpg` (see <disk_space>).
     - Test text sizes with `xcrun simctl ui booted content_size <size>`.
     - Test appearance with `xcrun simctl ui booted appearance dark|light`.
   - **No Mac, but the app renders on the web** (Expo web, Capacitor or a web app):
     - Run the web build and take screenshots with Playwright at a 390×844 viewport, deviceScaleFactor 3. That's the size of the before-screenshots.
     - Use these screenshots for layout only. Fonts, safe areas and haptics still need me to check on a real iPhone.
   - **Neither works:** write `scripts/screens.md` listing exactly which screens and states I should screenshot, and ask me for them.
3. **Write one capture script** (`scripts/screenshots.*`) that takes every main screen in a single run. Save the images as JPEG to `docs/screenshots/<phase>/<screen>-<state>.jpg`.
4. **At every gate, show before → after pairs** for each screen you changed.
</verification_loop>

<phases>

## Phase 0: Recon and setup (no visual changes)
0. Check disk space first, following <disk_space>. Report free space and the sizes of the usual space hogs before you install or build anything.
1. Detect the stack and environment. Get the screenshot loop working and capture the current app into `docs/screenshots/phase0/`.
2. List every screen, shared component and place styles are defined. Count the hardcoded colors, font sizes and spacing values, and list the files they're in.
3. For each item in <known_issues>, confirm or reject it and give the file and line responsible. Add any new issues you find.
4. Investigate issue 9 (the Home/Profile mismatch and the 0 PRs) and report the cause.
5. Write the results to `docs/design/audit.md`.
6. Create `docs/design/DESIGN_RULES.md` from the template in <templates>. Add the line `@docs/design/DESIGN_RULES.md` to CLAUDE.md. Create CLAUDE.md if it doesn't exist, and keep whatever is already in it. Also add this rule to CLAUDE.md so it applies outside this playbook too: "Disk space on this machine is limited. Check `df -h .` before builds, installs or downloads, ask before any large download, and never delete anything outside the repo."
7. Create `.claude/agents/design-critic.md` from the template in <templates>.
8. Suggest a hook that runs lint and typecheck after edits. Don't install it.

**Gate:** Show the audit summary, the screenshot paths, the issue 9 finding, the disk-space report with suggested cleanups, and your open questions. Stop.

## Phase 1: Design tokens
Create a single source of truth for styles, for example `src/theme/`:
- **Color, named by role, not by hue:** background, surface, surfaceRaised, border, textPrimary, textSecondary, textTertiary, accent, onAccent, accentMuted, success, warning, danger. Check every text/background pair against WCAG AA and record the ratios in a comment.
- **Type:**
  - A 6–8 step scale on the system font (SF Pro) that scales with Dynamic Type.
  - Numbers use tabular digits.
  - Remove the monospace font.
- **Spacing:** a 4-pt scale (4, 8, 12, 16, 20, 24, 32, 40, 48).
- **Radii:** 3–4 values.
- **Elevation:** surfaces on black separate by tone and border, not by shadow.
- **Motion:** 2–3 durations and easing curves, plus what happens when Reduce Motion is on.
- **Accent rule:** each screen gets one filled-yellow element, its primary action. Anywhere else, yellow only highlights data, never decoration.

Then move every screen onto the tokens without changing layout. Screens should look almost the same, just consistent.

**Gate:** Show the token files, the contrast table and before/after screenshots. Stop.

## Phase 2: Component library
Build or refactor each component below. Each one needs:
- every state (default, pressed, disabled, loading, and error where it applies)
- accessibility labels
- touch targets of at least 44×44 pt

Components:
- Button: primary, secondary, ghost and destructive; full-width and inline
- IconButton (a label is required)
- Card
- StatTile
- SegmentedControl
- Tabs
- ListRow: chevron, toggle and destructive variants
- EmptyState: icon, title, one line of text, one action
- Skeleton
- Toast
- Sheet
- ScreenHeader
- ChartContainer: handles 0, 1 and many data points

Add a hidden, dev-only "Components" screen that shows every component in every state, and screenshot it.

**Gate:** Show the Components screen screenshots and the list of one-off styles you replaced. Stop.

## Phase 3: App shell
- **Wordmark (do this first, because the header depends on it):**
  - Find out how the current logo is built: which font, live text or image, and where the gradient and glow come from.
  - Make 4 wordmark options as SVGs. Each uses flat color only: no gradients, glows or shadows. Directions:
    1. Condensed athletic, like gym signage (start from Big Shoulders Display or Barlow Condensed).
    2. Wide or extended, to feel powerful and stable (start from Archivo at an expanded width).
    3. Slanted or italic, to suggest speed.
    4. Your best direction: a custom detail in one letter that makes it ownable, for example a cut in the P or W that suggests the bolt.
  - Use only fonts licensed for embedding in apps (Google Fonts / OFL is fine). Kern the letter pairs by hand, especially W–R.
  - Render all 4 in a single comparison image at header size and at app-icon size, on the dark background. Then stop and let me pick.
  - Ship the chosen wordmark as an outlined SVG asset, not live text. That way it looks the same everywhere and doesn't need a font to load at launch.
  - Use one casing everywhere: "PowrFit" in text, and whatever casing the wordmark uses in the logo.
  - Redraw the bolt mark to match the wordmark, or drop it from the header and keep it only for the app icon. Don't use a stock icon as the logo.
- **Header:** mock up both options as screenshots and justify one before building it:
  - (a) an iOS large title that collapses on scroll, with the wordmark only on Home, or
  - (b) a compact brand header without the duplicate avatar.
- **"+" button:** remove it, or keep it only where starting a workout is the main job, and give it real clearance. I lean toward removing it and making "Start workout" a clear primary button on Home and Workouts. Tell me if you disagree, and why.
- **Safe areas and bottom insets:** nothing ends up hidden under the tab bar.
- **Tab bar:**
  - active/inactive colors come from tokens
  - a haptic on tab change
  - tapping the active tab again scrolls to the top

**Gate:** Show all five tabs, scrolled to the top and to the bottom. Stop.

## Phase 4: Screens (one screen per session)
Work in this order: **Active workout logger → Home → Workouts → Progress → Profile → Gyms → Onboarding/auth.**

For each screen:
1. Write the screen's job in one sentence (for example, "Home: get me into today's workout in one tap and show that I'm on track").
2. Fix its items from <known_issues>.
3. Design and screenshot every state: loading, empty, first use, populated, long names and large numbers, error/offline, and the largest Dynamic Type size.
4. Run the design-critic subagent on the screenshots, fix the issues it marks Blocking, and show me its report.

Notes for specific screens:
- **Logger:**
  - Large set rows.
  - Weight and reps steppers, plus a number pad.
  - Last session's values shown inline.
  - One tap to complete a set.
  - A rest timer that starts on its own and keeps running if the app goes to the background.
  - A haptic when a set is completed.
  - A finish-workout summary that celebrates PRs.
- **Home:**
  - Replace the three zeros with a useful start-of-week state, such as "Start your first workout this week" plus the streak.
  - Explain why the next routine is next.
- **Progress:**
  - Use a segmented control for Week/Month/Year.
  - The chart needs units, a single-point state ("Log one more session to see a trend") and tap-to-inspect values.
- **Gyms:**
  - Fill the empty state: how prices are sorted, recent searches, or a map preview.
  - Explain why you need location before iOS shows its permission dialog.
- **Profile:**
  - Ask for a display name.
  - Make "Delete account" a destructive row with a confirmation step.
  - Group the settings into sections.

**Gate after each screen:** Show before/after for every state, plus the critic's report. Stop.

## Phase 5: Feel
- **Haptics:**
  - light for selection
  - success when a set is completed or a PR is hit
  - warning for destructive actions
- **Feedback and loading:**
  - every tappable element visibly reacts when pressed
  - skeletons instead of spinners while content loads
- **Transitions:** consistent screen transitions.
- **Inputs:** the keyboard never covers an input field.
- **Refresh:** pull-to-refresh wherever data comes from a server.
- Respect Reduce Motion throughout.

**Gate:** List every interaction you added and where it's used. Stop.

## Phase 6: Accessibility
- **VoiceOver:**
  - every control has a label and hint
  - focus order is logical
  - each chart has a text summary
- **Dynamic Type:** text scales up to the largest accessibility sizes without clipping.
- **Color:** it's never the only signal (for PRs, errors and so on).
- **Increase Contrast:** the app still looks right with it on.
- Fix every issue you find.

**Gate:** Show a pass/fail checklist for each screen and screenshots at the largest text size. Stop.

## Phase 7: Independent review and App Store polish
1. Run design-critic on every final screenshot and fix the issues it marks Blocking.
2. Check:
   - no placeholder or developer text
   - no dev screens in release builds
   - every permission prompt (location) explains why it's needed
   - account deletion is easy to find
   - the Privacy screen matches what the app actually collects
   - the app icon and launch screen match the new design
   - the app looks right with the iPhone in both light and dark mode, or being dark-only is a deliberate choice
3. Propose 5–6 App Store screenshot layouts built from the real screens.

**Gate:** Final report covering what changed, what's left and known risks. Stop.

</phases>

<templates>

### docs/design/DESIGN_RULES.md
```md
# PowrFit design rules (always on)
- Use tokens only: no raw hex values, font sizes, spacing or radii in screens. Import them from src/theme.
- Each screen has one filled-yellow element: its primary action. Anywhere else, yellow only highlights data.
- Numbers use the system font with tabular digits. No monospace fonts.
- Touch targets are at least 44×44 pt. Every icon-only control has an accessibility label.
- Every screen handles loading, empty, error and populated states. Charts handle 0, 1 and many points.
- Nothing scrolls under the tab bar without a bottom inset.
- Always show units (lb/kg), using the unit the user chose.
- Respect Dynamic Type, Reduce Motion and Increase Contrast.
- Destructive actions use the danger color and ask for confirmation.
- Copy is short, plain and encouraging, in sentence case, with no jargon on first-use screens.
- No gradient text, glows, blur shadows or neon effects. Use flat color, and separate surfaces with tone and borders.
- The logo is the custom wordmark SVG. Never use a stock icon as the brand mark.
- Only add a subtitle under a title when it tells the user something they need.
- Vary shapes on purpose: pills for actions, rounded rectangles for cards, square-ish shapes for inputs.
- Before calling UI work done, take screenshots and look at them.
```

### .claude/agents/design-critic.md
```md
---
name: design-critic
description: Independent iOS UI/UX reviewer. Use after a screen changes and pass it the screenshot paths. It reviews images against the design rules and never edits code.
tools: Read, Glob, Grep
---
You are a senior iOS product designer reviewing PowrFit, a strength-training app. You haven't seen the code or the conversation that produced these screens. Judge only what a user would see.

Read docs/design/DESIGN_RULES.md, then every screenshot you're given.

Check each screen for:
- a clear primary action
- visual hierarchy
- alignment and spacing rhythm
- contrast and legibility
- touch target size
- loading, empty and error handling
- truncated or clipped text
- consistency with the other screens
- Apple Human Interface Guidelines conventions
- whether a first-time user would know what to do
- anything that looks like a generic AI or template app: gradient text, glows, stock icons used as branding, filler subtitles, every element the same pill shape, a font that doesn't fit the product

Report:
- Blocking: would embarrass the app in App Review or confuse users. Give the screen, the problem and the fix.
- Should fix: polish problems people will notice.
- Nits.

Be specific ("the 'Start' button is 36 pt tall; it needs 44 pt"), not general. No praise and no new feature ideas.
```

</templates>
