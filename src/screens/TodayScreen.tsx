import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, TOTAL_DAYS, radius, ThemeColors, Typography } from '../theme/theme';
import { HabitRow } from '../components/HabitRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { AchievementToast } from '../components/AchievementToast';
import { Toast } from '../components/Toast';
import { TodayDashboard } from '../components/TodayDashboard';
import { ShareDayCta } from '../components/ShareDayCta';
import { InsightBanner } from '../components/InsightBanner';
import { PerfectDayCelebration } from '../components/PerfectDayCelebration';
import { useTopInset } from '../hooks/useTopInset';
import { useTabBarClearance } from '../hooks/useTabBarClearance';

export default function TodayScreen({ navigation }: any) {
  const { habits, currentDay, todayProgress, isCompleted, getStreak, getLongestStreak, profile, toggleCompletion, removeHabit, newlyUnlocked, clearNewlyUnlocked, toast, clearToast, levelInfo } = useApp();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const activeHabits = habits.filter((h) => !h.archived);
  const topInset = useTopInset();
  const tabBarClearance = useTabBarClearance();
  const bestStreak = activeHabits.reduce((max, h) => Math.max(max, getLongestStreak(h.id)), 0);
  const currentStreak = activeHabits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0);

  const [celebrating, setCelebrating] = useState(false);
  const wasCompleteRef = useRef(todayProgress >= 1);
  useEffect(() => {
    const isComplete = todayProgress >= 1;
    if (isComplete && !wasCompleteRef.current && activeHabits.length > 0) {
      setCelebrating(true);
      const timer = setTimeout(() => setCelebrating(false), 3000);
      wasCompleteRef.current = true;
      return () => clearTimeout(timer);
    }
    wasCompleteRef.current = isComplete;
  }, [todayProgress, activeHabits.length]);

  const topStreakHabit = activeHabits.reduce<{ id: string; name: string; streak: number } | null>((best, h) => {
    const s = getStreak(h.id);
    return s > 0 && (!best || s > best.streak) ? { id: h.id, name: h.name, streak: s } : best;
  }, null);
  let insightText: string | null = null;
  if (topStreakHabit) {
    const record = getLongestStreak(topStreakHabit.id);
    const plural = topStreakHabit.streak > 1 ? 's' : '';
    insightText =
      topStreakHabit.streak >= record
        ? `${topStreakHabit.streak} jour${plural} d'affilée sur "${topStreakHabit.name}" — c'est ton record, continue.`
        : `${topStreakHabit.streak} jour${plural} d'affilée sur "${topStreakHabit.name}" — plus que ${record - topStreakHabit.streak} pour battre ton record.`;
  }

  const header = (
    <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
      <View>
        <Text style={typography.caption}>JOUR {Math.max(currentDay, activeHabits.length ? 1 : 0)} SUR {TOTAL_DAYS}</Text>
        <Text style={typography.display}>Aujourd'hui</Text>
      </View>
      <Pressable
        style={styles.addBtn}
        onPress={() => navigation.navigate('AddHabit')}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une habitude"
      >
        <Ionicons name="add" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {activeHabits.length === 0 ? (
        <>
          {header}
          <View style={styles.empty}>
            <Ionicons name="flame-outline" size={48} color={colors.textTertiary} />
            <Text style={[typography.h2, { marginTop: spacing.md, textAlign: 'center' }]}>Construis de la discipline, pas des habitudes</Text>
            <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.xs }]}>
              Ajoute ta première habitude et commence ta transformation de {TOTAL_DAYS} jours.
            </Text>
            <PrimaryButton label="Ajouter ma première habitude" onPress={() => navigation.navigate('AddHabit')} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl }} />
            <Pressable onPress={() => navigation.navigate('AddHabit', { initialTab: 'template' })} style={{ marginTop: spacing.md }}>
              <Text style={[typography.bodyBold, { color: colors.accent }]}>Ou découvrir des modèles de routine</Text>
            </Pressable>
          </View>
        </>
      ) : (
        // Everything — header included — scrolls together as one page instead
        // of pinning the dashboard card in place above a separately-scrolling
        // list: that split made the screen feel like two stacked widgets
        // rather than one continuous view, especially once the card grows
        // tall (e.g. on a perfect day).
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl + tabBarClearance }}>
          {header}
          <TodayDashboard
            doneCount={activeHabits.filter((h) => isCompleted(h.id)).length}
            totalCount={activeHabits.length}
            bestStreak={bestStreak}
            currentStreak={currentStreak}
            streakFreezes={profile.streakFreezes}
            done={todayProgress >= 1}
            levelInfo={levelInfo}
          />
          {insightText && <InsightBanner text={insightText} />}
          {todayProgress >= 1 && (
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
              <ShareDayCta day={Math.max(currentDay, 1)} onPress={() => navigation.navigate('WeeklyRecap')} />
            </View>
          )}
          <View style={{ padding: spacing.lg }}>
            {activeHabits.map((item) => (
              <HabitRow
                key={item.id}
                habit={item}
                completed={isCompleted(item.id)}
                streak={getStreak(item.id)}
                onToggle={() => toggleCompletion(item.id)}
                onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
                onDelete={() => removeHabit(item.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      {toast && <Toast icon={toast.icon} message={toast.message} accentColor={colors.success} onDismiss={clearToast} />}
      {!toast && newlyUnlocked && <AchievementToast achievement={newlyUnlocked} onDismiss={clearNewlyUnlocked} />}
      <PerfectDayCelebration visible={celebrating} day={Math.max(currentDay, 1)} />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
    },
  });
}
