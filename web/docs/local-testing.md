# Local testing with the Firebase emulators

Everything here runs on your machine against the `demo-powrfit` project, which
can't reach a real Firebase project. Nothing touches production data.

```bash
cd web
npm run emulators        # terminal 1: Auth (9099) + Firestore (8080)
npm run dev:emulators    # terminal 2: the app at http://localhost:3000
npm run test:rules       # Firestore rules tests (starts its own emulator)
```

`dev:emulators` sets `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` and the
`demo-powrfit` project id, so sign-up creates accounts in the Auth emulator
only. Emulator data is wiped when the emulators stop.

## Test account (emulator only)

Create it with **Sign up** on the login page; it exists only while the
emulators run.

- Email: `tester1@powrfit.test`
- Password: `emulator-only-7Kq2`

## Manual Phase 2 checklist

1. Sign in. You land on Home with "Start your first workout".
2. Start Pull day, enter weight and reps for three sets, tick them.
3. Reload the page: the workout, values and ticks are still there.
4. Finish. The summary shows the totals; the badge reaches "Synced".
5. Open Workouts > History and Home: the same volume and sets appear.
6. Offline: in DevTools > Network choose Offline, finish a workout, reload,
   go back online. History shows one copy, "Waiting to sync" then "Synced".
