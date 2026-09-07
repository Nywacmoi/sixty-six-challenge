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
  setMeta('theme-color', '#FFFFFF');

  // `100dvh` alone isn't reliably correct in iOS Safari standalone (home
  // screen) mode — it can settle on a height taller than the real visible
  // area, leaving a blank strip of unrendered page background above the
  // home indicator. A debug pass on a real device confirmed it: innerHeight
  // and visualViewport.height both read 874, but the actual visible area
  // (document.documentElement.clientHeight) was 812 — a 62px gap. The root
  // <html> element's clientHeight is capped by the true browser viewport no
  // matter what CSS height it's given, so it's the one measurement that
  // can't be thrown off by our own override. Use that as the source of
  // truth instead of window.innerHeight / visualViewport.height.
  const setAppHeight = () => {
    document.documentElement.style.setProperty('--app-height', `${document.documentElement.clientHeight}px`);
  };
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);

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
