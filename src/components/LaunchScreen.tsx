import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, Easing, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { spacing, ThemeColors } from '../theme/theme';
import { playLaunchChime } from '../utils/sound';

export function LaunchScreen({ duration = 2500 }: { duration?: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const ringScale = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') playLaunchChime();

    Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, { toValue: 1.5, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 10, bounciness: 10 }),
    ]).start();
    Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.timing(taglineOpacity, { toValue: 1, duration: 500, delay: 350, useNativeDriver: true }).start();
    Animated.timing(barWidth, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Animated.View
          style={[
            styles.ring,
            { borderColor: colors.accent, transform: [{ scale: ringScale }], opacity: ringOpacity },
          ]}
        />
        <Animated.Image
          source={require('../../assets/logo.png')}
          style={[styles.logo, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}
          resizeMode="contain"
        />
      </View>
      <Animated.Text style={[styles.tagline, { color: colors.textSecondary, opacity: taglineOpacity }]}>
        99 jours pour construire ta discipline
      </Animated.Text>
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            { backgroundColor: colors.accent, width: barWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    logoWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 2 },
    logo: { width: 140, height: 140 },
    tagline: { marginTop: spacing.lg, fontFamily: 'Poppins_600SemiBold', fontSize: 13, letterSpacing: 0.3 },
    barTrack: {
      marginTop: spacing.xl,
      width: 120,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.surfaceElevated,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 2 },
  });
}
