export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  archived: boolean;
  // What one day of NOT doing this habit is worth to the person — money for
  // a quitting habit (arrêter de fumer, réduire l'alcool), minutes for a
  // screen-time habit. Unit depends on the category (see habitCategories.ts).
  // Set by the person themselves via the savings counter, not a default.
  savedPerDay?: number;
};

export type HabitCompletion = {
  habitId: string;
  date: string;
  completed: boolean;
  photoUri?: string;
  frozen?: boolean;
  session?: string;
};

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  kind: 'streak' | 'totalCompletions' | 'dayReached' | 'level' | 'perfectDay';
};

export type Profile = {
  name: string;
  avatarColor: string;
  challengeStartDate: string | null;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  onboardingCompleted: boolean;
  goal: string | null;
  streakFreezes: number;
  heightCm: number | null;
  goalWeightKg: number | null;
  lastReminderShownDate: string | null;
  sportGoal: string | null;
  sportLevel: string | null;
  sportDaysPerWeek: number | null;
  lastCheckInDate: string | null;
  avatarHead: string | null;
  avatarFace: string | null;
  avatarOutfit: string | null;
  avatarLegs: string | null;
  avatarFeet: string | null;
  foodPreference: 'omnivore' | 'vegetarien' | 'vegan' | null;
};

export type MetricEntry = {
  key: string;
  date: string;
  value: number;
};
