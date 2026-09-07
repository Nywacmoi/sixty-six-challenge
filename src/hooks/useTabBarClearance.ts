import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_BASE_HEIGHT } from '../navigation/CustomTabBar';

// The custom tab bar is position:fixed on web (pinned to the true viewport
// bottom, bypassing an unreliable flex chain — see CustomTabBar.tsx), which
// means it sits OUTSIDE the normal layout flow and can overlap the last bit
// of any scrollable screen underneath it. Screens nested inside the tab
// navigator need this much extra bottom padding so their content actually
// clears it instead of running into/behind it. Screens rendered outside the
// tab navigator (root-level modals like AddHabit/Program, which cover the
// tab bar entirely) don't need this.
export function useTabBarClearance() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 14);
}
