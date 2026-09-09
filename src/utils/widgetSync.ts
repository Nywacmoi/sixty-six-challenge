import { Platform } from 'react-native';
import { ExtensionStorage } from '@bacons/apple-targets';

// Must match the app group declared in app.json's ios.entitlements and in
// targets/widget/expo-target.config.js — this is how the widget extension
// (a separate process) reads today's progress written by the main app.
const APP_GROUP = 'group.com.nywacmoi.defi99';
const storage = new ExtensionStorage(APP_GROUP);

export function syncWidget(data: {
  currentDay: number;
  totalDays: number;
  doneCount: number;
  totalCount: number;
  progress: number;
}) {
  if (Platform.OS !== 'ios') return;
  storage.set('currentDay', data.currentDay);
  storage.set('totalDays', data.totalDays);
  storage.set('doneCount', data.doneCount);
  storage.set('totalCount', data.totalCount);
  storage.set('progress', data.progress);
  ExtensionStorage.reloadWidget();
}
