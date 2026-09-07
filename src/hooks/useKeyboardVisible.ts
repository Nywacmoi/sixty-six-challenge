import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// On iOS Safari (especially standalone/PWA mode), opening the keyboard
// shrinks the visual viewport and reflows the page, which can push
// bottom-fixed UI (like the tab bar) up into view over other content.
// We detect that shrink via visualViewport and let callers hide the
// tab bar while the keyboard is open, instead of fighting the reflow.
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;

    const onResize = () => {
      const shrink = window.innerHeight - vv.height;
      setVisible(shrink > 120);
    };

    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  return visible;
}
