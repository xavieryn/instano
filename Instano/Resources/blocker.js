(function () {
  'use strict';
  if (window.__instano) { return; }
  window.__instano = true;

  var BLOCKED = /^\/(reels|reel|explore)(\/|$)/;

  var CSS = [
    'a[href="/reels/"], a[href^="/reels/"],',
    'a[href="/explore/"], a[href^="/explore/"]',
    '{ display: none !important; }'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('instano-style')) { return; }
    var style = document.createElement('style');
    style.id = 'instano-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  // Hide feed items that are reels (posts linking to /reel/...)
  function hideReelItems() {
    var links = document.querySelectorAll('a[href^="/reel/"]');
    for (var i = 0; i < links.length; i++) {
      var item = links[i].closest('article') || links[i];
      if (item.style.display !== 'none') { item.style.display = 'none'; }
    }
  }

  // SPA navigation guard: Instagram routes with pushState, which never hits
  // WKNavigationDelegate, so the URL-layer block alone can't catch it.
  function guardHistory(method) {
    var original = history[method];
    history[method] = function (state, title, url) {
      if (typeof url === 'string') {
        try {
          var path = new URL(url, location.origin).pathname;
          if (BLOCKED.test(path)) { return; }
        } catch (e) { /* malformed url: let it through */ }
      }
      return original.apply(this, arguments);
    };
  }
  guardHistory('pushState');
  guardHistory('replaceState');

  function bounceIfBlocked() {
    if (BLOCKED.test(location.pathname)) { location.replace('/'); }
  }
  window.addEventListener('popstate', bounceIfBlocked);

  function sweep() {
    injectCSS();
    hideReelItems();
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
