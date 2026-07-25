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
    'a[href^="/explore/"]:not([href^="/explore/search"]) { display: none !important; }'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('instano-style')) { return; }
    var style = document.createElement('style');
    style.id = 'instano-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
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

  // Home feed: hide suggested and sponsored posts (SocialLite parity)
  function hideSuggestedPosts() {
    var articles = document.querySelectorAll('article');
    for (var i = 0; i < articles.length; i++) {
      if (articles[i].style.display === 'none') { continue; }
      var text = articles[i].textContent || '';
      if (text.indexOf('Suggested for you') !== -1 || text.indexOf('Sponsored') !== -1) {
        hide(articles[i]);
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
      return original.apply(this, arguments);
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
    retargetSearchLinks();
    hideReelItems();
    hideSuggestedPosts();
    hideExploreGrid();
    bounceIfBlocked();
  }

  var pending = false;
  function schedule() {
    if (pending) { return; }
    pending = true;
    setTimeout(function () { pending = false; sweep(); }, 250);
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
