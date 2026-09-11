import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Habit, HabitCompletion, Profile, MetricEntry, JournalEntry } from '../types';
import { storage } from '../storage/storage';
import { todayKey, daysBetween, addDays } from '../utils/date';
import { ACHIEVEMENTS } from '../data/achievements';
import { TOTAL_DAYS } from '../theme/theme';
import { getLevelInfo, LevelInfo, XP_PER_COMPLETION, XP_PER_ACHIEVEMENT, MAX_STREAK_FREEZES } from '../utils/gamification';
import { migrateHabitIcon } from '../utils/iconMigration';
import { syncWidget } from '../utils/widgetSync';
import { syncLiveActivity } from '../utils/liveActivitySync';

type NewlyUnlocked = { id: string; title: string; icon: string } | null;
type ToastState = { icon: string; message: string } | null;

type AppContextValue = {
  loading: boolean;
  habits: Habit[];
  completions: HabitCompletion[];
  profile: Profile;
  unlockedAchievements: string[];
  currentDay: number;
  todayProgress: number;
  totalXP: number;
  levelInfo: LevelInfo;
  useStreakFreeze: (habitId: string) => Promise<boolean>;
  canUseStreakFreeze: (habitId: string) => boolean;
  newlyUnlocked: NewlyUnlocked;
  clearNewlyUnlocked: () => void;
  toast: ToastState;
  showToast: (icon: string, message: string) => void;
  clearToast: () => void;
  addHabit: (name: string, icon: string, color: string) => Promise<void>;
  addHabitsBulk: (items: { name: string; icon: string; color: string }[]) => Promise<void>;
  updateHabit: (id: string, patch: Partial<Habit>) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, dateKey?: string) => Promise<void>;
  setPhotoForToday: (habitId: string, uri: string) => Promise<void>;
  setSessionForToday: (habitId: string, session: string) => Promise<void>;
  metrics: MetricEntry[];
  logMetric: (key: string, value: number) => Promise<void>;
  getMetricHistory: (key: string) => MetricEntry[];
  getLatestMetric: (key: string) => number | undefined;
  saveJournalEntry: (habitId: string, prompt: string, text: string) => Promise<void>;
  getJournalEntries: (habitId: string) => JournalEntry[];
  getTodayJournalEntry: (habitId: string) => JournalEntry | undefined;
  isCompleted: (habitId: string, dateKey?: string) => boolean;
  getStreak: (habitId: string) => number;
  getLongestStreak: (habitId: string) => number;
  getTotalCompletions: () => number;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [profile, setProfile] = useState<Profile>({
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
    avatarGender: null,
    avatarHair: null,
    avatarAccessory: null,
    avatarFacialHair: null,
    avatarExpression: null,
    foodPreference: null,
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<NewlyUnlocked>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  useEffect(() => {
    (async () => {
      const [h, c, p, a, m, j] = await Promise.all([
        storage.getHabits(),
        storage.getCompletions(),
        storage.getProfile(),
        storage.getUnlockedAchievements(),
        storage.getMetrics(),
        storage.getJournal(),
      ]);
      // Generated once on first launch and kept stable — the avatar's base
      // look (whatever the seed randomizes when no wardrobe item overrides
      // it) shouldn't reshuffle every time the app reloads.
      let resolvedProfile = p;
      if (!p.avatarSeed) {
        resolvedProfile = { ...p, avatarSeed: Math.random().toString(36).slice(2, 12) };
        await storage.setProfile(resolvedProfile);
      }
      // One-time migration from the old emoji-based habit icons to Ionicons
      // names — see iconMigration.ts. Only writes back if something
      // actually changed, so this is a no-op after the first run.
      let resolvedHabits = h;
      const migratedHabits = h.map((habit) => ({ ...habit, icon: migrateHabitIcon(habit.icon) }));
      if (migratedHabits.some((habit, i) => habit.icon !== h[i].icon)) {
        resolvedHabits = migratedHabits;
        await storage.setHabits(resolvedHabits);
      }
      setHabits(resolvedHabits);
      setCompletions(c);
      setProfile(resolvedProfile);
      setUnlockedAchievements(a);
      setMetrics(m);
      setJournal(j);
      setLoading(false);
    })();
  }, []);

  const currentDay = useMemo(() => {
    if (!profile.challengeStartDate) return 0;
    const diff = daysBetween(profile.challengeStartDate, todayKey());
    return Math.min(TOTAL_DAYS, diff + 1);
  }, [profile.challengeStartDate]);

  const isCompleted = useCallback(
    (habitId: string, dateKey: string = todayKey()) => {
      return completions.some((c) => c.habitId === habitId && c.date === dateKey && c.completed);
    },
    [completions]
  );

  const getStreak = useCallback(
    (habitId: string) => {
      let streak = 0;
      let cursor = todayKey();
      const hasToday = isCompleted(habitId, cursor);
      if (!hasToday) {
        cursor = addDays(cursor, -1);
      }
      while (isCompleted(habitId, cursor)) {
        streak += 1;
        cursor = addDays(cursor, -1);
      }
      return streak;
    },
    [isCompleted]
  );

  const getLongestStreak = useCallback(
    (habitId: string) => {
      const dates = completions
        .filter((c) => c.habitId === habitId && c.completed)
        .map((c) => c.date)
        .sort();
      let longest = 0;
      let running = 0;
      let prev: string | null = null;
      for (const d of dates) {
        if (prev && daysBetween(prev, d) === 1) {
          running += 1;
        } else {
          running = 1;
        }
        longest = Math.max(longest, running);
        prev = d;
      }
      return longest;
    },
    [completions]
  );

  const getTotalCompletions = useCallback(() => {
    return completions.filter((c) => c.completed).length;
  }, [completions]);

  const todayProgress = useMemo(() => {
    const active = habits.filter((h) => !h.archived);
    if (active.length === 0) return 0;
    const done = active.filter((h) => isCompleted(h.id)).length;
    return done / active.length;
  }, [habits, isCompleted]);

  const totalXP = useMemo(() => {
    const totalCompletions = completions.filter((c) => c.completed).length;
    return totalCompletions * XP_PER_COMPLETION + unlockedAchievements.length * XP_PER_ACHIEVEMENT;
  }, [completions, unlockedAchievements]);

  const levelInfo = useMemo(() => getLevelInfo(totalXP), [totalXP]);

  const evaluateAchievements = useCallback(
    async (nextCompletions: HabitCompletion[], nextHabits: Habit[], nextStartDate: string | null, currentProfile: Profile) => {
      const alreadyUnlocked = await storage.getUnlockedAchievements();
      const toUnlock: string[] = [];

      const dayReached = nextStartDate ? Math.min(TOTAL_DAYS, daysBetween(nextStartDate, todayKey()) + 1) : 0;
      const totalCompletions = nextCompletions.filter((c) => c.completed).length;
      const projectedXP = totalCompletions * XP_PER_COMPLETION + alreadyUnlocked.length * XP_PER_ACHIEVEMENT;
      const projectedLevel = getLevelInfo(projectedXP).level;

      const activeHabits = nextHabits.filter((h) => !h.archived);
      const todayStr = todayKey();
      const perfectDay =
        activeHabits.length > 0 &&
        activeHabits.every((h) => nextCompletions.some((c) => c.habitId === h.id && c.date === todayStr && c.completed));

      const maxStreakAcrossHabits = nextHabits.reduce((max, h) => {
        let streak = 0;
        let cursor = todayKey();
        const completedToday = nextCompletions.some((c) => c.habitId === h.id && c.date === cursor && c.completed);
        if (!completedToday) cursor = addDays(cursor, -1);
        while (nextCompletions.some((c) => c.habitId === h.id && c.date === cursor && c.completed)) {
          streak += 1;
          cursor = addDays(cursor, -1);
        }
        return Math.max(max, streak);
      }, 0);

      for (const def of ACHIEVEMENTS) {
        if (alreadyUnlocked.includes(def.id)) continue;
        let achieved = false;
        if (def.kind === 'dayReached') achieved = dayReached >= def.target;
        if (def.kind === 'totalCompletions') achieved = totalCompletions >= def.target;
        if (def.kind === 'streak') achieved = maxStreakAcrossHabits >= def.target;
        if (def.kind === 'level') achieved = projectedLevel >= def.target;
        if (def.kind === 'perfectDay') achieved = perfectDay;
        if (achieved) toUnlock.push(def.id);
      }

      if (toUnlock.length > 0) {
        const merged = [...alreadyUnlocked, ...toUnlock];
        await storage.setUnlockedAchievements(merged);
        setUnlockedAchievements(merged);
        const first = ACHIEVEMENTS.find((a) => a.id === toUnlock[0])!;
        setNewlyUnlocked({ id: first.id, title: first.title, icon: first.icon });

        let nextProfile!: Profile;
        setProfile((prev) => {
          nextProfile = {
            ...prev,
            streakFreezes: Math.min(prev.streakFreezes + toUnlock.length, MAX_STREAK_FREEZES),
          };
          return nextProfile;
        });
        await storage.setProfile(nextProfile);
      }
    },
    []
  );

  const addHabit = useCallback(
    async (name: string, icon: string, color: string) => {
      const newHabit: Habit = {
        id: `h_${Date.now()}`,
        name,
        icon,
        color,
        createdAt: todayKey(),
        archived: false,
      };
      const next = [...habits, newHabit];
      setHabits(next);
      await storage.setHabits(next);

      let nextProfile: Profile | null = null;
      setProfile((prev) => {
        if (prev.challengeStartDate) return prev;
        nextProfile = { ...prev, challengeStartDate: todayKey() };
        return nextProfile;
      });
      if (nextProfile) await storage.setProfile(nextProfile);
    },
    [habits]
  );

  const addHabitsBulk = useCallback(
    async (items: { name: string; icon: string; color: string }[]) => {
      const created: Habit[] = items.map((item, i) => ({
        id: `h_${Date.now()}_${i}`,
        name: item.name,
        icon: item.icon,
        color: item.color,
        createdAt: todayKey(),
        archived: false,
      }));
      const next = [...habits, ...created];
      setHabits(next);
      await storage.setHabits(next);

      let nextProfile: Profile | null = null;
      setProfile((prev) => {
        if (prev.challengeStartDate) return prev;
        nextProfile = { ...prev, challengeStartDate: todayKey() };
        return nextProfile;
      });
      if (nextProfile) await storage.setProfile(nextProfile);
    },
    [habits]
  );

  const updateHabit = useCallback(
    async (id: string, patch: Partial<Habit>) => {
      const next = habits.map((h) => (h.id === id ? { ...h, ...patch } : h));
      setHabits(next);
      await storage.setHabits(next);
    },
    [habits]
  );

  const removeHabit = useCallback(
    async (id: string) => {
      const next = habits.filter((h) => h.id !== id);
      setHabits(next);
      await storage.setHabits(next);
    },
    [habits]
  );

  const toggleCompletion = useCallback(
    async (habitId: string, dateKey: string = todayKey()) => {
      const existingIndex = completions.findIndex((c) => c.habitId === habitId && c.date === dateKey);
      let next: HabitCompletion[];
      if (existingIndex >= 0) {
        next = completions.map((c, i) => (i === existingIndex ? { ...c, completed: !c.completed } : c));
      } else {
        next = [...completions, { habitId, date: dateKey, completed: true }];
      }
      setCompletions(next);
      await storage.setCompletions(next);
      await evaluateAchievements(next, habits, profile.challengeStartDate, profile);
    },
    [completions, habits, profile, evaluateAchievements]
  );

  const setPhotoForToday = useCallback(
    async (habitId: string, uri: string) => {
      const dateKey = todayKey();
      const existingIndex = completions.findIndex((c) => c.habitId === habitId && c.date === dateKey);
      let next: HabitCompletion[];
      if (existingIndex >= 0) {
        next = completions.map((c, i) => (i === existingIndex ? { ...c, photoUri: uri } : c));
      } else {
        next = [...completions, { habitId, date: dateKey, completed: false, photoUri: uri }];
      }
      setCompletions(next);
      await storage.setCompletions(next);
    },
    [completions]
  );

  const setSessionForToday = useCallback(
    async (habitId: string, session: string) => {
      const dateKey = todayKey();
      const existingIndex = completions.findIndex((c) => c.habitId === habitId && c.date === dateKey);
      let next: HabitCompletion[];
      if (existingIndex >= 0) {
        next = completions.map((c, i) => (i === existingIndex ? { ...c, session } : c));
      } else {
        next = [...completions, { habitId, date: dateKey, completed: false, session }];
      }
      setCompletions(next);
      await storage.setCompletions(next);
    },
    [completions]
  );

  const logMetric = useCallback(
    async (key: string, value: number) => {
      const dateKey = todayKey();
      const existingIndex = metrics.findIndex((m) => m.key === key && m.date === dateKey);
      let next: MetricEntry[];
      if (existingIndex >= 0) {
        next = metrics.map((m, i) => (i === existingIndex ? { ...m, value } : m));
      } else {
        next = [...metrics, { key, date: dateKey, value }];
      }
      next.sort((a, b) => (a.date < b.date ? -1 : 1));
      setMetrics(next);
      await storage.setMetrics(next);
    },
    [metrics]
  );

  const getMetricHistory = useCallback((key: string) => metrics.filter((m) => m.key === key), [metrics]);

  const getLatestMetric = useCallback(
    (key: string) => {
      const entries = metrics.filter((m) => m.key === key);
      return entries.length > 0 ? entries[entries.length - 1].value : undefined;
    },
    [metrics]
  );

  // One entry per habit per day, same overwrite-if-exists shape as
  // logMetric — writing today's entry again (e.g. editing after the AI
  // prompt already loaded) replaces it rather than duplicating.
  const saveJournalEntry = useCallback(
    async (habitId: string, prompt: string, text: string) => {
      const dateKey = todayKey();
      const existingIndex = journal.findIndex((j) => j.habitId === habitId && j.date === dateKey);
      let next: JournalEntry[];
      if (existingIndex >= 0) {
        next = journal.map((j, i) => (i === existingIndex ? { ...j, prompt, text } : j));
      } else {
        next = [...journal, { habitId, date: dateKey, prompt, text }];
      }
      next.sort((a, b) => (a.date < b.date ? -1 : 1));
      setJournal(next);
      await storage.setJournal(next);
    },
    [journal]
  );

  const getJournalEntries = useCallback((habitId: string) => journal.filter((j) => j.habitId === habitId), [journal]);

  const getTodayJournalEntry = useCallback(
    (habitId: string) => journal.find((j) => j.habitId === habitId && j.date === todayKey()),
    [journal]
  );

  const canUseStreakFreeze = useCallback(
    (habitId: string) => {
      if (profile.streakFreezes <= 0) return false;
      const yesterday = addDays(todayKey(), -1);
      const twoDaysAgo = addDays(todayKey(), -2);
      return !isCompleted(habitId, yesterday) && isCompleted(habitId, twoDaysAgo);
    },
    [profile.streakFreezes, isCompleted]
  );

  const useStreakFreeze = useCallback(
    async (habitId: string) => {
      if (!canUseStreakFreeze(habitId)) return false;
      const yesterday = addDays(todayKey(), -1);
      const existingIndex = completions.findIndex((c) => c.habitId === habitId && c.date === yesterday);
      let next: HabitCompletion[];
      if (existingIndex >= 0) {
        next = completions.map((c, i) => (i === existingIndex ? { ...c, completed: true, frozen: true } : c));
      } else {
        next = [...completions, { habitId, date: yesterday, completed: true, frozen: true }];
      }
      setCompletions(next);
      await storage.setCompletions(next);

      let nextProfile!: Profile;
      setProfile((prev) => {
        nextProfile = { ...prev, streakFreezes: prev.streakFreezes - 1 };
        return nextProfile;
      });
      await storage.setProfile(nextProfile);
      return true;
    },
    [canUseStreakFreeze, completions]
  );

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    // Reads the latest profile via the functional updater rather than the
    // closure's `profile` — two profile writes fired back-to-back (e.g.
    // addHabit's challengeStartDate immediately followed by this from
    // MorningCheckIn) would otherwise race: the second call could still see
    // the pre-update `profile` and silently overwrite the first change.
    let next!: Profile;
    setProfile((prev) => {
      next = { ...prev, ...patch };
      return next;
    });
    await storage.setProfile(next);
  }, []);

  const exportData = useCallback(() => storage.exportAll(), []);

  const importData = useCallback(async (json: string) => {
    await storage.importAll(json);
    const [h, c, p, a, m, j] = await Promise.all([
      storage.getHabits(),
      storage.getCompletions(),
      storage.getProfile(),
      storage.getUnlockedAchievements(),
      storage.getMetrics(),
      storage.getJournal(),
    ]);
    setHabits(h);
    setCompletions(c);
    setProfile(p);
    setUnlockedAchievements(a);
    setMetrics(m);
    setJournal(j);
  }, []);

  const clearNewlyUnlocked = useCallback(() => setNewlyUnlocked(null), []);
  const showToast = useCallback((icon: string, message: string) => setToast({ icon, message }), []);
  const clearToast = useCallback(() => setToast(null), []);

  // Real OS-level scheduled push notifications aren't achievable from a
  // static web app with no backend (expo-notifications doesn't support
  // scheduled triggers on web). Instead of a reminder toggle that silently
  // does nothing, this nudges honestly whenever the app is actually open
  // (on load, and whenever the tab/PWA regains focus) past the chosen time,
  // once per day.
  useEffect(() => {
    if (loading || !profile.reminderEnabled) return;
    const activeHabits = habits.filter((h) => !h.archived);
    if (activeHabits.length === 0 || todayProgress >= 1) return;
    if (profile.lastReminderShownDate === todayKey()) return;

    const check = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const reminderMinutes = profile.reminderHour * 60 + profile.reminderMinute;
      if (nowMinutes < reminderMinutes) return;
      showToast('alarm', "N'oublie pas de cocher tes habitudes aujourd'hui !");
      updateProfile({ lastReminderShownDate: todayKey() });
    };

    check();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onVisible = () => {
        if (document.visibilityState === 'visible') check();
      };
      document.addEventListener('visibilitychange', onVisible);
      return () => document.removeEventListener('visibilitychange', onVisible);
    }
  }, [loading, profile.reminderEnabled, profile.reminderHour, profile.reminderMinute, profile.lastReminderShownDate, habits, todayProgress]);

  // Keeps the iOS home screen widget in sync — it reads from a shared App
  // Group container it can't compute itself, so the RN app pushes fresh
  // numbers into it (and asks WidgetKit to redraw) on every change.
  useEffect(() => {
    if (loading) return;
    const activeHabits = habits.filter((h) => !h.archived);
    syncWidget({
      currentDay: Math.max(currentDay, activeHabits.length ? 1 : 0),
      totalDays: TOTAL_DAYS,
      doneCount: activeHabits.filter((h) => isCompleted(h.id)).length,
      totalCount: activeHabits.length,
      progress: todayProgress,
    });
  }, [loading, currentDay, todayProgress, habits, isCompleted]);

  // Live Activity (lock screen + Dynamic Island) — same numbers as the
  // widget, pushed through ActivityKit instead of a shared UserDefaults
  // container, so it updates the moment a habit is toggled rather than
  // waiting for the next home-screen widget refresh.
  useEffect(() => {
    if (loading) return;
    const activeHabits = habits.filter((h) => !h.archived);
    const streak = activeHabits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0);
    syncLiveActivity({
      currentDay: Math.max(currentDay, activeHabits.length ? 1 : 0),
      totalDays: TOTAL_DAYS,
      doneCount: activeHabits.filter((h) => isCompleted(h.id)).length,
      totalCount: activeHabits.length,
      progress: todayProgress,
      streak,
    });
  }, [loading, currentDay, todayProgress, habits, isCompleted, getStreak]);

  const value: AppContextValue = {
    loading,
    habits,
    completions,
    profile,
    unlockedAchievements,
    currentDay,
    todayProgress,
    totalXP,
    levelInfo,
    useStreakFreeze,
    canUseStreakFreeze,
    newlyUnlocked,
    clearNewlyUnlocked,
    toast,
    showToast,
    clearToast,
    addHabit,
    addHabitsBulk,
    updateHabit,
    removeHabit,
    toggleCompletion,
    setPhotoForToday,
    setSessionForToday,
    metrics,
    logMetric,
    getMetricHistory,
    getLatestMetric,
    saveJournalEntry,
    getJournalEntries,
    getTodayJournalEntry,
    isCompleted,
    getStreak,
    getLongestStreak,
    getTotalCompletions,
    updateProfile,
    exportData,
    importData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
