import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

// Every screen scrolls edge to edge, and on iOS the web view runs underneath
// a translucent status bar (`apple-mobile-web-app-status-bar-style:
// black-translucent`). Screens pad their headers down past the notch so they
// start in the clear, but nothing stopped the content from sliding straight
// back under it the moment you scrolled: the page title would ride up over
// the system clock and the two would render on top of each other, which read
// as duplicated text rather than as an overlap.
//
// This is the mask that was missing — an opaque band exactly as tall as the
// top inset, with a short fade under it so content dissolves into the status
// bar area instead of being sliced off by a hard line. It lives at the app
// shell level rather than in each screen so it covers modals and overlays
// too, and it never takes touches.
const MAX_INSET = 59;
const FADE_HEIGHT = 16;

// iOS anchors `position: fixed` to the layout viewport, not to what's actually
// on screen. Open the keyboard and it shifts the visual viewport up without
// touching the layout one, so anything "fixed to the top" quietly slides off
// above the visible area — taking this mask with it exactly when content is
// scrolled up under the clock. Following `offsetTop` glues it back to what the
// user can see. Everywhere else this stays 0 and the hook costs nothing.
function useVisualViewportOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setOffset(vv.offsetTop);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return offset;
}

export function StatusBarScrim() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const offsetTop = useVisualViewportOffset();
  const height = Math.min(insets.top, MAX_INSET);

  // No inset means no status bar overlapping anything — a desktop browser, or
  // a device that reports none. An opaque band there would just be a stripe.
  if (height <= 0) return null;

  return (
    <View
      pointerEvents="none"
      style={
        {
          // Pinned to the true viewport top on web, the same trick the tab bar
          // uses at the bottom, so it can't drift with the app shell's height.
          position: Platform.OS === 'web' ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: [{ translateY: offsetTop }],
        } as any
      }
    >
      <View style={{ height, backgroundColor: colors.background }} />
      <LinearGradient
        colors={[colors.background, colors.background + '00']}
        style={{ height: FADE_HEIGHT }}
      />
    </View>
  );
}
