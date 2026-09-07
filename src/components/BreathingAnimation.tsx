import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const PHASES = [
  { label: 'Inspire', duration: 4000 },
  { label: 'Retiens', duration: 2000 },
  { label: 'Expire', duration: 4000 },
];

export function BreathingAnimation({ size = 96 }: { size?: number }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.6)).current;
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    let index = 0;

    const runPhase = () => {
      if (!mounted) return;
      setPhaseIndex(index);
      const phase = PHASES[index];
      const toValue = phase.label === 'Inspire' ? 1 : phase.label === 'Expire' ? 0.6 : undefined;
      if (toValue !== undefined) {
        Animated.timing(scale, {
          toValue,
          duration: phase.duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
      setTimeout(() => {
        index = (index + 1) % PHASES.length;
        runPhase();
      }, phase.duration);
    };
    runPhase();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.accent + '22',
            borderColor: colors.accent,
            transform: [{ scale }],
          },
        ]}
      />
      <Text style={[styles.label, { color: colors.accent }]}>{PHASES[phaseIndex].label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', borderWidth: 2 },
  label: { fontFamily: 'Poppins_700Bold', fontSize: 13 },
});
