import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, TOTAL_DAYS, ThemeColors } from '../theme/theme';
import { DayGrid } from './DayGrid';
import { AmbientBackdrop } from './AmbientBackdrop';
import { useDayValues } from '../hooks/useDayValues';
import { progressColor } from '../utils/progressColor';

// The old version held a logo, a tagline and a progress bar for two and a half
// seconds. The bar was the problem: nothing was loading behind it — fonts and
// storage are ready in a fraction of that — so it animated a duration decided
// in advance while the person waited. A fake gauge on an app you open several
// times a day, every day for ninety-nine days.
//
// The grid takes its place and doesn't lie: it sweeps in showing the person's
// actual challenge, so the hold is spent on information instead of decoration.
// It also means this screen isn't the same for everyone — day 3 is blue and
// nearly empty, day 90 is green and dense. Your app stops looking like mine.
//
// The variant is decided straight from the loaded state rather than latched
// behind a timer. The store resolves in a few dozen milliseconds, well inside
// the mark's own fade-in, so nobody sees the switch — and the earlier timer
// bought nothing while forcing the layout to change shape at 340ms.
const BODY_DELAY_MS = 260;
// The grid's own wave takes about this long, and the counter is tuned to land
// on the real number just before the last filled cell settles — so the figure
// stops climbing at the moment the block finishes.
const SEQUENCE_MS = 900;
const COUNT_LANDS_AT = 0.72;
// Below this a run is an attempt; past it, it's worth putting at stake.
const STREAK_WORTH_NAMING = 3;
// From the very first day, as soon as there's at least one habit to track.
// An empty grid was the argument for holding it back, but that argument cut
// the wrong way: day 1 is precisely when seeing ninety-nine empty days ahead
// means something. Someone with no habits at all still gets the tagline —
// a grid of nothing measures nothing.
const MIN_DAY_FOR_GRID = 1;

export function LaunchScreen({
  duration = 1400,
  frozen = false,
}: {
  duration?: number;
  /** Rendered as the dissolving cover over the app: same screen, already in
   *  its finished state, so nothing replays on the way out. */
  frozen?: boolean;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { loading, currentDay, habits, todayProgress, getStreak } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  const dayValues = useDayValues();

  const activeHabits = habits.filter((h) => !h.archived);
  const day = Math.max(currentDay, activeHabits.length > 0 ? 1 : 0);
  const streak = activeHabits.reduce((max, h) => Math.max(max, getStreak(h.id)), 0);
  const dayDone = todayProgress >= 1;

  // One value drives the whole opening: the grid laying itself down, the
  // number climbing to meet it, and the colour blooming behind both. Three
  // separate animations that merely overlap read as three animations; one
  // timeline with several instruments reads as a single movement.
  const sequence = useRef(new Animated.Value(frozen ? 1 : 0)).current;
  const [counted, setCounted] = useState(frozen ? 1 : 0);

  const markOpacity = useRef(new Animated.Value(frozen ? 1 : 0)).current;
  const markScale = useRef(new Animated.Value(1)).current;
  const bodyOpacity = useRef(new Animated.Value(frozen ? 1 : 0)).current;
  const bodyTranslate = useRef(new Animated.Value(frozen ? 0 : 10)).current;

  const personal = !loading && day >= MIN_DAY_FOR_GRID;

  useEffect(() => {
    const id = sequence.addListener(({ value }) => setCounted(value));
    return () => sequence.removeListener(id);
  }, [sequence]);

  useEffect(() => {
    if (frozen) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.timing(sequence, {
      toValue: 1,
      duration: SEQUENCE_MS,
      delay: BODY_DELAY_MS,
      easing: Easing.out(Easing.cubic),
      // The grid reads this value through interpolations on transform and
      // opacity, which the native driver can carry; the counter reads it
      // through a listener, which it cannot. The listener wins.
      useNativeDriver: false,
    }).start();

    markScale.setValue(0.94);
    Animated.parallel([
      Animated.timing(markOpacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(markScale, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(bodyOpacity, { toValue: 1, duration: 380, delay: BODY_DELAY_MS, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(bodyTranslate, { toValue: 0, duration: 380, delay: BODY_DELAY_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const accent = personal ? progressColor(Math.min(day / TOTAL_DAYS, 1)) : colors.accent;

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: sequence.interpolate({ inputRange: [0, 0.5], outputRange: [0, 1], extrapolate: 'clamp' }) }]}
      >
        <AmbientBackdrop color={accent} />
      </Animated.View>

      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.mark, { opacity: markOpacity, transform: [{ scale: markScale }] }]}
        resizeMode="contain"
        // Rendered off-white rather than in the brand blue: the rest of the
        // screen shifts from blue to green with how far along you are, and a
        // fixed electric blue mark fought that badly at the green end.
        tintColor={colors.text}
      />

      <Animated.View
        style={[styles.body, { opacity: bodyOpacity, transform: [{ translateY: bodyTranslate }] }]}
      >
        {personal ? (
          <>
            <Text style={styles.kicker}>JOUR</Text>
            <Text style={styles.day}>
              {Math.round(Math.min(counted / COUNT_LANDS_AT, 1) * day)}
            </Text>
            {/* What's at stake, stated as a fact rather than a nudge. The run
                you've built, and the hole still open in today — the gap between
                the two is the whole reason to stay in the app. */}
            {streak >= STREAK_WORTH_NAMING && !dayDone ? (
              <Text style={styles.stake}>
                {streak} jours d’affilée · aujourd’hui n’est pas encore fait
              </Text>
            ) : dayDone ? (
              <Text style={styles.stake}>journée validée</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.tagline}>99 jours pour construire ta discipline</Text>
        )}
      </Animated.View>

      {personal && (
        <View style={styles.gridWrap}>
          <DayGrid
            values={dayValues}
            currentDay={day}
            width={screenWidth - spacing.lg * 2}
            animate={!frozen}
            progress={frozen ? undefined : sequence}
          />
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Centred as one column, both variants. The previous version anchored the
    // mark near the top and let an auto margin push the grid to the bottom,
    // which only held together when there was a grid: on day 1 the tagline
    // variant left the logo stranded under the status bar above an empty
    // screen. And the top anchor was `marginTop: '18%'`, which resolves
    // against the parent's WIDTH, not its height — so it was never the 18% of
    // the screen it looked like.
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
    },
    // Mark-only logo (no wordmark baked in).
    mark: { width: 104, height: 104 * (428 / 1107) },
    body: { alignItems: 'center', marginTop: spacing.xl },
    kicker: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 3, color: colors.textTertiary },
    day: {
      fontFamily: fonts.display,
      fontSize: 112,
      lineHeight: 116,
      letterSpacing: -7,
      color: colors.text,
      marginTop: 6,
    },
    tagline: { fontFamily: fonts.semiBold, fontSize: 13, letterSpacing: 0.3, color: colors.textSecondary },
    stake: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: spacing.sm + 2,
      textAlign: 'center',
    },
    gridWrap: { alignSelf: 'stretch', marginTop: spacing.xxl },
  });
}
