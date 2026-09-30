import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover');
  }

  const setMeta = (name: string, content: string) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setLink = (rel: string, href: string) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  };

  try {
    const iconModule: any = require('./assets/icon.png');
    const iconUri = typeof iconModule === 'string' ? iconModule : iconModule?.uri;
    if (iconUri) {
      setLink('apple-touch-icon', iconUri);
      setLink('icon', iconUri);
    }
  } catch {
    // ignore if the asset can't be resolved
  }

  setMeta('apple-mobile-web-app-capable', 'yes');
  setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  setMeta('apple-mobile-web-app-title', 'Défi 99');
  setMeta('mobile-web-app-capable', 'yes');
  setMeta('theme-color', '#000000');

  // `100dvh` alone isn't reliably correct in iOS Safari standalone (home
  // screen) mode. A debug pass on a real device (iPhone 16 Pro, true CSS
  // viewport 402x874 per Apple's own specs) confirmed window.innerHeight
  // (874) is the correct full-screen value — a screenshot taken with it
  // applied showed the tab bar flush against the true bottom edge, no gap.
  // (document.documentElement.clientHeight read 812 on the same device —
  // 62px short — and using it instead was a regression: it reintroduced
  // the exact gap this is meant to fix. Don't switch back to clientHeight.)
  // `window.innerHeight` matched the true visible area on the iPhone 16 Pro
  // this was originally debugged on, but a later report on another device
  // showed a blank strip at the bottom again — i.e. innerHeight overshot the
  // real visible height there. `visualViewport.height` tracks what's
  // actually rendered on screen (accounting for on-screen toolbars/keyboard)
  // more reliably across devices, so prefer it when available and only fall
  // back to innerHeight where visualViewport doesn't exist.
  //
  // The catch: the on-screen keyboard also shrinks the visual viewport, by a
  // lot (~370px of an 874px iPhone screen). Shrinking the shell with it is
  // deliberate — it's what keeps a chat composer sitting on top of the
  // keyboard — but if that collapsed height ever sticks after the keyboard
  // goes away, the app is left stranded in a shell covering barely half the
  // screen, with everything below it dead. The tab bar is position:fixed to
  // the real viewport bottom, so it stays put while the content shrinks away
  // from it, leaving a huge empty band in between. iOS does not reliably fire
  // a final resize when the keyboard is dismissed by unmounting its input
  // (e.g. switching tabs straight from a focused field), which is exactly how
  // the app got stuck like that.
  //
  // So: a collapsed reading is only trusted while a text field actually holds
  // focus. Any other time it's a stale value iOS never corrected, and the
  // layout viewport is used instead. That makes the stuck state structurally
  // impossible rather than dependent on an event that may never arrive.
  const KEYBOARD_MIN_SHRINK = 120;

  const isTextFieldFocused = () => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return false;
    return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
  };

  const setAppHeight = () => {
    const layoutHeight = window.innerHeight;
    const visualHeight = window.visualViewport?.height ?? layoutHeight;
    const collapsed = layoutHeight - visualHeight > KEYBOARD_MIN_SHRINK;
    const height = collapsed && !isTextFieldFocused() ? layoutHeight : visualHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
  };
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);
  window.visualViewport?.addEventListener('resize', setAppHeight);
  // Losing focus is the moment the keyboard starts leaving, and it fires even
  // when the field is torn out of the DOM rather than tapped away from. Once
  // immediately so the guard above re-evaluates, once more after the keyboard
  // has finished animating out and the viewport has settled at its real size.
  document.addEventListener('focusout', () => {
    setAppHeight();
    setTimeout(setAppHeight, 300);
  });

  // iOS Safari standalone (home-screen PWA) can keep serving an old cached
  // copy of the app well past a new deploy, forcing manual cache-clearing.
  // Each export gives the JS bundle a new content hash, so we can detect a
  // stale copy by re-fetching this same page with the HTTP cache bypassed
  // and comparing bundle filenames — if they differ, a newer version is
  // live and we reload to pick it up. Runs on load and whenever the app is
  // brought back to the foreground (the normal way this PWA gets reopened).
  const checkForUpdate = async () => {
    try {
      const res = await fetch(window.location.pathname, { cache: 'no-store' });
      if (!res.ok) return;
      const html = await res.text();
      const latest = html.match(/_expo\/static\/js\/web\/index-[a-f0-9]+\.js/)?.[0];
      const current = document.querySelector('script[src*="_expo/static/js/web/"]')?.getAttribute('src');
      if (latest && current && !current.includes(latest)) {
        // At most one update-reload a minute. With the service worker, a
        // navigation that fails over to the cached page and a check that
        // reaches the network a moment later can disagree on a flapping
        // connection — without this, that disagreement is a reload loop.
        const last = Number(sessionStorage.getItem('defi99:update-reload') ?? 0);
        if (Date.now() - last < 60_000) return;
        sessionStorage.setItem('defi99:update-reload', String(Date.now()));
        window.location.reload();
      }
    } catch {
      // offline or blocked — just keep running the current version
    }
  };
  checkForUpdate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });

  // Offline support and instant opens — the rules live in public/sw.js.
  // Not in development: a worker caching Metro's bundles would fight hot
  // reload and serve yesterday's code on localhost.
  if (!__DEV__ && 'serviceWorker' in navigator) {
    // The deployed base path ("/sixty-six-challenge/"), read off the bundle's
    // own URL rather than hardcoded, so the worker registers wherever the
    // export is served from.
    const bundleSrc = document.querySelector('script[src*="/_expo/static/js/web/"]')?.getAttribute('src') ?? '';
    const base = bundleSrc.includes('/_expo/') ? bundleSrc.split('/_expo/')[0] + '/' : '/';

    const register = () => {
      navigator.serviceWorker
        .register(`${base}sw.js`, { scope: base })
        .then(() => navigator.serviceWorker.ready)
        .then((reg) => {
          // Everything this first session already loaded, fetched before the
          // worker was in control. Handing the list over is what makes the
          // very first install work offline, not just the second open.
          const urls = performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .filter((u) => u.startsWith(window.location.origin + base));
          reg.active?.postMessage({ type: 'warm', urls });
        })
        .catch(() => {
          // No worker (private browsing, storage blocked): the app still
          // runs exactly as it did before one existed.
        });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register);
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
