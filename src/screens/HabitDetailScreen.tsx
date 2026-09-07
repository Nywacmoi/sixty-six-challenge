import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable, Image, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, TOTAL_DAYS, ThemeColors, Typography } from '../theme/theme';
import { addDays, todayKey, formatDayLabel } from '../utils/date';
import { useConfirm } from '../context/ConfirmContext';
import { useTopInset } from '../hooks/useTopInset';
import { Toast } from '../components/Toast';
import { ExerciseAnimation } from '../components/ExerciseAnimation';
import { WORKOUT_SPLITS } from '../data/workoutSplits';

function openExerciseVideo(name: string) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} technique musculation`)}`;
  Linking.openURL(url);
}

const SPORT_ICONS = ['🏋️', '💪', '🏃', '🚴', '⚡'];
function isSportHabit(name: string, icon: string) {
  return SPORT_ICONS.includes(icon) || /sport|muscu|gym|fitness|salle/i.test(name);
}

export default function HabitDetailScreen({ route, navigation }: any) {
  const { habitId } = route.params;
  const {
    habits,
    profile,
    isCompleted,
    getStreak,
    getLongestStreak,
    removeHabit,
    updateHabit,
    setPhotoForToday,
    setSessionForToday,
    completions,
    canUseStreakFreeze,
    useStreakFreeze,
    showToast,
    toast,
    clearToast,
  } = useApp();
  const { confirmAction, notify } = useConfirm();
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const habit = habits.find((h) => h.id === habitId);
  const [photoUri, setPhotoUri] = useState<string | undefined>(
    completions.find((c) => c.habitId === habitId && c.date === todayKey())?.photoUri
  );
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(habit?.name ?? '');
  const [selectedSplit, setSelectedSplit] = useState<string | undefined>(
    completions.find((c) => c.habitId === habitId && c.date === todayKey())?.session
  );

  const startDate = profile.challengeStartDate ?? habit?.createdAt ?? todayKey();

  const days = useMemo(() => {
    return Array.from({ length: TOTAL_DAYS }, (_, i) => {
      const date = addDays(startDate, i);
      return { date, done: isCompleted(habitId, date), isFuture: date > todayKey() };
    });
  }, [startDate, habitId, completions]);

  if (!habit) return null;

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify('Permission requise', "Autorise l'accès aux photos pour capturer ta progression.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      await setPhotoForToday(habitId, result.assets[0].uri);
    }
  };

  const confirmDelete = () => {
    confirmAction('Supprimer l\'habitude', `Supprimer "${habit.name}" et tout son historique ?`, 'Supprimer', async () => {
      await removeHabit(habitId);
      navigation.goBack();
    });
  };

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== habit.name) {
      await updateHabit(habitId, { name: trimmed });
    } else {
      setNameDraft(habit.name);
    }
    setEditingName(false);
  };

  const handleUseFreeze = async () => {
    const ok = await useStreakFreeze(habitId);
    if (ok) {
      showToast('🧊', 'Streak freeze utilisé, ta série est sauvée !');
    }
  };

  const handleSelectSplit = async (splitId: string) => {
    setSelectedSplit(splitId);
    await setSessionForToday(habitId, splitId);
  };

  const activeSplit = WORKOUT_SPLITS.find((s) => s.id === selectedSplit);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: topInset + spacing.sm, paddingBottom: spacing.xxl }}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Pressable onPress={confirmDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <View style={[styles.iconWrap, { backgroundColor: habit.color + '26' }]}>
            <Text style={styles.emoji}>{habit.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {editingName ? (
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                onSubmitEditing={saveName}
                onBlur={saveName}
                autoFocus
                selectTextOnFocus
                style={styles.nameInput}
              />
            ) : (
              <Pressable
                onPress={() => {
                  setNameDraft(habit.name);
                  setEditingName(true);
                }}
                style={styles.nameRow}
                hitSlop={6}
              >
                <Text style={typography.h1} numberOfLines={1}>{habit.name}</Text>
                <Ionicons name="pencil" size={16} color={colors.textSecondary} />
              </Pressable>
            )}
            <Text style={typography.caption}>Débutée le {formatDayLabel(habit.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={20} color={colors.accent} />
            <Text style={typography.h1}>{getStreak(habitId)}</Text>
            <Text style={typography.caption}>Série actuelle</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={20} color={colors.gold} />
            <Text style={typography.h1}>{getLongestStreak(habitId)}</Text>
            <Text style={typography.caption}>Meilleure série</Text>
          </View>
        </View>

        {canUseStreakFreeze(habitId) && (
          <Pressable style={styles.freezeBanner} onPress={handleUseFreeze}>
            <Text style={styles.freezeEmoji}>🧊</Text>
            <View style={{ flex: 1 }}>
              <Text style={typography.bodyBold}>Série en danger !</Text>
              <Text style={typography.caption}>Utilise un streak freeze pour la sauver ({profile.streakFreezes} disponible{profile.streakFreezes > 1 ? 's' : ''})</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </Pressable>
        )}

        {isSportHabit(habit.name, habit.icon) && (
          <>
            <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Séance du jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {WORKOUT_SPLITS.map((split) => {
                const active = selectedSplit === split.id;
                return (
                  <Pressable
                    key={split.id}
                    onPress={() => handleSelectSplit(split.id)}
                    style={[styles.splitChip, active && { backgroundColor: colors.accent + '1F', borderColor: colors.accent }]}
                  >
                    <Text style={{ fontSize: 16 }}>{split.emoji}</Text>
                    <Text style={[typography.bodyBold, active && { color: colors.accent }]}>{split.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {activeSplit && (
              <View style={styles.splitCard}>
                {activeSplit.exercises.map((ex) => (
                  <View key={ex.name} style={styles.exerciseRow}>
                    <ExerciseAnimation pattern={ex.pattern} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text style={typography.bodyBold}>{ex.name}</Text>
                      <Text style={typography.caption}>{ex.reps}</Text>
                    </View>
                    <Pressable onPress={() => openExerciseVideo(ex.name)} hitSlop={8} style={styles.videoBtn}>
                      <Ionicons name="logo-youtube" size={22} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Parcours de {TOTAL_DAYS} jours</Text>
        <View style={styles.grid}>
          {days.map((d) => (
            <View
              key={d.date}
              style={[
                styles.dayCell,
                d.done && { backgroundColor: habit.color },
                d.date === todayKey() && styles.dayCellToday,
              ]}
            />
          ))}
        </View>

        <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Photo de progression</Text>
        <Pressable style={styles.photoBox} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={colors.textTertiary} />
              <Text style={typography.caption}>Ajouter la photo du jour</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.reminderRow}>
          <View>
            <Text style={typography.bodyBold}>Rappel quotidien</Text>
            <Text style={typography.caption}>Sois notifié pour faire ton check-in</Text>
          </View>
          <Switch value={habit.reminderEnabled} disabled trackColor={{ true: colors.accent }} />
        </View>
      </ScrollView>
      {toast && <Toast icon={toast.icon} message={toast.message} accentColor={colors.accent} onDismiss={clearToast} />}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
    iconWrap: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 26 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nameInput: {
      ...typography.h1,
      padding: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'flex-start',
      gap: 4,
    },
    freezeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: '#4E9BFF14',
      borderWidth: 1,
      borderColor: '#4E9BFF44',
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    freezeEmoji: { fontSize: 26 },
    splitChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
    },
    splitCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.sm,
      padding: spacing.xs,
    },
    videoBtn: { padding: spacing.xs },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    dayCell: {
      width: 22,
      height: 22,
      borderRadius: 5,
      backgroundColor: colors.surfaceElevated,
    },
    dayCellToday: { borderWidth: 2, borderColor: colors.text },
    photoBox: {
      height: 180,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    photo: { width: '100%', height: '100%' },
    photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
  });
}
