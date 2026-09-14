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
// Everything is decided once, at REVEAL_MS, rather than as data arrives: the
// store resolves within a few dozen milliseconds, and swapping the layout
// underneath someone mid-fade reads as a glitch. Until then only the mark
// shows, so both variants arrive as a reveal rather than a substitution.
const REVEAL_MS = 340;
// Below this the grid is a nearly empty box and the number is unimpressive —
// exactly the people you least want to underwhelm. They get the tagline, and
// the screen grows into the personal version with them.
const MIN_DAY_FOR_GRID = 4;

export function LaunchScreen({ duration = 1400 }: { duration?: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { loading, currentDay, habits } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  const dayValues = useDayValues();

  const activeCount = habits.filter((h) => !h.archived).length;
  const day = Math.max(currentDay, activeCount > 0 ? 1 : 0);

  const markOpacity = useRef(new Animated.Value(0)).current;
  const markScale = useRef(new Animated.Value(0.94)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const bodyTranslate = useRef(new Animated.Value(10)).current;

  const [revealed, setRevealed] = useState<{ day: number; values: number[] } | null>(null);
  const [revealDone, setRevealDone] = useState(false);

  // Read at reveal time rather than captured in the effect's closure, which
  // would freeze the loading-state defaults.
  const latest = useRef({ loading, day, dayValues });
  latest.current = { loading, day, dayValues };

  useEffect(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.parallel([
      Animated.timing(markOpacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(markScale, { toValue: 1, duration: 420, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      const { loading: busy, day: currentDayNow, dayValues: values } = latest.current;
      if (!busy && currentDayNow >= MIN_DAY_FOR_GRID) {
        setRevealed({ day: currentDayNow, values });
      }
      setRevealDone(true);
      Animated.parallel([
        Animated.timing(bodyOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(bodyTranslate, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, REVEAL_MS);

    return () => clearTimeout(timer);
  }, []);

  const accent = revealed ? progressColor(Math.min(revealed.day / TOTAL_DAYS, 1)) : colors.accent;

  return (
    <View style={styles.container}>
      {revealed && <AmbientBackdrop color={accent} />}

      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.mark, { opacity: markOpacity, transform: [{ scale: markScale }] }]}
        resizeMode="contain"
        // Rendered off-white rather than in the brand blue: the rest of the
        // screen shifts from blue to green with how far along you are, and a
        // fixed electric blue mark fought that badly at the green end.
        tintColor={colors.text}
      />

      {revealDone && (
        <Animated.View
          style={[styles.body, { opacity: bodyOpacity, transform: [{ translateY: bodyTranslate }] }]}
        >
          {revealed ? (
            <>
              <Text style={styles.kicker}>JOUR</Text>
              <Text style={styles.day}>{revealed.day}</Text>
            </>
          ) : (
            <Text style={styles.tagline}>99 jours pour construire ta discipline</Text>
          )}
        </Animated.View>
      )}

      {revealed && (
        <View style={styles.gridWrap}>
          <DayGrid
            values={revealed.values}
            currentDay={revealed.day}
            width={screenWidth - spacing.lg * 2}
          />
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: spacing.lg },
    // Mark-only logo (no wordmark baked in).
    mark: { marginTop: '18%', width: 104, height: 104 * (428 / 1107) },
    body: { alignItems: 'center', marginTop: spacing.xxl },
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
    // Normal flow pushed down with auto margin, and stretched explicitly.
    // Absolutely positioned between left and right looked equivalent but
    // wasn't: the container centres its children, so Yoga sized this box to
    // its content instead of the gap — and the content is a grid whose cells
    // are computed from the box's own measured width. Nothing resolved: zero
    // width, so zero cells, so zero width.
    gridWrap: { alignSelf: 'stretch', marginTop: 'auto', marginBottom: 88 },
  });
}
