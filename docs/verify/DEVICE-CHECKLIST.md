# On-device checklist (Xavier)

Setup:
1. `xcodegen generate` (if fresh clone), open `Instano.xcodeproj` in Xcode.
2. Signing & Capabilities → set your team (free Apple ID works, 7-day cert).
   Remove `CODE_SIGNING_ALLOWED: NO` override for device builds (Xcode UI
   signing settings win; if build complains, delete that line from project.yml
   and regenerate).
3. Select "Xavier's iPhone" → Run.

Verify after logging in inside the app:
1. No Reels tab in bottom nav.
2. Nothing navigates to Explore grid; any explore/reels link dead or hidden.
3. Feed shows posts; reel posts hidden.
4. DMs, Stories, profiles, search-for-people, posting all work.
5. Kill + relaunch: still logged in.
6. External links open in Safari, not inside the app.

If Instagram changes markup and something reappears: edit selectors at top of
`Instano/Resources/blocker.js`, rebuild.
