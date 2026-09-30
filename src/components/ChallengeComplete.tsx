import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, TOTAL_DAYS, ThemeColors } from '../theme/theme';
import { DayGrid } from './DayGrid';
import { PrimaryButton } from './PrimaryButton';
import { progressColor } from '../utils/progressColor';

// What Aujourd'hui shows once the 99 days are behind you.
//
// Before this, the finish line of a 99-day challenge was a four-word
// fragment on Progression — "· défi terminé" — while Aujourd'hui kept saying
// JOUR 99 SUR 99 · reviens demain, forever, to someone who had finished weeks
// earlier. The completed grid is the best image the app makes, and nobody
// ever saw it as an arrival.
//
// So the grid leads, full and in its final colours, then a verdict that
// depends on how it actually went, then the one thing worth doing next.
// The habit list stays underneath: streaks don't stop because a challenge
// did, and someone may simply want to keep ticking.
const HIGH_BAR = 0.8;
const WAVE_MS = 1100;

export function ChallengeComplete({
  dayValues,
  rate,
  bestStreak,
  nextChallenge,
  onStartNext,
  onShare,
  play = true,
}: {
  dayValues: number[];
  /** Mean of `dayValues` — the same number Progression shows. */
  rate: number;
  bestStreak: number;
  /** The number the next challenge will carry, for the button label. */
  nextChallenge: number;
  onStartNext: () => void;
  onShare: () => void;
  /** Held back while the morning check-in covers the screen, like the
   *  dashboard it replaces — the wave is the moment, and it shouldn't play
   *  to an overlay. */
  play?: boolean;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const wave = useRef(new Animated.Value(0)).current;
  const body = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!play) return;
    Animated.sequence([
      Animated.timing(wave, { toValue: 1, duration: WAVE_MS, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.timing(body, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [play, wave, body]);

  const pct = Math.round(rate * 100);
  // A callback to the first screen anyone sees — "92% abandonnent leurs
  // objectifs. 8% ont un système." — made only when it's earned. Below the
  // bar the sentence doesn't pretend otherwise, and doesn't scold either:
  // reaching day 99 at all is already the rarer outcome.
  const verdict =
    rate >= HIGH_BAR ? 'Tu fais partie des 8%.' : 'Jusqu’au bout. Le prochain peut être plus régulier.';

  return (
    <View style={styles.wrap}>
      {/* Past day 99 there is no "today" cell: every square is a day that has
          been lived, so the grid is drawn from one step beyond the last. */}
      <DayGrid values={dayValues} currentDay={TOTAL_DAYS + 1} progress={wave} />

      <Animated.View
        style={{ opacity: body, transform: [{ translateY: body.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}
      >
        <Text style={[styles.title, { color: progressColor(1) }]}>99 jours.</Text>
        <Text style={styles.verdict}>{verdict}</Text>
        <Text style={styles.stats}>
          {pct}% DE RÉUSSITE · MEILLEURE SÉRIE {bestStreak} JOUR{bestStreak > 1 ? 'S' : ''}
        </Text>

        <PrimaryButton label={`Commencer le défi ${nextChallenge}`} onPress={onStartNext} style={{ marginTop: spacing.lg }} />
        <Pressable onPress={onShare} style={styles.share} accessibilityRole="button">
          <Text style={styles.shareText}>Partager ma grille</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.textSecondary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
    title: {
      fontFamily: fonts.display,
      fontSize: 44,
      lineHeight: 48,
      letterSpacing: -1.6,
      marginTop: spacing.lg,
    },
    verdict: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22, color: colors.text, marginTop: spacing.xs },
    stats: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, color: colors.textTertiary, marginTop: spacing.md },
    share: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    shareText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.textSecondary },
  });
}
