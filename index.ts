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
  const setAppHeight = () => {
    const height = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
  };
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);
  window.visualViewport?.addEventListener('resize', setAppHeight);

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
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
