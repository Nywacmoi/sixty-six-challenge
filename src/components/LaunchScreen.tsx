import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { fonts, spacing, ThemeColors } from '../theme/theme';
import { playLaunchChime } from '../utils/sound';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const PARTICLE_COUNT = 10;
const RING_COUNT = 3;

export function LaunchScreen({ duration = 2500 }: { duration?: number }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const glowScale = useRef(new Animated.Value(0.8)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoRotate = useRef(new Animated.Value(-1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const idlePulse = useRef(new Animated.Value(1)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslate = useRef(new Animated.Value(18)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(new Animated.Value(0)).current;
  const rings = useRef(Array.from({ length: RING_COUNT }, () => ({ scale: new Animated.Value(0.7), opacity: new Animated.Value(0.6) }))).current;

  useEffect(() => {
    if (Platform.OS === 'web') playLaunchChime();
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Slow ambient breathing glow behind everything, running the whole time.
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.15, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 0.8, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Sonar rings, staggered so they radiate out one after another.
    rings.forEach((ring, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 350),
          Animated.parallel([
            Animated.timing(ring.scale, { toValue: 1.8, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(ring.opacity, { toValue: 0, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.timing(ring.scale, { toValue: 0.7, duration: 0, useNativeDriver: true }),
          Animated.timing(ring.opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
          Animated.delay((RING_COUNT - 1 - i) * 350),
        ])
      ).start();
    });

    // Logo: bounce + flourish spin in, then settle into a slow idle pulse.
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 9, bounciness: 14 }),
      Animated.timing(logoRotate, { toValue: 0, duration: 650, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(idlePulse, { toValue: 1.05, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(idlePulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    });

    // One-shot spark burst radiating from the logo as it lands.
    Animated.timing(particleAnim, { toValue: 1, duration: 900, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

    // Wordmark and tagline follow the logo in, then the progress bar fills
    // over the whole splash duration so it visually "completes" on cue.
    Animated.parallel([
      Animated.timing(wordmarkOpacity, { toValue: 1, duration: 450, delay: 450, useNativeDriver: true }),
      Animated.timing(wordmarkTranslate, { toValue: 0, duration: 450, delay: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.timing(taglineOpacity, { toValue: 1, duration: 450, delay: 700, useNativeDriver: true }).start();
    Animated.timing(barWidth, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, []);

  const logoRotateDeg = logoRotate.interpolate({ inputRange: [-1, 0], outputRange: ['-25deg', '0deg'] });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, { backgroundColor: colors.accent, transform: [{ scale: glowScale }] }]} />

      <View style={styles.logoWrap}>
        {rings.map((ring, i) => (
          <Animated.View
            key={i}
            style={[styles.ring, { borderColor: colors.accent, transform: [{ scale: ring.scale }], opacity: ring.opacity }]}
          />
        ))}

        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
          const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
          const dist = 100;
          const translateX = particleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] });
          const translateY = particleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist] });
          const opacity = particleAnim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });
          const scale = particleAnim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.2, 1, 0.3] });
          return (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  backgroundColor: i % 2 === 0 ? colors.accent : colors.gold,
                  opacity,
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
            />
          );
        })}

        <Animated.Image
          source={require('../../assets/logo.png')}
          style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: Animated.multiply(logoScale, idlePulse) }, { rotate: logoRotateDeg }] }]}
          resizeMode="contain"
        />
      </View>

      <Animated.Text
        style={[styles.wordmark, { color: colors.text, opacity: wordmarkOpacity, transform: [{ translateY: wordmarkTranslate }] }]}
      >
        DÉFI 99
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { color: colors.textSecondary, opacity: taglineOpacity }]}>
        99 jours pour construire ta discipline
      </Animated.Text>

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
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, overflow: 'hidden' },
    glow: { position: 'absolute', width: 320, height: 320, borderRadius: 160, opacity: 0.16 },
    logoWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 2 },
    particle: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
    logo: { width: 150, height: 150 * (605 / 1135) },
    wordmark: {
      marginTop: spacing.lg,
      fontFamily: fonts.display,
      fontSize: 34,
      letterSpacing: 1.5,
    },
    tagline: { marginTop: spacing.sm, fontFamily: fonts.semiBold, fontSize: 13, letterSpacing: 0.3 },
    barTrack: {
      marginTop: spacing.xl,
      width: 120,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surfaceElevated,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 2, overflow: 'hidden' },
  });
}
