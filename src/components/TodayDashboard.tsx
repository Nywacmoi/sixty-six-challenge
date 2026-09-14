import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, radius, ThemeColors } from '../theme/theme';
import { RingProgress } from './RingProgress';
import { ProgressGlow } from './ProgressGlow';
import { progressColor, progressStatusLabel } from '../utils/progressColor';
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

const RING_SIZE = 212;
const GLOW_SIZE = 320;

// The day's readout, built around one focal point instead of a stack of
// equally-weighted widgets in a box. The ring carries the whole state —
// size, colour and label all move with progress — while streaks, level and
// XP drop back to supporting rows. No card: on a true-black background the
// surface + hairline border was mostly adding visual noise around content
// that reads fine on its own.
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

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(interval);
  }, [done]);

  const score = totalCount > 0 ? doneCount / totalCount : 0;
  const color = progressColor(score);
  const status = progressStatusLabel(doneCount, totalCount);
  const urgent = !done && remaining.hours < 2;

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <ProgressGlow color={color} size={GLOW_SIZE} />
        <RingProgress progress={score} size={RING_SIZE} strokeWidth={7} color={color}>
          <Text style={styles.pct}>{Math.round(score * 100)}%</Text>
          <Text style={styles.pctSub}>
            {doneCount} sur {totalCount} habitude{totalCount > 1 ? 's' : ''}
          </Text>
          <Text style={[styles.status, { color }]}>{status.toUpperCase()}</Text>
        </RingProgress>
      </View>

      {done ? (
        <Text style={styles.countLine}>journée validée · reviens demain</Text>
      ) : (
        <Text style={styles.countLine}>
          il te reste{' '}
          <Text style={[styles.countValue, urgent && { color: colors.danger }]}>
            {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
          </Text>
        </Text>
      )}

      <View style={styles.strip}>
        <View style={styles.cell}>
          <Text style={styles.cellValue}>{currentStreak}</Text>
          <Text style={styles.cellLabel}>SÉRIE</Text>
        </View>
        <View style={[styles.cell, styles.cellDivided]}>
          <Text style={styles.cellValue}>{bestStreak}</Text>
          <Text style={styles.cellLabel}>RECORD</Text>
        </View>
        <View style={[styles.cell, styles.cellDivided]}>
          <Text style={styles.cellValue}>{levelInfo.level}</Text>
          <Text style={styles.cellLabel}>NIVEAU</Text>
        </View>
      </View>

      <View style={styles.xpLine}>
        <View style={styles.xpTop}>
          <Text style={styles.xpNext}>NIVEAU {levelInfo.level + 1}</Text>
          <Text style={styles.xpValue}>
            {levelInfo.xpIntoLevel} / {levelInfo.xpForNextLevel} XP
          </Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${Math.round(levelInfo.progress * 100)}%` }]} />
        </View>
      </View>

      {streakFreezes > 0 && (
        <View style={styles.shieldRow}>
          <Ionicons name="shield-checkmark-outline" size={12} color={colors.textTertiary} />
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
    wrap: { marginTop: spacing.xs },
    hero: { alignItems: 'center', justifyContent: 'center', height: RING_SIZE + spacing.lg },
    pct: { fontFamily: fonts.display, fontSize: 52, color: colors.text, letterSpacing: -2.5, lineHeight: 58 },
    pctSub: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    status: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1.4, marginTop: 3 },
    countLine: {
      fontFamily: fonts.medium,
      fontSize: 12.5,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
    countValue: { fontFamily: fonts.bold, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
    strip: {
      flexDirection: 'row',
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: spacing.md - 3,
    },
    cell: { flex: 1, alignItems: 'center' },
    cellDivided: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },
    cellValue: { fontFamily: fonts.bold, fontSize: 19, color: colors.text },
    cellLabel: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1.1, color: colors.textTertiary, marginTop: 3 },
    xpLine: { marginHorizontal: spacing.lg, marginTop: spacing.md - 3 },
    xpTop: { flexDirection: 'row', justifyContent: 'space-between' },
    xpNext: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.6, color: colors.textTertiary },
    xpValue: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.6, color: colors.gold },
    xpTrack: {
      height: 3,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.pill,
      marginTop: 6,
      overflow: 'hidden',
    },
    xpFill: { height: '100%', backgroundColor: colors.gold, borderRadius: radius.pill },
    shieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: spacing.md },
    shieldText: { fontFamily: fonts.medium, fontSize: 10.5, color: colors.textTertiary },
  });
}
