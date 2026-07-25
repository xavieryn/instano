# Instano — Design Spec

Date: 2026-07-25
Status: Approved (Xavier pre-approved via question round; auto-approve mandate)

## What

iOS app that gives you Instagram without the addictive parts. A native SwiftUI shell
around Instagram's mobile website with injected CSS/JS that removes Reels and Explore.
Functional equivalent of SocialLite (sociallite.app) — original code, original name,
no copied assets.

## Why

Short-form video feed is the hook; feed + DMs + profiles are the utility. Instagram
ships no public API and no setting to disable Reels, so the only viable route is
wrapping instagram.com mobile web and hiding elements in the DOM.

## Scope (v1)

Blocked:
- Reels tab in bottom navigation
- Reels/clips items inside the home feed
- Explore page (discovery grid) — search-for-people still works
- Direct navigation to `/reels/*` and `/explore/*` (hard block, not just hidden)

Kept: home feed, Stories, DMs, profiles, posting, notifications, search.

Explicitly out of v1: ads/suggested-post stripping (Xavier deselected), YouTube,
Android, settings toggles, premium tier. Architecture leaves room for all.

## Architecture

Single iOS app target, SwiftUI lifecycle, min iOS 17.

Components:

1. **`ContentView` / `WebView` (UIViewRepresentable)** — hosts one `WKWebView`
   pointed at `https://www.instagram.com/`. Pull-to-refresh, back/forward swipe
   gestures, external links (non-instagram.com) open in Safari.
2. **`BlockRules`** — pure Swift: given a `URL`, answer allow/deny. Denies
   `/reels/…` and `/explore/…` paths on instagram.com. Unit-testable, no WebKit.
3. **`Injector`** — loads `blocker.js` + `blocker.css` from the bundle into
   `WKUserContentController` at `.atDocumentStart`, main frame only.
4. **`blocker.js`** — injects the CSS, then runs a `MutationObserver` so blocks
   survive Instagram's SPA re-renders. Hides: bottom-nav Reels link
   (`a[href^="/reels"]`), Explore link (`a[href^="/explore"]`), feed items
   containing clips markers. Also intercepts `history.pushState` to `/reels|/explore`
   and bounces back.
5. **`NavigationDelegate`** — `WKNavigationDelegate.decidePolicyFor` consults
   `BlockRules`; denied navigations cancel and stay put.
6. **Session** — `WKWebsiteDataStore.default()` persists cookies; login survives
   relaunch. No credentials ever touch our code.

Data flow: user gesture → WKWebView → NavigationDelegate (URL-level block) →
page renders → blocker.js (DOM-level block). Two layers so neither has to be perfect.

## Error handling

- Offline / load failure: simple retry view over the web view.
- Instagram DOM changes break selectors: selectors centralized at top of
  `blocker.js`, one place to patch. Fail-open (worst case Reels reappear; app
  never breaks core browsing).
- Instagram may A/B different markup; MutationObserver approach tolerates
  re-render timing.

## Testing

- Unit tests: `BlockRules` URL matrix (reels/explore blocked; feed, DMs, profiles,
  CDN, login allowed).
- Manual sim test: login, scroll feed, confirm Reels tab gone, `/explore` bounce.
- No UI-automation against Instagram (login walls, brittle).

## Distribution

1. Now: build + run in simulator; on Xavier's device via Xcode.
2. TestFlight: needs Apple Developer Program membership ($99/yr — paid account,
   not just an Apple ID). Bundle id `com.xaviernishikawa.instano`. Friends get link.
3. Later: App Store submission, free. Risk: guideline 5.2.2 (third-party content).
   SocialLite precedent says approvable. Not a v1 blocker.

## Risks

- Instagram ToS frowns on automated access; a passive wrapper that hides elements
  is the same category as content blockers/reader modes and what SocialLite ships.
  Accounts log in normally through Instagram's own pages.
- Selector rot is the main maintenance cost. Accepted.
