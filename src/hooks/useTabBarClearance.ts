import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE_HEIGHT } from '../navigation/CustomTabBar';
import { useKeyboardVisible } from './useKeyboardVisible';

// The custom tab bar is position:fixed on web (pinned to the true viewport
// bottom, bypassing an unreliable flex chain — see CustomTabBar.tsx), which
// means it sits OUTSIDE the normal layout flow and can overlap the last bit
// of any scrollable screen underneath it. Screens nested inside the tab
// navigator need this much extra bottom padding so their content actually
// clears it instead of running into/behind it. Screens rendered outside the
// tab navigator (root-level modals like AddHabit/Program, which cover the
// tab bar entirely) don't need this.
//
// CustomTabBar also hides itself entirely while the keyboard is open (see
// useKeyboardVisible there) — if this hook kept returning the same padding
// in that state, screens would be left with a large dead gap where the now
//-gone tab bar used to be, on top of the keyboard's own space. So this
// collapses to 0 whenever the keyboard is visible, matching the tab bar.
export function useTabBarClearance() {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  if (keyboardVisible) return 0;
  return TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 14);
}
