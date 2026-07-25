(function () {
  'use strict';
  if (window.__instano) { return; }
  window.__instano = true;

  // Returns 'reel', 'explore', or null.
  // Blocked: /reels swipe feed, /explore grid.
  // Allowed: /reel/<id> single videos, /reels/create (video upload), /explore/search.
  function blockKind(path) {
    if (/^\/reels(\/|$)/.test(path)) {
      if (path.indexOf('/reels/create') === 0) { return null; }
      return 'reel';
    }
    if (/^\/explore(\/|$)/.test(path)) {
      if (path === '/explore/search' || path.indexOf('/explore/search/') === 0) { return null; }
      return 'explore';
    }
    return null;
  }

  var CSS = [
    'a[href="/reels/"], a[href^="/reels/"]:not([href^="/reels/create"]) { display: none !important; }',
    'a[href^="/explore/"]:not([href^="/explore/search"]) { display: none !important; }',
    // Zero-flash: on explore pages, CSS kills grid tiles before first paint.
    // Feed/profile videos (/reel/<id>) stay visible — they are normal posts.
    'html[data-instano-explore="1"] main a[href^="/p/"],',
    'html[data-instano-explore="1"] main a[href^="/reel/"] { display: none !important; }',
    // Frosted-glass chrome on fixed top/bottom bars
    'header, [role="navigation"] {',
    '  background: rgba(255, 255, 255, 0.72) !important;',
    '  -webkit-backdrop-filter: saturate(180%) blur(20px) !important;',
    '  backdrop-filter: saturate(180%) blur(20px) !important;',
    '}',
    '@media (prefers-color-scheme: dark) {',
    '  header, [role="navigation"] {',
    '    background: rgba(0, 0, 0, 0.6) !important;',
    '  }',
    '}'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('instano-style')) { return; }
    var style = document.createElement('style');
    style.id = 'instano-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  // Synchronous URL stamp so CSS rules can react to route changes with no lag
  function stampPath() {
    var explore = location.pathname.indexOf('/explore') === 0 ? '1' : '0';
    document.documentElement.setAttribute('data-instano-explore', explore);
  }

  // Keep the search entry point: retarget the nav magnifier from the explore
  // grid to the search page (CSS then no longer hides it).
  function retargetSearchLinks() {
    var links = document.querySelectorAll('a[href="/explore/"], a[href="/explore"]');
    for (var i = 0; i < links.length; i++) {
      links[i].setAttribute('href', '/explore/search/');
    }
  }

  function hide(el) {
    if (el && el.style.display !== 'none') { el.style.display = 'none'; }
  }

  // iOS quirk: restrictive `accept` lists make the picker hide videos
  // entirely. Widen every file input so photos AND videos always show.
  function fixFileInputs() {
    var inputs = document.querySelectorAll('input[type="file"]');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].getAttribute('accept') !== 'image/*,video/*') {
        inputs[i].setAttribute('accept', 'image/*,video/*');
      }
    }
  }

  // Structural fix: the home feed algorithm injects suggested accounts/reels.
  // The "Following" variant is follow-only and chronological — force it.
  // ONE-SHOT per page load. Re-running mid-session reloads the page and
  // destroys open composers (dialogs unmount briefly between steps, so a
  // dialog-open check alone cannot make this safe).
  var didForceFeed = false;
  function forceFollowingFeed() {
    if (didForceFeed || location.pathname !== '/') { return; }
    didForceFeed = true;
    if (location.search.indexOf('variant=following') !== -1) { return; }
    if (document.querySelector('div[role="dialog"]')) { return; }
    location.replace('/?variant=following');
  }

  // Error telemetry → native log (visible in Console.app / log stream)
  function report(kind, msg) {
    try {
      window.webkit.messageHandlers.instanoLog.postMessage(kind + ': ' + String(msg).slice(0, 500));
    } catch (e) { /* handler absent */ }
  }
  window.addEventListener('error', function (e) { report('jserror', e.message); });
  window.addEventListener('unhandledrejection', function (e) { report('promise', e.reason); });
  var origFetch = window.fetch;
  window.fetch = function () {
    return origFetch.apply(this, arguments).then(function (res) {
      if (!res.ok && String(res.url).indexOf('instagram.com') !== -1) {
        report('http' + res.status, res.url);
      }
      return res;
    });
  };

  // Fallback DOM layer: hide suggested/sponsored units the variant misses
  var MARKERS = ['Suggested for you', 'Suggested reels', 'Suggested posts',
                 'Sponsored', 'Reels you might like'];
  function containsMarker(text) {
    for (var i = 0; i < MARKERS.length; i++) {
      if (text.indexOf(MARKERS[i]) !== -1) { return true; }
    }
    return false;
  }

  function hideSuggestedPosts() {
    var units = document.querySelectorAll('article, main > div > div > div > section');
    for (var i = 0; i < units.length; i++) {
      if (units[i].style.display === 'none') { continue; }
      if (units[i].closest('[role="dialog"]')) { continue; }
      if (containsMarker(units[i].textContent || '')) {
        hide(units[i]);
      }
    }
  }

  // On explore/search pages: no photo grid. Account results are profile
  // links and stay visible; grid tiles link to /p/ and die here.
  function hideExploreGrid() {
    if (location.pathname.indexOf('/explore') !== 0) { return; }
    var tiles = document.querySelectorAll('main a[href^="/p/"]');
    for (var i = 0; i < tiles.length; i++) {
      hide(tiles[i]);
    }
  }

  // SPA navigation guard: Instagram routes with pushState, which never hits
  // WKNavigationDelegate, so the URL-layer block alone can't catch it.
  function guardHistory(method) {
    var original = history[method];
    history[method] = function (state, title, url) {
      if (typeof url === 'string') {
        try {
          var kind = blockKind(new URL(url, location.origin).pathname);
          if (kind === 'reel') { return; }
          if (kind === 'explore') {
            arguments[2] = '/explore/search/';
          }
        } catch (e) { /* malformed url: let it through */ }
      }
      var result = original.apply(this, arguments);
      stampPath();
      return result;
    };
  }
  guardHistory('pushState');
  guardHistory('replaceState');

  function bounceIfBlocked() {
    var kind = blockKind(location.pathname);
    if (kind === 'reel') { location.replace('/'); }
    if (kind === 'explore') { location.replace('/explore/search/'); }
  }
  window.addEventListener('popstate', bounceIfBlocked);

  function sweep() {
    injectCSS();
    stampPath();
    forceFollowingFeed();
    retargetSearchLinks();
    fixFileInputs();
    hideSuggestedPosts();
    hideExploreGrid();
    bounceIfBlocked();
  }

  // Coalesce to the next frame: fast enough to be invisible, still batched
  var pending = false;
  function schedule() {
    if (pending) { return; }
    pending = true;
    requestAnimationFrame(function () { pending = false; sweep(); });
  }

  function start() {
    sweep();
    new MutationObserver(schedule).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Route the create (+) button to the native desktop-composer sheet:
  // Instagram's mobile web composer cannot upload video; the desktop one can.
  var CREATE_RE = /new post|create|nova publica|criar/i;
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a,button,div[role="button"]') : null;
    if (!el) { return; }
    var label = el.getAttribute('aria-label') || '';
    if (!label) {
      var svg = el.querySelector('svg[aria-label]');
      if (svg) { label = svg.getAttribute('aria-label') || ''; }
    }
    // Telemetry: learn the real labels Instagram uses
    if (label) { report('click', label); }
    if (!CREATE_RE.test(label)) { return; }
    e.preventDefault();
    e.stopPropagation();
    try { window.webkit.messageHandlers.instanoCreate.postMessage('open'); } catch (err) {}
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
