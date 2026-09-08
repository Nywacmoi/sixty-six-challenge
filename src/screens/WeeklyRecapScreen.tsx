import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirm } from '../context/ConfirmContext';
import { spacing, radius, ThemeColors, Typography } from '../theme/theme';
import { useTopInset } from '../hooks/useTopInset';
import { RingProgress } from '../components/RingProgress';
import { ShareCard, CARD_WIDTH, CARD_HEIGHT } from '../components/ShareCard';
import { addDays, todayKey, formatDayLabel } from '../utils/date';

function last7Ending(dateKey: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(dateKey, -(6 - i)));
}

export default function WeeklyRecapScreen({ navigation }: any) {
  const { habits, isCompleted, getStreak, profile, currentDay } = useApp();
  const { colors, typography } = useTheme();
  const { notify } = useConfirm();
  const styles = createStyles(colors, typography);
  const topInset = useTopInset();
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

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

  const handleShare = async () => {
    if (!cardRef.current || sharing) return;
    setSharing(true);
    try {
      if (Platform.OS === 'web') {
        const dataUri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'data-uri' });
        const res = await fetch(dataUri);
        const blob = await res.blob();
        const file = new File([blob], 'defi99-recap.png', { type: 'image/png' });
        const nav = navigator as any;
        if (nav.canShare && nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: 'Défi 99' });
        } else {
          const link = document.createElement('a');
          link.href = dataUri;
          link.download = 'defi99-recap.png';
          link.click();
        }
      } else {
        const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
        const available = await Sharing.isAvailableAsync();
        if (available) await Sharing.shareAsync(uri);
      }
    } catch (e: any) {
      // A user cancelling the native share sheet also lands here — only
      // surface a real error, not a routine cancellation.
      if (e?.name !== 'AbortError') {
        notify('Partage impossible', "Réessaie dans un instant.");
      }
    } finally {
      setSharing(false);
    }
  };

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
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
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

        <Text style={[typography.h2, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Partager</Text>
        <View style={styles.shareSection}>
          <View style={styles.cardScaler}>
            <ShareCard
              ref={cardRef}
              profile={profile}
              currentDay={currentDay}
              checkIns={stats.totalThisWeek}
              perfectDays={stats.perfectDays}
              bestStreak={stats.bestStreak}
              colors={colors}
              typography={typography}
            />
          </View>
          <Pressable onPress={handleShare} disabled={sharing} style={[styles.shareBtn, sharing && { opacity: 0.6 }]}>
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
            <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>{sharing ? 'Un instant…' : 'Partager ma semaine'}</Text>
          </Pressable>
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
                <Ionicons name={stats.best.habit.icon as any} size={18} color={stats.best.habit.color} />
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
                <Ionicons name={stats.weakest.habit.icon as any} size={18} color={stats.weakest.habit.color} />
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
    shareSection: { alignItems: 'center', gap: spacing.md },
    cardScaler: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 6,
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      alignSelf: 'stretch',
      justifyContent: 'center',
    },
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
  });
}
