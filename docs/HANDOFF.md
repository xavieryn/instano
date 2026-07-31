# HANDOFF — Create and Connect ("Instano") — 2026-07-31

iOS wrapper of instagram.com that removes Reels/Explore/suggested content.
App Store name **Create and Connect**, home-screen name **Freely**, repo
github.com/xavieryn/instano (public — no secrets in here; credentials live in
App Store Connect review details and in Claude's private memory).

## Identifiers

| Thing | Value |
|---|---|
| Bundle id | com.xaviernishikawa.instano |
| ASC app id | 6794683109 |
| Team (paid) | 47BX55MGYF |
| appStoreVersion 1.0 | 7f68c93f-7c66-47ab-ab57-67afee236691 |
| version localization en-US | 7cc72a0b-af46-46e6-918b-01144681ca66 |
| appInfo | a90c40ba-888d-482e-a5c9-af467ec1a32d |
| appInfoLocalization en-US | a51513d8-43d1-4867-9e85-e08c03eec6a4 |
| TestFlight group "Friends" | 83b4e969-918c-45f4-8dcc-9a2b9bbbc5c9 |
| Public TestFlight link | https://testflight.apple.com/join/3G1d51V3 |
| Latest build | 15 (id 4ba3e183-795c-477b-bfd5-adb5fc11272a) |
| ASC API key (Admin) | Key ID Z546GXB475, p8 in ~/.appstoreconnect/private_keys/ |
| Issuer ID | aa2a1d38-7846-4662-a1cb-2e42f8085892 |
| Privacy page | https://xavieryn.github.io/instano/privacy.html |

Demo Instagram account for review: username `freelydemo` (password is stored
in ASC review details; also in Claude memory).

## Pipeline (proven commands)

Ship a build N: edit `CURRENT_PROJECT_VERSION` in project.yml → `xcodegen
generate` → test on sim id `77F7EBDD-AA34-41DE-BA4A-0B94F67A3297` (iPhone 16 —
use ids, duplicate names break `-destination name=`) → `xcodebuild archive
-destination 'generic/platform=iOS'` then `-exportArchive` with
`scripts/ExportOptions.plist` + `-authenticationKeyPath/KeyID/KeyIssuerID`
flags → poll `scripts/asc_api.js GET /v1/builds?filter[version]=N` until VALID
→ POST the build id to the Friends group relationships/builds.
`scripts/asc_api.js` is a zero-dep JWT client: `node scripts/asc_api.js GET|POST|PATCH <path> [json]`
with env ASC_KEY_ID / ASC_ISSUER_ID / ASC_KEY_PATH.

## Status

DONE: builds 1–15 shipped; TestFlight internal + Friends group live; beta
review SUBMITTED (WAITING_FOR_REVIEW — approval activates the public link);
App Store 1.0 listing (description, subtitle "Instagram, minus the Reels",
keywords, promo, URLs), category Productivity, review details w/ phone+demo,
build 15 attached; privacy page live; bundle registered.

REMAINING for App Store submission:
1. **Screenshots** — need ≥1 for 6.9" (1320×2868). In-progress sim workflow
   below. Upload via API: appScreenshotSets (APP_IPHONE_67) + appScreenshots
   (reserve → upload chunks → commit).
2. **Privacy questionnaire** — Xavier said "Data Not Collected". No public API
   found; likely 2 UI clicks in ASC → App Privacy. Verify before submit.
3. **Video-post confirmation on build 15** — sim test was mid-flight (below).
4. Final submit: POST /v1/reviewSubmissions (platform IOS) + add version item.

## In-flight: simulator E2E test (resume here)

Goal: log into demo account in sim, verify + bubble → desktop composer →
video post, and capture App Store screenshots.

- Sim: iPhone 16 Pro Max id `168D96F6-BCD1-47CD-801A-10D443BC957E` (6.9",
  screenshots are exactly 1320×2868), Debug app installed + running.
- Automation: `idb` installed (`~/.local/bin/idb`, companion via brew).
  Taps in POINTS (screenshot px ÷ 3): `idb ui tap --udid <sim> X Y`,
  `idb ui text --udid <sim> "str"`.
- **Where it stopped**: on the login form, both strings landed in the
  username field ("freelydemoNishikawa111!") — the second tap didn't move
  focus before `ui text` ran. Fix: tap username field, select-all+delete
  (or triple-tap then `idb ui key` backspaces), retype `freelydemo`; tap
  password field, CONFIRM focus via screenshot, then type. Field coords
  (points): username ~(219,421)→ now shifted, re-screenshot first; Log in
  button below password. After login expect possible Instagram "save info /
  new device" interstitials — dismiss, screenshot each step.
- Then: screenshots of feed/search/DMs/profile (nav bottom), + bubble →
  composer sheet; to test video, `xcrun simctl addmedia <sim> <video.mp4>`
  first (no videos in fresh sim library).

## Product decisions locked

Feed = `/?variant=following` (one-shot redirect per page load — re-running
mid-session reloads and kills the composer; learned the hard way). Blocked:
`/reels` swipe feed, `/explore` grid. Allowed: `/reel/<id>` single videos
(every IG video is a "reel" — blocking it broke video viewing/posting),
`/reels/create`, `/explore/search` (people search; nav magnifier retargeted).
File inputs' `accept` widened to image/*,video/* (iOS picker hides videos
otherwise). Mobile IG composer is images-only by design → video posting goes
through the **desktop-UA composer sheet** (floating + bubble → ComposerSheet:
desktop UA, composer.js hides site, auto-clicks New post, viewport 1100px
scaled). Portrait locked. No pull-to-refresh (Xavier hates the spinner).
WKAppBoundDomains set (Service Workers). Camera crash fix = usage
descriptions. Push notifications: impossible in wrappers (SocialLite can't
either — their reviews confirm); mitigation = unread badge (unbuilt) or
native IG with DM-only notifications.

## Gotchas

- zsh has a `log` function — use `/usr/bin/log`. Device log capture:
  `python3 -m pymobiledevice3 syslog live | grep -i instano` (no sudo needed),
  or `sudo /usr/bin/log collect --device-name "Xavier’s iPhone"` (curly ’).
- `find DerivedData` must exclude `Index.noindex`.
- iOS bundles: never a root `Resources/` folder reference (breaks install);
  resources are copied flat, `blocker.js`/`composer.js` at bundle root.
- App Store name uniqueness: "Freely" taken; current name "Create and
  Connect" was set via PATCH appInfoLocalizations.
- In-app JS telemetry: messageHandlers instanoLog (errors/click labels) and
  instanoCreate (opens composer sheet); logs visible under subsystem
  com.xaviernishikawa.instano.

## Xavier's standing asks

Everything free for everyone; UI as close to real Instagram as a wrapper
allows; video posting is the make-or-break feature; App Store launch ASAP
(TestFlight public link is plan B if 5.2.2 rejection).
