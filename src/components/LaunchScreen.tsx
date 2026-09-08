import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, ThemeColors } from '../theme/theme';
import { playLaunchChime } from '../utils/sound';

// A restrained fade + scale — no bounce, no spin, no particle burst. Reads
// as a calm, deliberate app opening rather than a game intro.
export function LaunchScreen({ duration = 2200 }: { duration?: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.94)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(8)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') playLaunchChime();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(logoScale, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, delay: 380, useNativeDriver: true }),
      Animated.timing(taglineTranslate, { toValue: 0, duration: 400, delay: 380, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    Animated.timing(barWidth, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/logo.png')}
        style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
        resizeMode="contain"
      />

      <Animated.Text
        style={[styles.tagline, { color: colors.textSecondary, opacity: taglineOpacity, transform: [{ translateY: taglineTranslate }] }]}
      >
        99 jours pour construire ta discipline
      </Animated.Text>

      <View style={styles.barTrack}>
        <Animated.View
          style={[styles.barFill, { backgroundColor: colors.accent, width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    // Mark-only logo (no wordmark baked in).
    logo: { width: 220, height: 220 * (428 / 1107) },
    tagline: { marginTop: spacing.xxl, fontFamily: fonts.semiBold, fontSize: 13, letterSpacing: 0.3 },
    barTrack: {
      marginTop: spacing.xl,
      width: 100,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.surfaceElevated,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 1.5 },
  });
}
