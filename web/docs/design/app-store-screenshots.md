# App Store screenshots: proposal (UI playbook Phase 7)

Six screenshots, all real screens from the app (Apple requires actual app
UI), captured with the demo "regular lifter" account from
`scripts/screenshots.spec.ts`.

**Format, every slide:**
- Near-black background (#0A0A0A), the screen centred without a phone
  frame, corners rounded like the phone.
- A headline above it: 2–4 words, white, one word in brand yellow, in
  Barlow Condensed ExtraBold Italic like the wordmark. One short line under
  it in grey, at most.
- Sizes: 1320 × 2868 (6.9", required) and 1284 × 2778 (6.5"). Capture at
  iPhone 16 Pro Max size (440 × 956 @3x) rather than scaling up the
  iPhone 13 images.
- Order matters: search results show the first three portrait
  screenshots, so they carry the pitch.

| # | Screen | Headline | Line under it | Why this slot |
|---|---|---|---|---|
| 1 | Logger mid-workout: one set ticked with the PR trophy, the rest showing last time's numbers | Log a set in **one tap** | Last session's weights are already filled in. | The core loop and the main reason to switch apps. |
| 2 | Summary right after Finish, with the "New personal record!" card | Every PR, **called out** | Beat a lift and PowrFit tells you. | Emotional payoff; shows the brand yellow at its best. |
| 3 | Home: Up next (Pull day), this week's stats | Knows what's **next** | Push, pull, legs, in order, without thinking. | Shows the app planning for you. |
| 4 | Progress: Month volume and the bench press trend | Watch your lifts **climb** | Volume by week and every lift's best set. | Proof that logging pays off over time. |
| 5 | Gyms: results near a city, cheapest first, with prices | Find **cheap** gyms nearby | Real prices, reported by lifters. | PowrFit's most unusual feature for a workout logger. |
| 6 | Workouts → Explore, or Home → For you videos | 136 exercises, **with form videos** | Search by muscle or equipment. | Covers the library and the video tie-in. |

**Before capturing:**
- Give the demo account a real-sounding name (for example "Alex") so the
  Profile nudge doesn't show, and seed a gym search with prices.
- Set the status bar to 9:41 with full battery (Simulator:
  `xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100`).
- Use the Simulator build, not the browser, so it shows iOS fonts and the
  safe areas exactly.

**Optional seventh slide:** "Built for big text": the logger at the
largest text size, if accessibility is something to lead with.
