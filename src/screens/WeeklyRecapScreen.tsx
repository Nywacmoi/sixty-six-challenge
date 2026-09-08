import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { RingProgress } from '../components/RingProgress';
import { addDays, todayKey, formatDayLabel } from '../utils/date';

function last7Ending(dateKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(dateKey, -(6 - i)));
}

export default function WeeklyRecapScreen({ navigation }: any) {
  const { habits, isCompleted, getStreak } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const stats = useMemo(() => {
    const thisWeek = last7Ending(todayKey());
    const lastWeek = last7Ending(addDays(todayKey(), -7));

    const countFor = (days: string[]) =>
      activeHabits.reduce((sum, h) => sum + days.filter((d) => isCompleted(h.id, d)).length, 0);

    const totalThisWeek = countFor(thisWeek);
    const totalLastWeek = countFor(lastWeek);

    const perfectDays =
      activeHabits.length === 0 ? 0 : thisWeek.filter((d) => activeHabits.every((h) => isCompleted(h.id, d))).length;

    const perHabit = activeHabits.map((h) => ({
      habit: h,
      count: thisWeek.filter((d) => isCompleted(h.id, d)).length,
    }));
    const best = perHabit.length ? perHabit.reduce((a, b) => (b.count > a.count ? b : a)) : null;
    const weakest =
      perHabit.length > 1 ? perHabit.reduce((a, b) => (b.count < a.count ? b : a)) : null;

    const bestStreak = activeHabits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0);

    const maxPossible = activeHabits.length * 7;
    const rate = maxPossible > 0 ? totalThisWeek / maxPossible : 0;
    const delta = totalThisWeek - totalLastWeek;

    return { thisWeek, totalThisWeek, totalLastWeek, delta, perfectDays, best, weakest, bestStreak, rate, maxPossible };
  }, [activeHabits, isCompleted, getStreak]);

  const insight = useMemo(() => {
    if (activeHabits.length === 0) return 'Ajoute une habitude pour voir ton récap ici la semaine prochaine.';
    if (stats.totalThisWeek === 0) return "Une semaine calme — la prochaine est faite pour repartir.";
    if (stats.perfectDays >= 5) return `${stats.perfectDays} jours parfaits cette semaine, du très solide.`;
    if (stats.delta > 0) return `+${stats.delta} check-ins par rapport à la semaine dernière — ça monte.`;
    if (stats.delta < 0) return "Un peu moins que la semaine dernière, rien de grave, on relance.";
    return "Aussi régulier que la semaine dernière — la constance paie.";
  }, [activeHabits.length, stats]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: topInset + spacing.sm, paddingBottom: spacing.xxl }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={typography.display}>Ta semaine</Text>
            <Text style={typography.caption}>
              {formatDayLabel(stats.thisWeek[0])} → {formatDayLabel(stats.thisWeek[6])}
            </Text>
          </View>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.ringSection}>
          <RingProgress progress={stats.rate} size={160} strokeWidth={14}>
            <Text style={[typography.display, { fontSize: 34 }]}>{Math.round(stats.rate * 100)}%</Text>
            <Text style={typography.caption}>de tes habitudes</Text>
          </RingProgress>
        </View>

        <View style={styles.insightCard}>
          <Ionicons name="sparkles" size={18} color={colors.accent} />
          <Text style={[typography.body, { flex: 1 }]}>{insight}</Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={typography.h1}>{stats.totalThisWeek}</Text>
            <Text style={typography.caption}>Check-ins</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={typography.h1}>{stats.perfectDays}/7</Text>
            <Text style={typography.caption}>Jours parfaits</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="flame" size={18} color={colors.accent} />
              <Text style={typography.h1}>{stats.bestStreak}</Text>
            </View>
            <Text style={typography.caption}>Meilleure série</Text>
          </View>
        </View>

        {stats.totalLastWeek > 0 && (
          <View style={styles.deltaRow}>
            <Ionicons
              name={stats.delta > 0 ? 'trending-up' : stats.delta < 0 ? 'trending-down' : 'remove'}
              size={16}
              color={stats.delta > 0 ? colors.success : stats.delta < 0 ? colors.danger : colors.textSecondary}
            />
            <Text style={typography.caption}>
              {stats.delta > 0 ? '+' : ''}
              {stats.delta} par rapport à la semaine dernière ({stats.totalLastWeek} check-ins)
            </Text>
          </View>
        )}

        {stats.best && stats.best.count > 0 && (
          <>
            <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>Habitude la plus régulière</Text>
            <View style={styles.habitCard}>
              <View style={[styles.iconWrap, { backgroundColor: stats.best.habit.color + '26' }]}>
                <Text style={styles.emoji}>{stats.best.habit.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{stats.best.habit.name}</Text>
                <Text style={typography.caption}>
                  {stats.best.count} jour{stats.best.count > 1 ? 's' : ''} sur 7
                </Text>
              </View>
              <Ionicons name="trophy" size={20} color={colors.gold} />
            </View>
          </>
        )}

        {stats.weakest && stats.weakest.habit.id !== stats.best?.habit.id && (
          <>
            <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.sm }]}>À travailler la semaine prochaine</Text>
            <View style={styles.habitCard}>
              <View style={[styles.iconWrap, { backgroundColor: stats.weakest.habit.color + '26' }]}>
                <Text style={styles.emoji}>{stats.weakest.habit.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={typography.bodyBold}>{stats.weakest.habit.name}</Text>
                <Text style={typography.caption}>
                  {stats.weakest.count} jour{stats.weakest.count > 1 ? 's' : ''} sur 7
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'flex-start' },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringSection: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.lg },
    insightCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accent + '14',
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    summaryRow: { flexDirection: 'row', gap: spacing.sm },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, justifyContent: 'center' },
    habitCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 18 },
  });
}
