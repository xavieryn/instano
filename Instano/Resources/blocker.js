(function () {
  'use strict';
  if (window.__instano) { return; }
  window.__instano = true;

  // Returns 'reel', 'explore', or null. /explore/search is the kept surface.
  function blockKind(path) {
    if (/^\/(reels|reel)(\/|$)/.test(path)) { return 'reel'; }
    if (/^\/explore(\/|$)/.test(path)) {
      if (path === '/explore/search' || path.indexOf('/explore/search/') === 0) { return null; }
      return 'explore';
    }
    return null;
  }

  var CSS = [
    'a[href="/reels/"], a[href^="/reels/"] { display: none !important; }',
    'a[href^="/explore/"]:not([href^="/explore/search"]) { display: none !important; }',
    // Zero-flash: CSS kills reel tiles/posts before first paint (no JS delay)
    'a[href^="/reel/"] { display: none !important; }',
    'article:has(a[href^="/reel/"]) { display: none !important; }',
    'html[data-instano-explore="1"] main a[href^="/p/"] { display: none !important; }',
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

  // Hide feed items that are reels (posts linking to /reel/...)
  function hideReelItems() {
    var links = document.querySelectorAll('a[href^="/reel/"]');
    for (var i = 0; i < links.length; i++) {
      hide(links[i].closest('article') || links[i]);
    }
  }

  // Structural fix: the home feed algorithm injects suggested accounts/reels.
  // The "Following" variant is follow-only and chronological — force it.
  function forceFollowingFeed() {
    if (location.pathname === '/' && location.search.indexOf('variant=following') === -1) {
      location.replace('/?variant=following');
    }
  }

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
    hideReelItems();
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
