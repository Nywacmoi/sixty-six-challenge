import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors, Typography } from '../theme/theme';

function getRemaining() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  const diff = Math.max(0, midnight.getTime() - now.getTime());
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

const DAY_LABELS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

// A dashboard-style readout card — inspired by a reference the user shared
// (monospace numbers, day/date header, best-vs-current stats, a progress
// pill) — reinterpreted with this app's own data (streaks, not a fake
// appearance score) and kept as an addition to, not a replacement of, the
// app's Anton/Poppins identity elsewhere.
export function TodayDashboard({
  doneCount,
  totalCount,
  bestStreak,
  currentStreak,
  streakFreezes,
  done,
}: {
  doneCount: number;
  totalCount: number;
  bestStreak: number;
  currentStreak: number;
  streakFreezes: number;
  done: boolean;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [remaining, setRemaining] = useState(getRemaining());
  const now = new Date();

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(interval);
  }, [done]);

  const urgent = !done && remaining.hours < 2;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.dateLabel}>
          {DAY_LABELS[now.getDay()]} {now.getDate()}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>MEILLEURE</Text>
            <Text style={styles.statValue}>{bestStreak}</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>ACTUELLE</Text>
            <Text style={styles.statValue}>{currentStreak}</Text>
          </View>
        </View>
      </View>

      {done ? (
        <View style={styles.timeRow}>
          <Ionicons name="checkmark-circle" size={30} color={colors.success} />
          <Text style={[styles.time, { color: colors.success }]}>Terminé</Text>
        </View>
      ) : (
        <Text style={[styles.time, urgent && { color: colors.danger }]}>
          {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
        </Text>
      )}

      <View style={styles.progressPill}>
        <Text style={styles.progressText}>
          {doneCount}/{totalCount}
        </Text>
      </View>

      {streakFreezes > 0 && (
        <View style={styles.shieldRow}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.shieldText}>
            {streakFreezes} bouclier{streakFreezes > 1 ? 's' : ''} restant{streakFreezes > 1 ? 's' : ''} ce mois-ci
          </Text>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    dateLabel: {
      fontFamily: fonts.mono,
      fontSize: 13,
      color: colors.textSecondary,
      textTransform: 'capitalize',
      marginTop: 6,
    },
    statsRow: { flexDirection: 'row', gap: spacing.lg },
    statBlock: { alignItems: 'flex-end' },
    statLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.textTertiary, letterSpacing: 0.5 },
    statValue: { fontFamily: fonts.monoBold, fontSize: 26, color: colors.text },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    time: {
      fontFamily: fonts.monoBold,
      fontSize: 48,
      color: colors.text,
      marginTop: spacing.sm,
      fontVariant: ['tabular-nums'],
    },
    progressPill: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    progressText: { fontFamily: fonts.monoBold, fontSize: 14, color: colors.text },
    shieldRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
    shieldText: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary },
  });
}
