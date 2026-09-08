import { Platform } from 'react-native';

// On web, a custom-height app shell (see index.ts's --app-height, sized to
// visualViewport to avoid a stale-toolbar gap) can end up out of sync with
// the browser's own "scroll the focused input into view" behavior once the
// keyboard opens mid-page — the input lands pinned near the top (or wherever
// it was) with a large dead gap below it instead of being centered above
// the keyboard. Forcing the scroll ourselves after the keyboard has had
// time to animate in sidesteps that mismatch. Pass as a TextInput's
// onFocus.
export function scrollFocusedIntoView() {
  if (Platform.OS !== 'web') return;
  setTimeout(() => {
    const el = document.activeElement as HTMLElement | null;
    el?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, 300);
}
