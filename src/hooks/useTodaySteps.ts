import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export type StepsState = {
  steps: number | null;
  available: boolean;
  permissionDenied: boolean;
};

// CoreMotion (iOS) can answer "how many steps since a given time" directly,
// so a fresh read on every foreground is enough — no need to keep a live
// subscription running. Android has no equivalent query (expo-sensors only
// exposes a live delta there via watchStepCount, which needs its own
// midnight-reset/persistence plumbing this app doesn't have yet), and
// there's no pedometer on web at all — both just report unavailable rather
// than showing a made-up number.
export function useTodaySteps(): StepsState {
  const [state, setState] = useState<StepsState>({ steps: null, available: false, permissionDenied: false });
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (Platform.OS !== 'ios') return;
    const available = await Pedometer.isAvailableAsync().catch(() => false);
    if (!mounted.current) return;
    if (!available) {
      setState({ steps: null, available: false, permissionDenied: false });
      return;
    }
    const { status } = await Pedometer.requestPermissionsAsync();
    if (!mounted.current) return;
    if (status !== 'granted') {
      setState({ steps: null, available: true, permissionDenied: true });
      return;
    }
    const result = await Pedometer.getStepCountAsync(startOfToday(), new Date()).catch(() => null);
    if (!mounted.current) return;
    setState({ steps: result?.steps ?? 0, available: true, permissionDenied: false });
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => {
      mounted.current = false;
      sub.remove();
    };
  }, [refresh]);

  return state;
}
