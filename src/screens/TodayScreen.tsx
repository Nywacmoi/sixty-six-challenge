import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
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
import { useConfirm } from '../context/ConfirmContext';
import { useTopInset } from '../hooks/useTopInset';

export default function TodayScreen({ navigation }: any) {
  const { habits, currentDay, todayProgress, isCompleted, getStreak, getLongestStreak, profile, toggleCompletion, removeHabit, newlyUnlocked, clearNewlyUnlocked, toast, clearToast } = useApp();
  const { confirmAction } = useConfirm();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const activeHabits = habits.filter((h) => !h.archived);
  const topInset = useTopInset();
  const bestStreak = activeHabits.reduce((max, h) => Math.max(max, getLongestStreak(h.id)), 0);
  const currentStreak = activeHabits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={[styles.header, { paddingTop: topInset + spacing.sm }]}>
        <View>
          <Text style={typography.caption}>JOUR {Math.max(currentDay, activeHabits.length ? 1 : 0)} SUR {TOTAL_DAYS}</Text>
          <Text style={typography.display}>Aujourd'hui</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => navigation.navigate('AddHabit')}>
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {activeHabits.length > 0 && (
        <>
          <TodayDashboard
            doneCount={activeHabits.filter((h) => isCompleted(h.id)).length}
            totalCount={activeHabits.length}
            bestStreak={bestStreak}
            currentStreak={currentStreak}
            streakFreezes={profile.streakFreezes}
            done={todayProgress >= 1}
          />
          {todayProgress >= 1 && (
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
              <ShareDayCta day={currentDay} onPress={() => navigation.navigate('Social')} />
            </View>
          )}
        </>
      )}

      {activeHabits.length === 0 ? (
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
      ) : (
        <FlatList
          data={activeHabits}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <HabitRow
              habit={item}
              completed={isCompleted(item.id)}
              streak={getStreak(item.id)}
              onToggle={() => toggleCompletion(item.id)}
              onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
              onDelete={() =>
                confirmAction(
                  "Supprimer l'habitude",
                  `Supprimer "${item.name}" et tout son historique ?`,
                  'Supprimer',
                  () => removeHabit(item.id)
                )
              }
            />
          )}
        />
      )}

      {toast && <Toast icon={toast.icon} message={toast.message} accentColor={colors.success} onDismiss={clearToast} />}
      {!toast && newlyUnlocked && <AchievementToast achievement={newlyUnlocked} onDismiss={clearNewlyUnlocked} />}
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
