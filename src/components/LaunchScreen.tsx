import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, ThemeColors } from '../theme/theme';
import { playLaunchChime } from '../utils/sound';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// The checkmark's path length in its own 100x100 viewBox — used to drive
// the stroke-draw-in (strokeDashoffset from this value down to 0).
const CHECK_PATH = 'M20,54 L42,78 L82,22';
const CHECK_PATH_LENGTH = 112;

// Inspired by a reference splash (bold mark line-draws itself on black,
// then thickens into a solid, before the app reveals itself) — reinterpreted
// with a checkmark (this app's own daily-habit motif) instead of tracing our
// actual wordmark, since that's a flat logo lockup with no vector path to
// stroke-draw. Deliberately theme-independent (fixed dark) like most native
// splash screens, rather than following the in-app light/dark toggle.
export function LaunchScreen({ duration = 2500 }: { duration?: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const dashOffset = useRef(new Animated.Value(CHECK_PATH_LENGTH)).current;
  const strokeWidth = useRef(new Animated.Value(9)).current;
  const checkScale = useRef(new Animated.Value(0.9)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const lockupOpacity = useRef(new Animated.Value(0)).current;
  const lockupTranslate = useRef(new Animated.Value(10)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') playLaunchChime();

    Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    // Draw the checkmark stroke, then "fill" it by thickening the line and
    // popping it slightly — the outline-to-solid moment from the reference.
    Animated.sequence([
      Animated.timing(dashOffset, {
        toValue: 0,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.parallel([
        Animated.timing(strokeWidth, { toValue: 30, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: false }),
        Animated.sequence([
          Animated.timing(checkScale, { toValue: 1.15, duration: 140, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }),
        ]),
        Animated.timing(glowOpacity, { toValue: 0.22, duration: 300, useNativeDriver: true }),
      ]),
    ]).start(() => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    });

    // Brand lockup + wordmark settle in right after the checkmark solidifies.
    Animated.parallel([
      Animated.timing(lockupOpacity, { toValue: 1, duration: 450, delay: 950, useNativeDriver: true }),
      Animated.timing(lockupTranslate, { toValue: 0, duration: 450, delay: 950, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.timing(taglineOpacity, { toValue: 1, duration: 400, delay: 1150, useNativeDriver: true }).start();

    Animated.timing(barWidth, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, { backgroundColor: colors.accent, opacity: glowOpacity }]} />

      <Animated.View style={{ opacity: checkOpacity, transform: [{ scale: checkScale }] }}>
        <Svg width={112} height={112} viewBox="0 0 100 100">
          <AnimatedPath
            d={CHECK_PATH}
            fill="none"
            stroke={colors.accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={[CHECK_PATH_LENGTH, CHECK_PATH_LENGTH]}
            strokeDashoffset={dashOffset}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={{ alignItems: 'center', opacity: lockupOpacity, transform: [{ translateY: lockupTranslate }] }}>
        <Image source={require('../../assets/logo.png')} style={styles.lockup} resizeMode="contain" />
        <Animated.Text style={[styles.tagline, { color: '#9B9B9F', opacity: taglineOpacity }]}>
          99 jours pour construire ta discipline
        </Animated.Text>
      </Animated.View>

      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}>
          <AnimatedLinearGradient
            colors={[colors.accent, colors.gold]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Fixed dark background regardless of the app's light/dark setting —
    // see the note above the component.
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0B0B0D', overflow: 'hidden' },
    glow: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
    lockup: { width: 190, height: 190 * (605 / 1135), marginTop: spacing.xl },
    tagline: { marginTop: spacing.sm, fontFamily: fonts.semiBold, fontSize: 13, letterSpacing: 0.3 },
    barTrack: {
      position: 'absolute',
      bottom: 64,
      width: 120,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#232326',
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
  });
}
