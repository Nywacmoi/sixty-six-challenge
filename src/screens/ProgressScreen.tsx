import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, TOTAL_DAYS, radius, ThemeColors, Typography } from '../theme/theme';
import { RingProgress } from '../components/RingProgress';
import { useTopInset } from '../hooks/useTopInset';
import { useTabBarClearance } from '../hooks/useTabBarClearance';

export default function ProgressScreen({ navigation }: any) {
  const { habits, currentDay, getStreak, getLongestStreak, getTotalCompletions } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const activeHabits = habits.filter((h) => !h.archived);
  const overallProgress = currentDay / TOTAL_DAYS;
  const topInset = useTopInset();
  const tabBarClearance = useTabBarClearance();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: topInset + spacing.sm, paddingBottom: spacing.xxl + tabBarClearance }}>
        <Text style={typography.display}>Progression</Text>

        <Pressable style={styles.recapCard} onPress={() => navigation.navigate('WeeklyRecap')}>
          <View style={styles.recapIcon}>
            <Ionicons name="sparkles" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={typography.bodyBold}>Ton récap de la semaine</Text>
            <Text style={typography.caption}>Check-ins, jours parfaits, meilleure habitude…</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        </Pressable>

        <View style={styles.ringSection}>
          <RingProgress progress={overallProgress} size={160} strokeWidth={14}>
            <Text style={[typography.display, { fontSize: 40 }]}>{currentDay}</Text>
            <Text style={typography.caption}>sur {TOTAL_DAYS} jours</Text>
          </RingProgress>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={typography.h1}>{getTotalCompletions()}</Text>
            <Text style={typography.caption}>Check-ins au total</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={typography.h1}>{activeHabits.length}</Text>
            <Text style={typography.caption}>Habitudes actives</Text>
          </View>
        </View>

        <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Par habitude</Text>
        {activeHabits.length === 0 && <Text style={typography.caption}>Ajoute une habitude pour voir sa progression ici.</Text>}
        {activeHabits.map((h) => (
          <View key={h.id} style={styles.habitCard}>
            <View style={[styles.iconWrap, { backgroundColor: h.color + '26' }]}>
              <Ionicons name={h.icon as any} size={18} color={h.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>{h.name}</Text>
              <Text style={typography.caption}>Meilleure série : {getLongestStreak(h.id)} jour{getLongestStreak(h.id) > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.streakPill}>
              <Ionicons name="flame" size={14} color={colors.accent} />
              <Text style={[typography.bodyBold, { color: colors.accent }]}>{getStreak(h.id)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    recapCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    recapIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: colors.accent + '1F',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringSection: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.lg },
    summaryRow: { flexDirection: 'row', gap: spacing.md },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
      gap: 4,
    },
    habitCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    iconWrap: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  });
}
