import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Habit, HabitCompletion, Profile } from '../types';
import { storage } from '../storage/storage';
import { todayKey, daysBetween, addDays } from '../utils/date';
import { ACHIEVEMENTS } from '../data/achievements';
import { TOTAL_DAYS } from '../theme/theme';
import { getLevelInfo, LevelInfo, XP_PER_COMPLETION, XP_PER_ACHIEVEMENT, MAX_STREAK_FREEZES } from '../utils/gamification';

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
  isCompleted: (habitId: string, dateKey?: string) => boolean;
  getStreak: (habitId: string) => number;
  getLongestStreak: (habitId: string) => number;
  getTotalCompletions: () => number;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
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
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<NewlyUnlocked>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    (async () => {
      const [h, c, p, a] = await Promise.all([
        storage.getHabits(),
        storage.getCompletions(),
        storage.getProfile(),
        storage.getUnlockedAchievements(),
      ]);
      setHabits(h);
      setCompletions(c);
      setProfile(p);
      setUnlockedAchievements(a);
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

        const nextProfile = {
          ...currentProfile,
          streakFreezes: Math.min(currentProfile.streakFreezes + toUnlock.length, MAX_STREAK_FREEZES),
        };
        setProfile(nextProfile);
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
        reminderEnabled: false,
        reminderHour: 8,
        reminderMinute: 0,
        archived: false,
      };
      const next = [...habits, newHabit];
      setHabits(next);
      await storage.setHabits(next);

      if (!profile.challengeStartDate) {
        const nextProfile = { ...profile, challengeStartDate: todayKey() };
        setProfile(nextProfile);
        await storage.setProfile(nextProfile);
      }
    },
    [habits, profile]
  );

  const addHabitsBulk = useCallback(
    async (items: { name: string; icon: string; color: string }[]) => {
      const created: Habit[] = items.map((item, i) => ({
        id: `h_${Date.now()}_${i}`,
        name: item.name,
        icon: item.icon,
        color: item.color,
        createdAt: todayKey(),
        reminderEnabled: false,
        reminderHour: 8,
        reminderMinute: 0,
        archived: false,
      }));
      const next = [...habits, ...created];
      setHabits(next);
      await storage.setHabits(next);

      if (!profile.challengeStartDate) {
        const nextProfile = { ...profile, challengeStartDate: todayKey() };
        setProfile(nextProfile);
        await storage.setProfile(nextProfile);
      }
    },
    [habits, profile]
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

      const nextProfile = { ...profile, streakFreezes: profile.streakFreezes - 1 };
      setProfile(nextProfile);
      await storage.setProfile(nextProfile);
      return true;
    },
    [canUseStreakFreeze, completions, profile]
  );

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      const next = { ...profile, ...patch };
      setProfile(next);
      await storage.setProfile(next);
    },
    [profile]
  );

  const clearNewlyUnlocked = useCallback(() => setNewlyUnlocked(null), []);
  const showToast = useCallback((icon: string, message: string) => setToast({ icon, message }), []);
  const clearToast = useCallback(() => setToast(null), []);

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
    isCompleted,
    getStreak,
    getLongestStreak,
    getTotalCompletions,
    updateProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
