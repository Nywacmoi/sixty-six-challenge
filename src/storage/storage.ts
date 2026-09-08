import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitCompletion, Profile, MetricEntry } from '../types';

const KEYS = {
  habits: '66c:habits',
  completions: '66c:completions',
  profile: '66c:profile',
  unlockedAchievements: '66c:achievements',
  themeMode: '66c:themeMode',
  metrics: '66c:metrics',
  groupReads: '66c:groupReads',
  groupNotificationsEnabled: '66c:groupNotifs',
  dmReads: '66c:dmReads',
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
  heightCm: null,
  goalWeightKg: null,
  lastReminderShownDate: null,
  sportGoal: null,
  sportLevel: null,
  sportDaysPerWeek: null,
  lastCheckInDate: null,
  avatarSeed: null,
  avatarHair: null,
  avatarAccessory: null,
  avatarFacialHair: null,
  avatarExpression: null,
  foodPreference: null,
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

  getMetrics: () => readJson<MetricEntry[]>(KEYS.metrics, []),
  setMetrics: (v: MetricEntry[]) => writeJson(KEYS.metrics, v),

  // Per-device "have I seen this group's latest message" markers — not
  // synced across devices on purpose, it's just a local read receipt for
  // the unread badge, not something worth round-tripping through Firestore.
  getGroupReads: () => readJson<Record<string, number>>(KEYS.groupReads, {}),
  setGroupReads: (v: Record<string, number>) => writeJson(KEYS.groupReads, v),

  getGroupNotificationsEnabled: () => readJson<boolean>(KEYS.groupNotificationsEnabled, false),
  setGroupNotificationsEnabled: (v: boolean) => writeJson(KEYS.groupNotificationsEnabled, v),

  getDmReads: () => readJson<Record<string, number>>(KEYS.dmReads, {}),
  setDmReads: (v: Record<string, number>) => writeJson(KEYS.dmReads, v),

  exportAll: async (): Promise<string> => {
    const [habits, completions, profile, unlockedAchievements, metrics, themeMode] = await Promise.all([
      readJson<Habit[]>(KEYS.habits, []),
      readJson<HabitCompletion[]>(KEYS.completions, []),
      readJson<Partial<Profile>>(KEYS.profile, {}),
      readJson<string[]>(KEYS.unlockedAchievements, []),
      readJson<MetricEntry[]>(KEYS.metrics, []),
      readJson<'light' | 'dark'>(KEYS.themeMode, 'light'),
    ]);
    return JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), habits, completions, profile, unlockedAchievements, metrics, themeMode },
      null,
      2
    );
  },

  importAll: async (json: string): Promise<void> => {
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') throw new Error('Fichier de sauvegarde invalide');
    if (Array.isArray(data.habits)) await writeJson(KEYS.habits, data.habits);
    if (Array.isArray(data.completions)) await writeJson(KEYS.completions, data.completions);
    if (data.profile && typeof data.profile === 'object') await writeJson(KEYS.profile, data.profile);
    if (Array.isArray(data.unlockedAchievements)) await writeJson(KEYS.unlockedAchievements, data.unlockedAchievements);
    if (Array.isArray(data.metrics)) await writeJson(KEYS.metrics, data.metrics);
    if (data.themeMode === 'light' || data.themeMode === 'dark') await writeJson(KEYS.themeMode, data.themeMode);
  },
};
