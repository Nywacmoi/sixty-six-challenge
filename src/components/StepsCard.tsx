import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';
import { RingProgress } from './RingProgress';
import { useTodaySteps } from '../hooks/useTodaySteps';
import { parseStepGoal } from '../utils/stepGoal';

export function StepsCard({ habitName }: { habitName: string }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);
  const { steps, available, permissionDenied } = useTodaySteps();
  const goal = parseStepGoal(habitName);

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.card}>
        <Ionicons name="walk-outline" size={20} color={colors.textTertiary} />
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          Le comptage de pas en direct n'est disponible que dans l'app iOS pour l'instant.
        </Text>
      </View>
    );
  }

  if (!available) {
    return (
      <View style={styles.card}>
        <Ionicons name="walk-outline" size={20} color={colors.textTertiary} />
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          Ton appareil ne propose pas de capteur de pas (normal sur le simulateur).
        </Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.card}>
        <Ionicons name="walk-outline" size={20} color={colors.textTertiary} />
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          Autorise l'accès Motion & Fitness dans Réglages pour voir tes pas du jour ici.
        </Text>
      </View>
    );
  }

  const count = steps ?? 0;
  const progress = goal > 0 ? count / goal : 0;
  const remaining = Math.max(0, goal - count);

  return (
    <View style={[styles.card, styles.readyCard]}>
      <RingProgress progress={progress} size={96} strokeWidth={9} color={colors.accent}>
        <Text style={[styles.count, { color: colors.text }]}>{count.toLocaleString('fr-FR')}</Text>
        <Text style={[typography.small, { color: colors.textTertiary }]}>/ {goal.toLocaleString('fr-FR')}</Text>
      </RingProgress>
      <Text style={[typography.caption, { marginTop: spacing.md, textAlign: 'center' }]}>
        {remaining > 0 ? `Encore ${remaining.toLocaleString('fr-FR')} pas pour ton objectif.` : "Objectif atteint aujourd'hui !"}
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
    },
    readyCard: { alignItems: 'center' },
    count: { fontFamily: typography.display.fontFamily, fontSize: 22, letterSpacing: -0.4 },
  });
}
