import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors } from '../theme/theme';

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

export function CountdownTimer({ done = false }: { done?: boolean }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [remaining, setRemaining] = useState(getRemaining());

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => setRemaining(getRemaining()), 1000);
    return () => clearInterval(interval);
  }, [done]);

  if (done) {
    return (
      <View style={[styles.container, { backgroundColor: colors.success + '14' }]}>
        <Ionicons name="checkmark-circle" size={15} color={colors.success} />
        <Text style={[styles.time, { color: colors.success }]}>Journée complétée</Text>
        <Text style={styles.label}>bravo !</Text>
      </View>
    );
  }

  const urgent = remaining.hours < 2;

  return (
    <View style={[styles.container, urgent && styles.containerUrgent]}>
      <Ionicons name="time-outline" size={15} color={urgent ? colors.danger : colors.accent} />
      <Text style={[styles.time, urgent && { color: colors.danger }]}>
        {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
      </Text>
      <Text style={styles.label}>restant aujourd'hui</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accent + '14',
      borderRadius: radius.pill,
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
      alignSelf: 'flex-start',
    },
    containerUrgent: {
      backgroundColor: colors.danger + '14',
    },
    time: {
      fontFamily: 'Poppins_700Bold',
      fontSize: 13,
      color: colors.accent,
      fontVariant: ['tabular-nums'],
    },
    label: {
      fontFamily: 'Poppins_500Medium',
      fontSize: 11,
      color: colors.textSecondary,
    },
  });
}
