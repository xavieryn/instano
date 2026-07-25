(function () {
  'use strict';
  if (window.__instanoComposer) { return; }
  window.__instanoComposer = true;

  // Creation-only surface: hide the desktop site (feed, nav, reels, search);
  // only Instagram's create dialog should be visible.
  var CSS = [
    'a[href^="/reels"], a[href^="/explore"] { display: none !important; }',
    // Feed and left nav hidden — the create dialog renders in a portal at
    // body level, outside main/nav.
    'main, nav { visibility: hidden !important; }',
    'div[role="dialog"] { visibility: visible !important; }'
  ].join('\n');

  function injectCSS() {
    if (document.getElementById('instano-composer-style')) { return; }
    var style = document.createElement('style');
    style.id = 'instano-composer-style';
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  // Auto-open the create dialog so the user never browses the desktop site
  var tries = 0;
  var timer = setInterval(function () {
    injectCSS();
    if (document.querySelector('div[role="dialog"]')) { clearInterval(timer); return; }
    var svg = document.querySelector('svg[aria-label="New post"], svg[aria-label="Create"], svg[aria-label="Nova publicação"]');
    var btn = svg && svg.closest('a,button,div[role="button"]');
    if (btn) { btn.click(); }
    if (++tries > 60) { clearInterval(timer); }
  }, 500);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSS);
  } else {
    injectCSS();
  }
  new MutationObserver(injectCSS).observe(document.documentElement, { childList: true, subtree: true });
})();
