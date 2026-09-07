import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors, Typography } from '../theme/theme';

export function ShareDayCta({ day, onPress }: { day: number; onPress: () => void }) {
  const { colors, typography } = useTheme();
  const styles = createStyles(colors, typography);

  return (
    <Pressable style={styles.shareCta} onPress={onPress}>
      <Text style={[typography.bodyBold, { color: colors.accent }]}>
        Jour {day} terminé. Partager
      </Text>
      <Ionicons name="arrow-forward" size={16} color={colors.accent} />
    </Pressable>
  );
}

function createStyles(colors: ThemeColors, typography: Typography) {
  return StyleSheet.create({
    shareCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1.5,
      borderColor: colors.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm + 2,
    },
  });
}
