import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { RingProgress } from './RingProgress';
import { LevelInfo } from '../utils/gamification';

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

// Abbreviated on purpose: the full name ("mercredi", "vendredi"...) next to
// the two stat columns was wrapping to two lines on narrow phones.
const DAY_LABELS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

function statusForScore(score: number, colors: ThemeColors) {
  if (score >= 1) return { label: 'Parfait', color: colors.success };
  if (score >= 0.66) return { label: 'Solide', color: colors.success };
  if (score >= 0.34) return { label: 'En cours', color: colors.gold };
  return { label: 'À la traîne', color: colors.danger };
}

// A dashboard-style readout card — day/date + best-vs-current streak stay
// (asked for explicitly), the flat "3/4" pill is now a score ring with a
// colored status (like a recovery reading), and a compact XP/level row
// surfaces the app's existing level system right where habits get checked.
export function TodayDashboard({
  doneCount,
  totalCount,
  bestStreak,
  currentStreak,
  streakFreezes,
  done,
  levelInfo,
}: {
  doneCount: number;
  totalCount: number;
  bestStreak: number;
  currentStreak: number;
  streakFreezes: number;
  done: boolean;
  levelInfo: LevelInfo;
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
  const score = totalCount > 0 ? doneCount / totalCount : 0;
  const status = statusForScore(score, colors);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.dateLabel}>
          {DAY_LABELS[now.getDay()]} {now.getDate()}
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>MEILLEURE SÉRIE</Text>
            <Text style={styles.statValue}>{bestStreak}</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>SÉRIE ACTUELLE</Text>
            <Text style={styles.statValue}>{currentStreak}</Text>
          </View>
        </View>
      </View>

      {done ? (
        <View style={styles.timeRow}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={[styles.doneLabel, { color: colors.success }]} numberOfLines={1}>
            Terminé
          </Text>
        </View>
      ) : (
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>Temps restant</Text>
          <Text style={[styles.time, urgent && { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
            {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
          </Text>
        </View>
      )}

      <View style={[styles.statusPill, { backgroundColor: status.color + '1F', borderColor: status.color + '55' }]}>
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
      </View>

      <View style={styles.ringSection}>
        <RingProgress progress={score} size={112} strokeWidth={10} color={status.color}>
          <Text style={styles.ringPct}>{Math.round(score * 100)}%</Text>
          <Text style={styles.ringSub}>
            {doneCount}/{totalCount}
          </Text>
        </RingProgress>
      </View>

      <View style={styles.xpRow}>
        <View style={styles.xpBadge}>
          <Ionicons name="flash" size={12} color="#2B1900" />
          <Text style={styles.xpBadgeText}>{levelInfo.level}</Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${Math.round(levelInfo.progress * 100)}%` }]} />
        </View>
        <Text style={styles.xpLabel}>
          {levelInfo.xpIntoLevel}
          <Text style={styles.xpLabelMuted}>/{levelInfo.xpForNextLevel} XP</Text>
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
      overflow: 'hidden',
      maxWidth: '100%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    dateLabel: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.textSecondary,
      textTransform: 'capitalize',
      marginTop: 6,
      flexShrink: 1,
    },
    statsRow: { flexDirection: 'row', gap: spacing.md, flexShrink: 0 },
    statBlock: { alignItems: 'flex-end' },
    statLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.textTertiary, letterSpacing: 0.5 },
    statValue: { fontFamily: fonts.monoBold, fontSize: 22, color: colors.text },
    timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
    timeLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textTertiary },
    time: {
      fontFamily: fonts.monoBold,
      fontSize: 20,
      color: colors.text,
      fontVariant: ['tabular-nums'],
    },
    doneLabel: {
      fontFamily: fonts.monoBold,
      fontSize: 20,
      flexShrink: 1,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'center',
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingVertical: 4,
      paddingHorizontal: 10,
      marginTop: spacing.md,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontFamily: fonts.semiBold, fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase' },
    ringSection: { alignItems: 'center', marginTop: spacing.md },
    ringPct: { fontFamily: fonts.extraBold, fontSize: 27, color: colors.text, letterSpacing: -0.6 },
    ringSub: { fontFamily: fonts.medium, fontSize: 11, color: colors.textTertiary, marginTop: 2 },
    xpRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: spacing.lg },
    xpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.gold,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: radius.pill,
    },
    xpBadgeText: { fontFamily: fonts.bold, fontSize: 12, color: '#2B1900' },
    xpTrack: { flex: 1, height: 6, backgroundColor: colors.surfaceElevated, borderRadius: radius.pill, overflow: 'hidden' },
    xpFill: { height: '100%', backgroundColor: colors.gold, borderRadius: radius.pill },
    xpLabel: { fontFamily: fonts.bold, fontSize: 11, color: colors.text },
    xpLabelMuted: { fontFamily: fonts.medium, color: colors.textTertiary },
    shieldRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, justifyContent: 'center' },
    shieldText: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary },
  });
}
