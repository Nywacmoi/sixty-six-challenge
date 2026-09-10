import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

type NativeLiveActivityModule = {
  isSupported(): Promise<boolean>;
  start(
    currentDay: number,
    totalDays: number,
    doneCount: number,
    totalCount: number,
    progress: number,
    streak: number
  ): Promise<boolean>;
  update(
    currentDay: number,
    totalDays: number,
    doneCount: number,
    totalCount: number,
    progress: number,
    streak: number
  ): Promise<boolean>;
  end(): Promise<boolean>;
};

const native: NativeLiveActivityModule | null = Platform.OS === 'ios' ? requireNativeModule('LiveActivityModule') : null;

export type LiveActivityData = {
  currentDay: number;
  totalDays: number;
  doneCount: number;
  totalCount: number;
  progress: number;
  streak: number;
};

function toArgs(data: LiveActivityData): [number, number, number, number, number, number] {
  return [data.currentDay, data.totalDays, data.doneCount, data.totalCount, data.progress, data.streak];
}

export async function isLiveActivitySupported(): Promise<boolean> {
  if (!native) return false;
  return native.isSupported().catch(() => false);
}

export async function startLiveActivity(data: LiveActivityData): Promise<boolean> {
  if (!native) return false;
  return native.start(...toArgs(data)).catch(() => false);
}

export async function updateLiveActivity(data: LiveActivityData): Promise<boolean> {
  if (!native) return false;
  return native.update(...toArgs(data)).catch(() => false);
}

export async function endLiveActivity(): Promise<boolean> {
  if (!native) return false;
  return native.end().catch(() => false);
}
