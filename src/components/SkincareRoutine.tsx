import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors } from '../theme/theme';
import { SKINCARE_SESSIONS, SkincareSession } from '../data/skincareRoutine';
import { storage } from '../storage/storage';
import { todayKey } from '../utils/date';
import { AppIcon } from './AppIcon';

type Done = Record<SkincareSession['id'], string[]>;
const EMPTY: Done = { matin: [], soir: [] };

// Today's routine as a checklist, morning or night.
//
// Finishing either routine ticks the habit for the day: "I did my skincare"
// is exactly what the habit measures, and making someone go back to
// Aujourd'hui to say it twice is friction for nothing. Unticking a step
// afterwards doesn't untick the habit — that stays the person's call, from
// the usual checkbox.
//
// Steps live in the dated store the AI insights use: it already resets
// itself each day, and a half-done routine from yesterday is not worth
// backing up.
export function SkincareRoutine({ habitId, color }: { habitId: string; color: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { isCompleted, toggleCompletion } = useApp();
  const cacheKey = `skincare-steps:${habitId}`;

  const hour = new Date().getHours();
  const [sessionId, setSessionId] = useState<SkincareSession['id']>(hour >= 16 ? 'soir' : 'matin');
  const [done, setDone] = useState<Done>(EMPTY);
  const [justFinished, setJustFinished] = useState<string | null>(null);

  useEffect(() => {
    storage.getAiCache<Done>(cacheKey).then((cached) => {
      if (cached && cached.date === todayKey()) setDone({ ...EMPTY, ...cached.value });
    });
  }, [cacheKey]);

  const session = SKINCARE_SESSIONS.find((s) => s.id === sessionId)!;
  const checked = new Set(done[sessionId]);
  const complete = session.steps.every((step) => checked.has(step.id));

  const toggleStep = async (stepId: string) => {
    const nextIds = checked.has(stepId) ? done[sessionId].filter((id) => id !== stepId) : [...done[sessionId], stepId];
    const next = { ...done, [sessionId]: nextIds };
    setDone(next);
    await storage.setAiCache(cacheKey, todayKey(), next);

    const nowComplete = session.steps.every((step) => nextIds.includes(step.id));
    if (nowComplete && !complete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (!isCompleted(habitId)) {
        await toggleCompletion(habitId);
        setJustFinished(`Routine du ${session.label.toLowerCase()} faite · habitude cochée pour aujourd’hui`);
      } else {
        setJustFinished(`Routine du ${session.label.toLowerCase()} faite`);
      }
    }
  };

  return (
    <View>
      <View style={styles.tabs}>
        {SKINCARE_SESSIONS.map((s) => {
          const active = s.id === sessionId;
          const count = done[s.id].length;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSessionId(s.id)}
              style={[styles.tab, active && { borderColor: color, backgroundColor: color + '1A' }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <AppIcon name={s.icon} size={16} color={active ? color : colors.textSecondary} />
              <Text style={[styles.tabText, active && { color }]}>{s.label}</Text>
              <Text style={styles.tabCount}>
                {count}/{s.steps.length}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.list}>
        {session.steps.map((step, i) => {
          const on = checked.has(step.id);
          return (
            <Pressable
              key={step.id}
              onPress={() => toggleStep(step.id)}
              style={[styles.step, on && { borderColor: color + '66' }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${step.label} — ${step.hint}`}
            >
              <Text style={[styles.index, on && { color }]}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepLabel, on && { color: colors.textSecondary }]}>{step.label}</Text>
                <Text style={styles.hint}>{step.hint}</Text>
              </View>
              <View style={[styles.box, on && { backgroundColor: color, borderColor: color }]}>
                {on && <Ionicons name="checkmark" size={16} color={colors.background} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {complete && (
        <Text style={[styles.finished, { color }]}>{justFinished ?? `Routine du ${session.label.toLowerCase()} faite`}</Text>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tabs: { flexDirection: 'row', gap: spacing.sm },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    tabText: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
    tabCount: { fontFamily: fonts.medium, fontSize: 12, color: colors.textTertiary },
    list: { gap: spacing.sm, marginTop: spacing.md },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    index: { fontFamily: fonts.display, fontSize: 18, color: colors.textTertiary, width: 18, textAlign: 'center' },
    stepLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
    hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textTertiary, marginTop: 2 },
    box: {
      width: 26,
      height: 26,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    finished: { fontFamily: fonts.semiBold, fontSize: 13, textAlign: 'center', marginTop: spacing.md },
  });
}
