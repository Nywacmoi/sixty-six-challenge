export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  archived: boolean;
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
};

export type FeedPost = {
  id: string;
  userName: string;
  avatarColor: string;
  habitName: string;
  message: string;
  timeAgo: string;
  likes: number;
  streak: number;
};

export type Squad = {
  id: string;
  name: string;
  emoji: string;
  memberCount: number;
  members: { name: string; avatarColor: string; streak: number }[];
};
