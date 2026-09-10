import { Platform } from 'react-native';
import { startLiveActivity, updateLiveActivity, endLiveActivity, LiveActivityData } from '../../modules/live-activity/src';

// Tracks whether we believe an activity is currently running so a plain
// habit-toggle update doesn't try to "update" one that was never started
// (e.g. the very first sync after the app opens) — falls back to start()
// in that case instead of silently doing nothing.
let hasActivity = false;

export async function syncLiveActivity(data: LiveActivityData) {
  if (Platform.OS !== 'ios') return;
  if (data.totalCount === 0) {
    if (hasActivity) {
      await endLiveActivity();
      hasActivity = false;
    }
    return;
  }
  if (!hasActivity) {
    hasActivity = await startLiveActivity(data);
    return;
  }
  const ok = await updateLiveActivity(data);
  if (!ok) {
    // The activity likely got dismissed by the person or the system —
    // restart it rather than silently going stale.
    hasActivity = await startLiveActivity(data);
  }
}
