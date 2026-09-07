import * as Notifications from 'expo-notifications';

const REMINDER_ID_KEY = 'daily-reminder';

export async function scheduleDailyReminder(hour: number, minute: number) {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID_KEY).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID_KEY,
    content: {
      title: 'Ne casse pas ta série',
      body: "Coche tes habitudes du jour avant qu'il ne soit trop tard.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID_KEY).catch(() => {});
}
