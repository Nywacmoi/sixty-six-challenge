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
// From the very first day, as soon as there's at least one habit to track.
// An empty grid was the argument for holding it back, but that argument cut
// the wrong way: day 1 is precisely when seeing ninety-nine empty days ahead
// means something. Someone with no habits at all still gets the tagline —
// a grid of nothing measures nothing.
const MIN_DAY_FOR_GRID = 1;

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

  const personal = !loading && day >= MIN_DAY_FOR_GRID;

  useEffect(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

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
      <AmbientBackdrop color={accent} />

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
            <Text style={styles.day}>{day}</Text>
          </>
        ) : (
          <Text style={styles.tagline}>99 jours pour construire ta discipline</Text>
        )}
      </Animated.View>

      {personal && (
        <View style={styles.gridWrap}>
          <DayGrid values={dayValues} currentDay={day} width={screenWidth - spacing.lg * 2} />
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
    gridWrap: { alignSelf: 'stretch', marginTop: spacing.xxl },
  });
}
