# Outpost working prototype

A mobile web prototype for T-Hub founders, implementing the approved sign-in, Home setup, mentor booking, challenge and grant application, Saved, and Profile flows through M4. All progress is local to the browser; no backend, real sign-in, meeting or application submission is connected.

The source of truth is [All flows · 24 Sep 2026 in Paper](https://app.paper.design/file/01M2MD5ZMXSHB5WPVM8S3PG5D9/p-4-1). Read `BRIEF.md` for scope and `PROGRESS.md` for results and assumptions. Claude records findings in `REVIEW.md`.

## Run on a phone

Use Node.js 22.20 or later:

```sh
cd '/Users/pepper/Documents/Claude/T-Hub/Working Prototype'
npm install
npm run dev -- --host
```

Open [the phone preview](http://192.168.1.35:5173/outpost-prototype/) on the same Wi-Fi, or [localhost](http://localhost:5173/outpost-prototype/) on this computer. Keep the terminal running. The network address is printed by Vite and may change on another network. Open that network URL on the desktop to get a QR that a phone can reach: the QR encodes the current page address at runtime.

## Walkthrough

1. A fresh visit opens Splash. Continue with any email and any six-digit code. Complete or defer the five questions inside Home.
2. Discover Mentors, save people, open Mohit Arora, choose a date and time, and confirm the prefilled request. It confirms after about eight seconds or when Sessions opens. Join on the session detail opens a Cal Video stand-in in a new tab. Leave or return to Outpost to answer attendance; pending/future list cards show status until fifteen minutes before the start.
3. Open Honda from Challenges and tap Apply. The official page opens in another tab. Return to Outpost and answer “Did you apply?”. Confirming Yes opens Application saved, with View application and Done → Home; the item also appears under Applied.
4. Repeat with a grant. Its application rail can be updated to Heard back or Decision.
5. Find saved items from every category in Saved, and edit founder information from Profile.

Append `?reset` before the hash, such as [start fresh](http://192.168.1.35:5173/outpost-prototype/?reset), or sign out in Profile. This clears the single versioned localStorage record and screen-loading cache. Returning signed-in visitors open Home.

The demo clock starts at Friday 25 September 2026, 15:48 IST and advances using elapsed time. It does not use the device calendar. Official application pages are real outbound links; Outpost records only the founder’s simulated answer.

Tabs always return to their root and restore that root’s scroll position. Browse detail screens retain the tab bar below the action dock; booking steps hide tabs and × returns to the flow’s origin. Successful booking removes completed forms from Back history. The account starts with six sessions left; each request reserves one, founder absence keeps it used, and mentor absence restores it.

All ten mentors share the approved final profile template and can be booked. All 21 catalogue opportunities have complete approved templates with list-card details substituted, as explicitly requested for this prototype. The mentor feed stops at forty rows, reusing the supplied identities.

## Routes

- `#/splash`, `#/sign-in`, `#/verify`
- `#/home`, `#/search`
- `#/mentors`, `#/mentors/ask`, `#/mentors/:id`
- `#/mentors/:id/book`, `#/mentors/:id/review`, `#/mentors/:id/requested`
- `#/sessions`, `#/sessions/:id`, `#/sessions/:id/after`, `#/call/:id`
- `#/challenges`, `#/challenges/ask`, `#/challenges/demo-days`, `#/challenges/:id`
- `#/grants`, `#/grants/ask`, `#/grants/:id`
- `#/challenges/:id/application-saved`, `#/grants/:id/application-saved`
- `#/saved`, `#/profile`, `#/profile/:section`

## Checks and build

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

Run the browser suite with the development server running. Override `PROTOTYPE_URL` for another local port and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for an existing Chromium installation. The suite covers authentication/setup, browsing/booking/attendance, application returns/statuses, shared saves/profile/reset, document scroll/navigation/sheets, accessibility, reduced motion, and seven phone widths. See `PROGRESS.md` for completed results.

`npm run build` writes static files to `dist/`. Vite + React + TypeScript, plain CSS, hash routing and self-hosted Onest fonts keep the build independent of a server. The default base is `/outpost-prototype/`; override with `VITE_BASE_PATH` if the repository name changes. The GitHub Pages workflow builds and deploys when Pavan creates a repository, configures Pages for GitHub Actions, and pushes `main`. No repository, remote, push or deployment has been created for this handoff.
