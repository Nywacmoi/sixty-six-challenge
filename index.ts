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
  // home indicator. Measuring window.innerHeight in JS and exposing it as
  // a CSS variable is the long-standing, more reliable fix; public/index.html
  // uses it as the final override on top of the 100% / 100dvh fallbacks.
  const setAppHeight = () => {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  };
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
