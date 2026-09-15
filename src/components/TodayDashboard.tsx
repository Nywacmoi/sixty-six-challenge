import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, radius, ThemeColors } from '../theme/theme';
import { RingProgress } from './RingProgress';
import { StatStrip } from './StatStrip';
import { progressColor, progressStatusLabel } from '../utils/progressColor';
import { getMotivation } from '../data/motivation';
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

// The ring got bigger and much thinner at the same time, and the number inside
// it roughly doubled. That inversion is the point: at a 7px stroke the ring
// competed with the figure it was supposed to frame, and a 52px number on a
// 212px ring left a hole in the middle of the screen's one focal point. Now the
// number is the object and the ring is its outline.
const RING_SIZE = 228;
const RING_STROKE = 5;

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
  play = true,
}: {
  doneCount: number;
  totalCount: number;
  bestStreak: number;
  currentStreak: number;
  streakFreezes: number;
  done: boolean;
  levelInfo: LevelInfo;
  /** False while the morning check-in covers this screen: the ring would
   *  otherwise fill, the number count up and the colour travel from blue to
   *  green entirely behind an opaque overlay, leaving a finished, static
   *  screen behind once it closes. */
  play?: boolean;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [remaining, setRemaining] = useState(getRemaining());

  // Day one used to open on five zeros — 0%, 0 sur 4, 0 SÉRIE, 0 RECORD,
  // 0/100 XP — and pushed the first habit row to 623px on an 812px screen,
  // under the tab bar. The one thing the app wants from you was off-screen,
  // below a wall of counters that were measuring nothing yet. They stay
  // hidden until there is something to count.
  //
  // Frozen at mount, not recomputed: revealing the strip the instant the
  // first habit is ticked would push the list down under the finger that
  // just tapped it, and the next tap would land on the wrong row. The
  // reveal waits for the next time the screen is opened. Safe to freeze —
  // RootNavigator renders nothing until the store has loaded, so these
  // props are never the momentary zeros of an empty state.
  const [nothingToCount] = useState(
    () => bestStreak === 0 && currentStreak === 0 && levelInfo.level === 1 && levelInfo.xpIntoLevel === 0
  );

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(interval);
  }, [done]);

  const score = totalCount > 0 ? doneCount / totalCount : 0;

  // The ring, the percentage and the colour all read off one animated value
  // so they can never drift out of sync. It starts at zero and fills on
  // mount — opening the screen replays the day's progress rather than
  // snapping straight to the final number, which is the whole point of
  // having a focal point. Ticking a habit re-runs it from wherever it was.
  const anim = useRef(new Animated.Value(0)).current;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value }) => setDisplayed(value));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    if (!play) return;
    // Timing, not spring: a spring overshoots, and a ring that flashes
    // "104%" before settling looks broken rather than lively.
    Animated.timing(anim, {
      toValue: score,
      duration: 750,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [score, anim, play]);

  const color = progressColor(displayed);
  const status = progressStatusLabel(doneCount, totalCount);
  const urgent = !done && remaining.hours < 2;
  const motivation = getMotivation({
    doneCount,
    totalCount,
    hoursLeft: remaining.hours,
    streak: currentStreak,
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <RingProgress progress={displayed} size={RING_SIZE} strokeWidth={RING_STROKE} color={color}>
          <Text style={styles.pct}>
            {Math.round(displayed * 100)}
            <Text style={styles.pctSign}>%</Text>
          </Text>
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

      {motivation && <Text style={styles.motivation}>{motivation}</Text>}

      {!nothingToCount && (
        <>
          <StatStrip
            style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg }}
            items={[
              { value: currentStreak, label: 'SÉRIE' },
              { value: bestStreak, label: 'RECORD' },
              { value: levelInfo.level, label: 'NIVEAU' },
            ]}
          />

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
        </>
      )}

      {!nothingToCount && streakFreezes > 0 && (
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
    pct: { fontFamily: fonts.display, fontSize: 86, color: colors.text, letterSpacing: -4.5, lineHeight: 90 },
    pctSign: { fontFamily: fonts.display, fontSize: 40, color: colors.text, letterSpacing: -2 },
    pctSub: { fontFamily: fonts.medium, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
    status: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 1.4, marginTop: 3 },
    countLine: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    // The one thing on this screen that moves on its own. At 12.5 it was
    // dwarfed by an 86px number and read as a footnote; tabular figures stop
    // the seconds from jittering the whole line every tick.
    countValue: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, fontVariant: ['tabular-nums'] },
    motivation: {
      fontFamily: fonts.medium,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
      marginHorizontal: spacing.xl,
    },
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
