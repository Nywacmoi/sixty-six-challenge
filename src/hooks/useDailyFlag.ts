import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from '../utils/date';

// "Already done today" for one key, remembered on this device and reset by
// the date itself. Used to make a relance once a day per person or group:
// a nudge is welcome, the same nudge every time the screen is opened is not.
export function useDailyFlag(key: string): [boolean, () => Promise<void>] {
  const storageKey = `defi99:daily:${key}`;
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey).then((v) => {
      if (!cancelled) setDone(v === todayKey());
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const mark = useCallback(async () => {
    await AsyncStorage.setItem(storageKey, todayKey());
    setDone(true);
  }, [storageKey]);

  return [done, mark];
}
