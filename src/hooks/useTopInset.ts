import { useSafeAreaInsets } from 'react-native-safe-area-context';

// iOS Safari, when a site is added to the home screen and run in
// standalone mode, reports a safe-area-inset-top noticeably larger than
// the device's real Dynamic Island / notch height (a known WebKit quirk).
// Apple's documented inset for every current iPhone (Dynamic Island or
// notch) tops out at 59pt, so we cap there: it removes the inflated
// padding this bug adds, while still covering every real device's actual
// status bar / island height (i.e. it can only ever reduce the padding
// below what the device truly needs on native, never below it).
const MIN_TOP_INSET = 12;
const MAX_TOP_INSET = 59;

export function useTopInset() {
  const insets = useSafeAreaInsets();
  return Math.min(Math.max(insets.top, MIN_TOP_INSET), MAX_TOP_INSET);
}
