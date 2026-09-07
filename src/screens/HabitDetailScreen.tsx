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
import { BreathingAnimation } from '../components/BreathingAnimation';
import { WORKOUT_SPLITS } from '../data/workoutSplits';
import { MEDITATION_SESSIONS } from '../data/meditationSessions';
import { MEAL_IDEAS } from '../data/mealIdeas';
import { READING_GOALS } from '../data/readingGoals';
import { JAWLINE_SESSIONS } from '../data/jawlineProgram';
import { MeasurementTracker } from '../components/MeasurementTracker';
import { PrimaryButton } from '../components/PrimaryButton';

function openSearch(query: string) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  Linking.openURL(url);
}

const SPORT_ICONS = ['🏋️', '💪', '🏃', '🚴', '⚡'];
function isSportHabit(name: string, icon: string) {
  return SPORT_ICONS.includes(icon) || /sport|muscu|gym|fitness|salle/i.test(name);
}

const MEDITATION_ICONS = ['🙏', '🧘'];
function isMeditationHabit(name: string, icon: string) {
  return MEDITATION_ICONS.includes(icon) || /médit|relax|respiration|calme|mental/i.test(name);
}

const NUTRITION_ICONS = ['🥗', '🍎', '🥦'];
function isNutritionHabit(name: string, icon: string) {
  return NUTRITION_ICONS.includes(icon) || /aliment|nutrition|manger|repas|sucre|cuisine/i.test(name);
}

const READING_ICONS = ['📖'];
function isReadingHabit(name: string, icon: string) {
  return READING_ICONS.includes(icon) || /lecture|lire|livre/i.test(name);
}

const JAWLINE_ICONS = ['👅'];
function isJawlineHabit(name: string, icon: string) {
  return JAWLINE_ICONS.includes(icon) || /jawline|mewing|mâchoire|machoire|menton/i.test(name);
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
    updateProfile,
    getLatestMetric,
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
  const [selectedSession, setSelectedSession] = useState<string | undefined>(
    completions.find((c) => c.habitId === habitId && c.date === todayKey())?.session
  );
  const [editingGoals, setEditingGoals] = useState(false);
  const [heightDraft, setHeightDraft] = useState(profile.heightCm ? String(profile.heightCm) : '');
  const [goalWeightDraft, setGoalWeightDraft] = useState(profile.goalWeightKg ? String(profile.goalWeightKg) : '');

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

  const handleSelectSession = async (sessionId: string) => {
    setSelectedSession(sessionId);
    await setSessionForToday(habitId, sessionId);
  };

  const activeSplit = WORKOUT_SPLITS.find((s) => s.id === selectedSession);
  const activeMeditation = MEDITATION_SESSIONS.find((s) => s.id === selectedSession);
  const activeMeal = MEAL_IDEAS.find((s) => s.id === selectedSession);
  const activeReading = READING_GOALS.find((s) => s.id === selectedSession);
  const activeJawline = JAWLINE_SESSIONS.find((s) => s.id === selectedSession);

  const saveGoals = async () => {
    let height = parseFloat(heightDraft.replace(',', '.'));
    // People naturally type a height like "1,78" or "1.78" (meters) even
    // though the field asks for cm — normalize instead of silently storing
    // a value that would produce a nonsensical BMI.
    if (!Number.isNaN(height) && height > 0 && height < 3) height *= 100;
    const goalWeight = parseFloat(goalWeightDraft.replace(',', '.'));
    await updateProfile({
      heightCm: !Number.isNaN(height) && height > 0 ? Math.round(height) : null,
      goalWeightKg: !Number.isNaN(goalWeight) && goalWeight > 0 ? goalWeight : null,
    });
    setEditingGoals(false);
  };

  const latestWeight = getLatestMetric('weight');
  const bmi =
    latestWeight && profile.heightCm
      ? latestWeight / ((profile.heightCm / 100) * (profile.heightCm / 100))
      : undefined;

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
            <View style={{ marginTop: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={typography.h2}>Suivi corporel</Text>
              <Pressable onPress={() => setEditingGoals((v) => !v)} hitSlop={8}>
                <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {editingGoals && (
              <View style={styles.goalsCard}>
                <View style={styles.goalsRow}>
                  <Text style={[typography.caption, { width: 90 }]}>TAILLE (CM)</Text>
                  <TextInput
                    value={heightDraft}
                    onChangeText={setHeightDraft}
                    keyboardType="decimal-pad"
                    placeholder="175"
                    placeholderTextColor={colors.textTertiary}
                    style={styles.goalsInput}
                  />
                </View>
                <View style={styles.goalsRow}>
                  <Text style={[typography.caption, { width: 90 }]}>OBJECTIF (KG)</Text>
                  <TextInput
                    value={goalWeightDraft}
                    onChangeText={setGoalWeightDraft}
                    keyboardType="decimal-pad"
                    placeholder="70"
                    placeholderTextColor={colors.textTertiary}
                    style={styles.goalsInput}
                  />
                </View>
                <PrimaryButton label="Enregistrer" onPress={saveGoals} style={{ marginTop: spacing.sm }} />
              </View>
            )}

            <MeasurementTracker
              title="Poids"
              subtitle="Progression vers ton objectif"
              icon="body-outline"
              metricKey="weight"
              unit="kg"
              goal={profile.goalWeightKg}
              extraInfo={bmi ? `IMC : ${bmi.toFixed(1)}` : profile.heightCm ? undefined : 'Renseigne ta taille pour voir ton IMC'}
            />

            <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Séance du jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {WORKOUT_SPLITS.map((split) => {
                const active = selectedSession === split.id;
                return (
                  <Pressable
                    key={split.id}
                    onPress={() => handleSelectSession(split.id)}
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
                    <Pressable onPress={() => openSearch(`${ex.name} technique musculation`)} hitSlop={8} style={styles.videoBtn}>
                      <Ionicons name="logo-youtube" size={22} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {isMeditationHabit(habit.name, habit.icon) && (
          <>
            <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Séance du jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {MEDITATION_SESSIONS.map((session) => {
                const active = selectedSession === session.id;
                return (
                  <Pressable
                    key={session.id}
                    onPress={() => handleSelectSession(session.id)}
                    style={[styles.splitChip, active && { backgroundColor: colors.accent + '1F', borderColor: colors.accent }]}
                  >
                    <Text style={{ fontSize: 16 }}>{session.emoji}</Text>
                    <Text style={[typography.bodyBold, active && { color: colors.accent }]}>{session.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {activeMeditation && (
              <View style={styles.splitCard}>
                {activeMeditation.id === 'breathing' && (
                  <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                    <BreathingAnimation />
                  </View>
                )}
                <View style={{ paddingHorizontal: spacing.xs, paddingBottom: spacing.xs }}>
                  <Text style={[typography.caption, { color: colors.accent }]}>{activeMeditation.duration.toUpperCase()}</Text>
                </View>
                {activeMeditation.steps.map((step, i) => (
                  <View key={step} style={styles.exerciseRow}>
                    <Text style={[typography.bodyBold, { color: colors.accent, width: 18 }]}>{i + 1}</Text>
                    <Text style={[typography.body, { flex: 1 }]}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {isNutritionHabit(habit.name, habit.icon) && (
          <>
            <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Idées repas du jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {MEAL_IDEAS.map((meal) => {
                const active = selectedSession === meal.id;
                return (
                  <Pressable
                    key={meal.id}
                    onPress={() => handleSelectSession(meal.id)}
                    style={[styles.splitChip, active && { backgroundColor: colors.accent + '1F', borderColor: colors.accent }]}
                  >
                    <Text style={{ fontSize: 16 }}>{meal.emoji}</Text>
                    <Text style={[typography.bodyBold, active && { color: colors.accent }]}>{meal.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {activeMeal && (
              <View style={styles.splitCard}>
                {activeMeal.ideas.map((idea) => (
                  <View key={idea} style={styles.exerciseRow}>
                    <Ionicons name="restaurant-outline" size={16} color={colors.textSecondary} />
                    <Text style={[typography.body, { flex: 1 }]}>{idea}</Text>
                    <Pressable onPress={() => openSearch(`${idea} recette facile`)} hitSlop={8} style={styles.videoBtn}>
                      <Ionicons name="logo-youtube" size={22} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {isReadingHabit(habit.name, habit.icon) && (
          <>
            <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Objectif du jour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {READING_GOALS.map((goal) => {
                const active = selectedSession === goal.id;
                return (
                  <Pressable
                    key={goal.id}
                    onPress={() => handleSelectSession(goal.id)}
                    style={[styles.splitChip, active && { backgroundColor: colors.accent + '1F', borderColor: colors.accent }]}
                  >
                    <Text style={{ fontSize: 16 }}>{goal.emoji}</Text>
                    <Text style={[typography.bodyBold, active && { color: colors.accent }]}>{goal.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {activeReading && (
              <View style={styles.splitCard}>
                <View style={styles.exerciseRow}>
                  <Ionicons name="bulb-outline" size={16} color={colors.textSecondary} />
                  <Text style={[typography.body, { flex: 1 }]}>{activeReading.tip}</Text>
                </View>
              </View>
            )}
          </>
        )}

        {isJawlineHabit(habit.name, habit.icon) && (
          <>
            <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Bilan jawline</Text>
            <MeasurementTracker
              title="Tour de mâchoire"
              subtitle="Mesure au niveau de l'angle mandibulaire"
              icon="scan-outline"
              metricKey="neck"
              unit="cm"
            />

            <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Programme jawline</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {JAWLINE_SESSIONS.map((session) => {
                const active = selectedSession === session.id;
                return (
                  <Pressable
                    key={session.id}
                    onPress={() => handleSelectSession(session.id)}
                    style={[styles.splitChip, active && { backgroundColor: colors.accent + '1F', borderColor: colors.accent }]}
                  >
                    <Text style={{ fontSize: 16 }}>{session.emoji}</Text>
                    <Text style={[typography.bodyBold, active && { color: colors.accent }]}>{session.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {activeJawline && (
              <View style={styles.splitCard}>
                {activeJawline.exercises.map((ex) => (
                  <View key={ex.name} style={styles.exerciseRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={typography.bodyBold}>{ex.name}</Text>
                      <Text style={typography.caption}>{ex.reps}</Text>
                      <Text style={[typography.small, { marginTop: 4 }]}>{ex.tip}</Text>
                    </View>
                    <Pressable onPress={() => openSearch(`${ex.name} exercice jawline`)} hitSlop={8} style={styles.videoBtn}>
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
    goalsCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    goalsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    goalsInput: {
      flex: 1,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.sm,
      paddingVertical: 8,
      paddingHorizontal: spacing.sm,
      color: colors.text,
      fontSize: 15,
    },
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
