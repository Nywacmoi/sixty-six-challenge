import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitCompletion, Profile } from '../types';

const KEYS = {
  habits: '66c:habits',
  completions: '66c:completions',
  profile: '66c:profile',
  unlockedAchievements: '66c:achievements',
  themeMode: '66c:themeMode',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

const PROFILE_DEFAULTS: Profile = {
  name: 'Toi',
  avatarColor: '#005FFE',
  challengeStartDate: null,
  reminderEnabled: false,
  reminderHour: 8,
  reminderMinute: 0,
  onboardingCompleted: false,
  goal: null,
  streakFreezes: 1,
};

export const storage = {
  getHabits: () => readJson<Habit[]>(KEYS.habits, []),
  setHabits: (v: Habit[]) => writeJson(KEYS.habits, v),

  getCompletions: () => readJson<HabitCompletion[]>(KEYS.completions, []),
  setCompletions: (v: HabitCompletion[]) => writeJson(KEYS.completions, v),

  getProfile: async () => {
    const stored = await readJson<Partial<Profile>>(KEYS.profile, {});
    return { ...PROFILE_DEFAULTS, ...stored };
  },
  setProfile: (v: Profile) => writeJson(KEYS.profile, v),

  getUnlockedAchievements: () => readJson<string[]>(KEYS.unlockedAchievements, []),
  setUnlockedAchievements: (v: string[]) => writeJson(KEYS.unlockedAchievements, v),

  getThemeMode: () => readJson<'light' | 'dark'>(KEYS.themeMode, 'light'),
  setThemeMode: (v: 'light' | 'dark') => writeJson(KEYS.themeMode, v),
};
